"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-utils";
import { messageSendQueue } from "@/lib/queues";
import { revalidatePath } from "next/cache";

export async function getInboxMessages(instanceId?: string) {
  const user = await getCurrentUser();
  
  return prisma.inboxMessage.findMany({
    where: {
      userId: user.id,
      ...(instanceId ? { waInstanceId: instanceId } : {}),
    },
    include: {
      waInstance: {
        select: { instanceName: true },
      },
    },
    orderBy: { receivedAt: "desc" },
    take: 100,
  });
}

export async function getUnreadCount() {
  const user = await getCurrentUser();
  
  return prisma.inboxMessage.count({
    where: { userId: user.id, isRead: false },
  });
}

export async function markAsRead(messageId: string) {
  const user = await getCurrentUser();
  
  // Verify ownership
  const message = await prisma.inboxMessage.findFirst({
    where: { id: messageId, userId: user.id },
  });
  if (!message) return { error: "Mensagem não encontrada." };
  
  await prisma.inboxMessage.update({
    where: { id: messageId },
    data: { isRead: true },
  });
  
  revalidatePath("/inbox");
  return { success: true };
}

export async function markAllAsRead(instanceId?: string) {
  const user = await getCurrentUser();
  
  await prisma.inboxMessage.updateMany({
    where: {
      userId: user.id,
      isRead: false,
      ...(instanceId ? { waInstanceId: instanceId } : {}),
    },
    data: { isRead: true },
  });
  
  revalidatePath("/inbox");
  return { success: true };
}

export async function sendReply(inboxMessageId: string, text: string) {
  const user = await getCurrentUser();

  try {
    const message = await prisma.inboxMessage.findFirst({
      where: {
        id: inboxMessageId,
        waInstance: { userId: user.id },
      },
      select: {
        id: true,
        fromPhone: true,
        waInstance: {
          select: { instanceName: true },
        },
      },
    });

    if (!message) return { error: "Mensagem não encontrada." };

    await messageSendQueue.add("send-reply", {
      inboxMessageId: message.id,
      instanceName: message.waInstance.instanceName,
      remoteJid: message.fromPhone,
      text,
    });

    return { success: true };
  } catch {
    return { error: "Não foi possível enviar a resposta." };
  }
}
