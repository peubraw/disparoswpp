import type { Job } from "bullmq";
import { prisma } from "../lib/prisma";
import { evolutionClient } from "../lib/evolution";
import { interpolateTemplate } from "../lib/interpolate";
import { MessageStatus, MediaType } from "@prisma/client";
import fs from "fs";
import path from "path";

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
      const uploadsRoot = process.env.UPLOADS_PATH ?? "/app/public/uploads";
      const relativePath = mediaUrl.replace(/^\/uploads\//, "");
      const filePath = path.join(uploadsRoot, relativePath);

      let mediaBase64: string;
      if (fs.existsSync(filePath)) {
        mediaBase64 = fs.readFileSync(filePath).toString("base64");
      } else {
        const absoluteMediaUrl = mediaUrl.startsWith("http")
          ? mediaUrl
          : `${(process.env.NEXTAUTH_URL ?? "").replace(/\/$/, "")}${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${mediaUrl}`;
        mediaBase64 = absoluteMediaUrl;
      }

      const result = await evolutionClient.sendMedia(instanceName, {
        number: normalizedPhone,
        mediatype: mediaType.toLowerCase(),
        mimetype: getMimeType(mediaType),
        media: mediaBase64,
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
