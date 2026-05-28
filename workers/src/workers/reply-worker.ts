import type { Job } from "bullmq";
import { evolutionClient } from "../lib/evolution";

interface SendReplyJobData {
  inboxMessageId: string;
  instanceName: string;
  remoteJid: string;
  text: string;
}

export async function processSendReply(job: Job<SendReplyJobData>) {
  const { inboxMessageId, instanceName, remoteJid, text } = job.data;

  try {
    await evolutionClient.sendText(instanceName, remoteJid, text);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to send reply", {
      inboxMessageId,
      instanceName,
      remoteJid,
      errorMessage,
    });
  }
}
