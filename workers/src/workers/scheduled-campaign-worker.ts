import type { Job } from "bullmq";
import { Queue } from "bullmq";
import Redis from "ioredis";
import { prisma } from "../lib/prisma";
import { CampaignStatus } from "@prisma/client";

const connection = new Redis(process.env.REDIS_URL ?? "redis://redis:6379", {
  maxRetriesPerRequest: null,
});

const messageSendQueue = new Queue("message-send", { connection });

export async function processScheduledCampaign(
  job: Job<{ campaignId: string; userId: string }>
) {
  const { campaignId, userId } = job.data;

  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, userId },
  });

  if (!campaign) {
    throw new Error(`Campaign ${campaignId} not found`);
  }

  await prisma.campaign.update({
    where: { id: campaignId },
    data: { status: CampaignStatus.RUNNING },
  });

  await messageSendQueue.add(
    "dispatch-campaign",
    { campaignId, userId },
    {}
  );
}
