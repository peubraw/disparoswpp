import type { Job } from "bullmq";
import { Queue } from "bullmq";
import Redis from "ioredis";
import { prisma } from "../lib/prisma";
import { MessageStatus } from "@prisma/client";

const connection = new Redis(process.env.REDIS_URL ?? "redis://redis:6379", {
  maxRetriesPerRequest: null,
});

const messageSendQueue = new Queue("message-send", { connection });

export async function processCampaignDispatch(job: Job<{ campaignId: string; userId: string }>) {
  const { campaignId, userId } = job.data;

  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, userId },
    include: {
      waInstance: true,
      contactLists: {
        include: {
          contactList: {
            include: { contacts: true },
          },
        },
      },
    },
  });

  if (!campaign) {
    throw new Error(`Campaign ${campaignId} not found`);
  }

  const contacts = campaign.contactLists.flatMap((ccl) => ccl.contactList.contacts);

  let index = 0;
  const CHUNK_SIZE = 100;

  for (let i = 0; i < contacts.length; i += CHUNK_SIZE) {
    const chunk = contacts.slice(i, i + CHUNK_SIZE);

    for (const contact of chunk) {
      const message = await prisma.message.create({
        data: {
          campaignId,
          contactPhone: contact.phoneNumber,
          status: MessageStatus.PENDING,
        },
      });

      const delay = index * campaign.throttleDelay;
      await messageSendQueue.add(
        "send-message",
        {
          messageId: message.id,
          contactPhone: contact.phoneNumber,
          contactName: contact.name ?? undefined,
          contactCustomFields: (contact.customFields as Record<string, string | undefined>) ?? {},
          instanceName: campaign.waInstance.instanceName,
          messageTemplate: campaign.messageTemplate,
          mediaUrl: campaign.mediaUrl ?? undefined,
          mediaType: campaign.mediaType,
        },
        { delay }
      );

      index++;
    }

    const progress = Math.round((Math.min(i + CHUNK_SIZE, contacts.length) / contacts.length) * 100);
    await job.updateProgress(progress);
  }

  const totalDelay = contacts.length > 0 ? (contacts.length - 1) * campaign.throttleDelay : 0;

  await messageSendQueue.add(
    "finalize-campaign",
    { campaignId },
    { delay: totalDelay + 60000 }
  );
}
