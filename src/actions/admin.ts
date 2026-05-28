"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Não autorizado");
  }
  return session.user;
}

export async function getAdminStats() {
  await requireAdmin();

  const [
    totalUsers,
    totalInstances,
    connectedInstances,
    totalCampaigns,
    campaignsByStatus,
    totalContacts,
    totalMessages,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.waInstance.count(),
    prisma.waInstance.count({ where: { status: "CONNECTED" } }),
    prisma.campaign.count(),
    prisma.campaign.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.contact.count(),
    prisma.message.count(),
  ]);

  return {
    totalUsers,
    totalInstances,
    connectedInstances,
    totalCampaigns,
    campaignsByStatus: Object.fromEntries(
      campaignsByStatus.map((r) => [r.status, r._count._all])
    ) as Record<string, number>,
    totalContacts,
    totalMessages,
  };
}

export async function getAdminUsers() {
  await requireAdmin();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: {
        select: {
          waInstances: true,
          campaigns: true,
          contactLists: true,
        },
      },
    },
  });

  return users;
}

export async function getAdminUserDetail(userId: string) {
  await requireAdmin();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      waInstances: {
        select: { id: true, instanceName: true, phoneNumber: true, status: true },
        orderBy: { instanceName: "asc" },
      },
      contactLists: {
        select: {
          id: true,
          name: true,
          createdAt: true,
          _count: { select: { contacts: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      campaigns: {
        select: {
          id: true,
          name: true,
          status: true,
          createdAt: true,
          _count: { select: { messages: true } },
          messages: {
            where: { status: { in: ["SENT", "DELIVERED", "READ"] } },
            select: { id: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  return user;
}

export async function deleteUserAsAdmin(userId: string) {
  await requireAdmin();

  const session = await auth();
  if (session!.user.id === userId) {
    return { error: "Você não pode deletar a própria conta." };
  }

  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/admin");
  return { success: true };
}
