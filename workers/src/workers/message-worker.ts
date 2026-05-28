import type { Job } from "bullmq";
import { prisma } from "../lib/prisma";
import { evolutionClient } from "../lib/evolution";
import { interpolateTemplate } from "../lib/interpolate";
import { MessageStatus, MediaType } from "@prisma/client";

interface SendMessageJobData {
  messageId: string;
  contactPhone: string;
  contactName?: string;
  contactCustomFields: Record<string, string | undefined>;
  instanceName: string;
  messageTemplate: string;
  mediaUrl?: string;
  mediaType: MediaType;
}

export async function processSendMessage(job: Job<SendMessageJobData>) {
  const {
    messageId,
    contactPhone,
    contactName,
    contactCustomFields,
    instanceName,
    messageTemplate,
    mediaUrl,
    mediaType,
  } = job.data;

  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: { campaign: true },
  });
  if (!message) return;
  if (message.campaign.status !== "RUNNING") return;

  const vars: Record<string, string | undefined> = {
    nome: contactName,
    name: contactName,
    ...contactCustomFields,
  };

  const text = interpolateTemplate(messageTemplate, vars);

  const digits = contactPhone.replace(/\D/g, "");
  const normalizedPhone = digits.length < 12 ? `55${digits}` : digits;

  let evolutionMessageId: string | undefined;

  try {
    if (mediaType !== MediaType.NONE && mediaUrl) {
      const result = await evolutionClient.sendMedia(instanceName, {
        number: normalizedPhone,
        mediatype: mediaType.toLowerCase(),
        mimetype: getMimeType(mediaType),
        media: mediaUrl,
        caption: text,
      });
      evolutionMessageId = result?.key?.id;
    } else {
      const result = await evolutionClient.sendText(instanceName, normalizedPhone, text);
      evolutionMessageId = result?.key?.id;
    }

    await prisma.message.update({
      where: { id: messageId },
      data: {
        status: MessageStatus.SENT,
        sentAt: new Date(),
        evolutionMessageId: evolutionMessageId ?? null,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    await prisma.message.update({
      where: { id: messageId },
      data: {
        status: MessageStatus.FAILED,
        errorMessage,
      },
    });
    // Do NOT rethrow — no retry (anti-ban policy)
  }
}

function getMimeType(mediaType: MediaType): string {
  const mimeMap: Record<string, string> = {
    IMAGE: "image/jpeg",
    VIDEO: "video/mp4",
    AUDIO: "audio/ogg",
    DOCUMENT: "application/pdf",
  };
  return mimeMap[mediaType] ?? "application/octet-stream";
}
