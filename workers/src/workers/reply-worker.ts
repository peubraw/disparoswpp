import type { Job } from "bullmq";
import { evolutionClient } from "../lib/evolution";

interface SendReplyJobData {
  inboxMessageId: string;
  instanceName: string;
  toPhone: string;
  text: string;
}

export async function processSendReply(job: Job<SendReplyJobData>) {
  const { inboxMessageId, instanceName, toPhone, text } = job.data;

  try {
    const digits = toPhone.replace(/\D/g, "");
    const normalizedPhone = digits.length < 12 ? `55${digits}` : digits;
    const remoteJid = `${normalizedPhone}@s.whatsapp.net`;

    await evolutionClient.sendText(instanceName, remoteJid, text);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to send reply", {
      inboxMessageId,
      instanceName,
      toPhone,
      errorMessage,
    });
  }
}
