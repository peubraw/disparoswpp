"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-utils";
import { CampaignStatus, WaInstanceStatus, MessageStatus } from "@prisma/client";

export interface DashboardStats {
  connectedInstances: number;
  totalInstances: number;
  campaignsToday: number;
  messagesToday: number;
  deliveryRateToday: number;
  recentCampaigns: Array<{
    id: string;
    name: string;
    status: string;
    sentCount: number;
    totalCount: number;
    createdAt: Date;
  }>;
  instances: Array<{
    id: string;
    instanceName: string;
    status: string;
    phoneNumber: string | null;
  }>;
  chartData: Array<{
    date: string;
    sent: number;
    delivered: number;
  }>;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const user = await getCurrentUser();
  const userId = user.id;

  // Get today's date range
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  // Last 7 days range
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const [instances, campaignsToday, messagesToday, recentCampaigns, last7DaysMessages] = await Promise.all([
    // WA Instances
    prisma.waInstance.findMany({
      where: { userId },
      select: { id: true, instanceName: true, status: true, phoneNumber: true },
    }),
    // Campaigns started today
    prisma.campaign.count({
      where: {
        userId,
        status: CampaignStatus.RUNNING,
        createdAt: { gte: todayStart, lte: todayEnd },
      },
    }),
    // Messages sent today
    prisma.message.findMany({
      where: {
        campaign: { userId },
        createdAt: { gte: todayStart, lte: todayEnd },
      },
      select: { status: true },
    }),
    // Recent campaigns (last 5)
    prisma.campaign.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        _count: { select: { messages: true } },
        messages: {
          where: { status: { in: [MessageStatus.SENT, MessageStatus.DELIVERED, MessageStatus.READ] } },
          select: { id: true },
        },
      },
    }),
    // Messages for chart (last 7 days)
    prisma.message.findMany({
      where: {
        campaign: { userId },
        createdAt: { gte: sevenDaysAgo },
      },
      select: { status: true, createdAt: true },
    }),
  ]);

  const connectedInstances = instances.filter(i => i.status === WaInstanceStatus.CONNECTED).length;
  const nonPendingToday = messagesToday.filter(m => m.status !== MessageStatus.PENDING).length;
  const sentToday = messagesToday.filter(m => m.status !== MessageStatus.FAILED && m.status !== MessageStatus.PENDING).length;
  const deliveryRateToday = nonPendingToday > 0 ? Math.round((sentToday / nonPendingToday) * 100) : 0;

  // Build chart data - group by date
  const chartMap = new Map<string, { sent: number; delivered: number }>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    chartMap.set(key, { sent: 0, delivered: 0 });
  }
  for (const msg of last7DaysMessages) {
    const key = msg.createdAt.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    const entry = chartMap.get(key);
    if (!entry) continue;
    if (msg.status !== MessageStatus.PENDING && msg.status !== MessageStatus.FAILED) entry.sent++;
    if (msg.status === MessageStatus.DELIVERED || msg.status === MessageStatus.READ) entry.delivered++;
  }
  const chartData = Array.from(chartMap.entries()).map(([date, v]) => ({ date, ...v }));

  return {
    connectedInstances,
    totalInstances: instances.length,
    campaignsToday,
    messagesToday: sentToday,
    deliveryRateToday,
    recentCampaigns: recentCampaigns.map(c => ({
      id: c.id,
      name: c.name,
      status: c.status,
      sentCount: c.messages.length,
      totalCount: c._count.messages,
      createdAt: c.createdAt,
    })),
    instances: instances.map(i => ({
      id: i.id,
      instanceName: i.instanceName,
      status: i.status,
      phoneNumber: i.phoneNumber,
    })),
    chartData,
  };
}
