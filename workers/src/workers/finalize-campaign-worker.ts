import type { Job } from "bullmq";
import { Queue } from "bullmq";
import Redis from "ioredis";
import { CampaignStatus, MessageStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";

const connection = new Redis(process.env.REDIS_URL ?? "redis://redis:6379", {
  maxRetriesPerRequest: null,
});

const messageSendQueue = new Queue("message-send", { connection });

interface FinalizeCampaignJobData {
  campaignId: string;
}

export async function processFinalCampaign(job: Job<FinalizeCampaignJobData>) {
  const { campaignId } = job.data;

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { id: true, status: true },
  });

  if (!campaign) return;
  if (campaign.status === CampaignStatus.PAUSED || campaign.status === CampaignStatus.FAILED) return;
  if (campaign.status === CampaignStatus.COMPLETED) return;

  const pendingCount = await prisma.message.count({
    where: {
      campaignId,
      status: MessageStatus.PENDING,
    },
  });

  if (pendingCount === 0) {
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: CampaignStatus.COMPLETED },
    });
    return;
  }

  await messageSendQueue.add(
    "finalize-campaign",
    { campaignId },
    { delay: 60000 }
  );
}
