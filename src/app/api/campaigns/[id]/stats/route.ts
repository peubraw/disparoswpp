import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-utils";
import { MessageStatus, Prisma } from "@prisma/client";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const campaignId = resolvedParams.id;
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const statusFilter = searchParams.get("status");
    const pageSize = 50;

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { userId: true, status: true, name: true }
    });

    if (!campaign) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }
    if (campaign.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const statsQuery = await prisma.message.groupBy({
      by: ["status"],
      where: { campaignId },
      _count: { id: true },
    });

    const stats = {
      total: 0,
      pending: 0,
      sent: 0,
      delivered: 0,
      read: 0,
      failed: 0,
    };

    for (const group of statsQuery) {
      stats.total += group._count.id;
      if (group.status === MessageStatus.PENDING) stats.pending += group._count.id;
      else if (group.status === MessageStatus.SENT) stats.sent += group._count.id;
      else if (group.status === MessageStatus.DELIVERED) stats.delivered += group._count.id;
      else if (group.status === MessageStatus.READ) stats.read += group._count.id;
      else if (group.status === MessageStatus.FAILED) stats.failed += group._count.id;
    }

    const whereClause: Prisma.MessageWhereInput = { campaignId };
    const validStatuses: string[] = Object.values(MessageStatus);
    if (statusFilter && statusFilter !== "ALL" && validStatuses.includes(statusFilter)) {
      whereClause.status = statusFilter as MessageStatus;
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
      orderBy: [
        { sentAt: "desc" },
        { createdAt: "desc" }
      ],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        contactPhone: true,
        status: true,
        sentAt: true,
        errorMessage: true,
      }
    });

    const totalFiltered = await prisma.message.count({ where: whereClause });
    const totalPages = Math.ceil(totalFiltered / pageSize);

    const chartMessages = await prisma.message.findMany({
      where: {
        campaignId,
        sentAt: { not: null }
      },
      select: {
        status: true,
        sentAt: true,
      },
      orderBy: { sentAt: "asc" }
    });

    return NextResponse.json({
      campaign,
      stats,
      messages,
      pagination: {
        page,
        pageSize,
        totalItems: totalFiltered,
        totalPages,
      },
      chartMessages,
    });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
