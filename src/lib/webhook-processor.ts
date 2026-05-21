import { prisma } from "@/lib/prisma";
import { WaInstanceStatus, MessageStatus } from "@prisma/client";

function mapMessageStatus(evolutionStatus: string): MessageStatus | null {
  const map: Record<string, MessageStatus> = {
    "PENDING": MessageStatus.PENDING,
    "SERVER_ACK": MessageStatus.SENT,
    "DELIVERY_ACK": MessageStatus.DELIVERED,
    "READ": MessageStatus.READ,
    "PLAYED": MessageStatus.READ,
    "ERROR": MessageStatus.FAILED,
  };
  return map[evolutionStatus] ?? null;
}

export async function processMessagesUpdate(
  instanceName: string,
  data: Record<string, unknown>
): Promise<void> {
  const key = data.key as { id?: string } | undefined;
  const update = data.update as { status?: string } | undefined;

  const evolutionMessageId = key?.id;
  const rawStatus = update?.status;

  if (!evolutionMessageId || !rawStatus) return;

  const newStatus = mapMessageStatus(rawStatus);
  if (!newStatus) return;

  await prisma.message.updateMany({
    where: {
      evolutionMessageId,
      campaign: {
        waInstance: {
          instanceName,
        },
      },
    },
    data: {
      status: newStatus,
    },
  });
}

export async function processConnectionUpdate(
  instanceName: string,
  data: Record<string, unknown>
): Promise<void> {
  const state = data.state as string | undefined;

  let newStatus: WaInstanceStatus;
  if (state === "open") {
    newStatus = WaInstanceStatus.CONNECTED;
  } else if (state === "close") {
    newStatus = WaInstanceStatus.DISCONNECTED;
  } else {
    newStatus = WaInstanceStatus.CONNECTING;
  }

  await prisma.waInstance.updateMany({
    where: { instanceName },
    data: { status: newStatus },
  });
}

export async function processMessagesUpsert(
  instanceName: string,
  data: Record<string, unknown>
): Promise<void> {
  const key = data.key as { remoteJid?: string; fromMe?: boolean } | undefined;
  const messageData = data.message as { conversation?: string; extendedTextMessage?: { text?: string } } | undefined;
  const timestamp = data.messageTimestamp as number | undefined;

  if (key?.fromMe === true) return;

  const remoteJid = key?.remoteJid;
  if (!remoteJid) return;

  const instance = await prisma.waInstance.findFirst({
    where: { instanceName },
  });
  if (!instance) return;

  const body = messageData?.conversation ?? messageData?.extendedTextMessage?.text ?? "";
  const fromPhone = remoteJid.replace("@s.whatsapp.net", "").replace("@g.us", "");
  const receivedAt = timestamp ? new Date(timestamp * 1000) : new Date();

  await prisma.inboxMessage.create({
    data: {
      waInstanceId: instance.id,
      userId: instance.userId,
      fromPhone,
      body,
      receivedAt,
      isRead: false,
    },
  });
}
