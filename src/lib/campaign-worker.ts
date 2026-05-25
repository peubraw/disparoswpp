import { Worker, Job } from "bullmq";
import Redis from "ioredis";
import { prisma } from "@/lib/prisma";
import { evolutionClient } from "@/lib/evolution-client";
import { CampaignStatus, MessageStatus, MediaType } from "@prisma/client";

type DispatchCampaignJob = {
  campaignId: string;
  userId: string;
};

function normalizePhone(phone: string): string {
  // Remove todos os não-dígitos
  const digits = phone.replace(/\D/g, "");
  // Se já tem código de país (55 para Brasil) e DDI, retorna
  if (digits.length >= 12) return digits;
  // Se tem 11 dígitos (DDD + número), adiciona 55
  if (digits.length === 11) return `55${digits}`;
  // Se tem 10 dígitos (DDD + número sem 9), adiciona 55
  if (digits.length === 10) return `55${digits}`;
  return digits;
}

async function processCampaign(job: Job<DispatchCampaignJob>) {
  const { campaignId } = job.data;

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
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

  // Se foi pausada/cancelada antes de processar
  if (campaign.status === CampaignStatus.PAUSED || campaign.status === CampaignStatus.COMPLETED) {
    return { skipped: true };
  }

  // Coletar todos os contatos únicos das listas
  const phoneSet = new Set<string>();
  const contacts: Array<{ phone: string; name: string | null }> = [];

  for (const ccl of campaign.contactLists) {
    for (const contact of ccl.contactList.contacts) {
      const normalized = normalizePhone(contact.phoneNumber);
      if (!phoneSet.has(normalized)) {
        phoneSet.add(normalized);
        contacts.push({ phone: normalized, name: contact.name });
      }
    }
  }

  if (contacts.length === 0) {
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: CampaignStatus.COMPLETED },
    });
    return { sent: 0 };
  }

  // Criar registros de Message PENDING para todos os contatos (se ainda não existem)
  const existingMessages = await prisma.message.findMany({
    where: { campaignId },
    select: { contactPhone: true },
  });
  const existingPhones = new Set(existingMessages.map((m) => m.contactPhone));

  const toCreate = contacts.filter((c) => !existingPhones.has(c.phone));
  if (toCreate.length > 0) {
    await prisma.message.createMany({
      data: toCreate.map((c) => ({
        campaignId,
        contactPhone: c.phone,
        status: MessageStatus.PENDING,
      })),
    });
  }

  // Buscar todas as mensagens PENDING
  const pendingMessages = await prisma.message.findMany({
    where: { campaignId, status: MessageStatus.PENDING },
  });

  const instanceName = campaign.waInstance.instanceName;
  const hasMedia = campaign.mediaType !== MediaType.NONE && campaign.mediaUrl;

  let sentCount = 0;
  let failCount = 0;

  for (const msg of pendingMessages) {
    // Verificar se campanha ainda está RUNNING
    const current = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { status: true },
    });
    if (current?.status !== CampaignStatus.RUNNING) {
      break; // pausada ou cancelada
    }

    try {
      const text = campaign.messageTemplate;
      const to = `${msg.contactPhone}@s.whatsapp.net`;

      if (hasMedia && campaign.mediaUrl) {
        const mimetypeMap: Record<string, string> = {
          IMAGE: "image/jpeg",
          VIDEO: "video/mp4",
          AUDIO: "audio/mpeg",
          DOCUMENT: "application/pdf",
        };
        await evolutionClient.sendMedia(instanceName, {
          number: to,
          mediatype: campaign.mediaType.toLowerCase() as "image" | "video" | "audio" | "document",
          mimetype: mimetypeMap[campaign.mediaType] ?? "application/octet-stream",
          media: campaign.mediaUrl,
          caption: text,
        });
      } else {
        await evolutionClient.sendText(instanceName, {
          number: to,
          text,
        });
      }

      await prisma.message.update({
        where: { id: msg.id },
        data: {
          status: MessageStatus.SENT,
          sentAt: new Date(),
        },
      });
      sentCount++;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      await prisma.message.update({
        where: { id: msg.id },
        data: {
          status: MessageStatus.FAILED,
          errorMessage,
        },
      });
      failCount++;
    }

    // Throttle entre envios
    if (campaign.throttleDelay > 0) {
      await new Promise<void>((resolve) => setTimeout(resolve, campaign.throttleDelay));
    }
  }

  // Marcar campanha como COMPLETED
  const stillPending = await prisma.message.count({
    where: { campaignId, status: MessageStatus.PENDING },
  });

  const finalCampaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { status: true },
  });

  if (finalCampaign?.status === CampaignStatus.RUNNING && stillPending === 0) {
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: CampaignStatus.COMPLETED },
    });
  }

  return { sent: sentCount, failed: failCount };
}

let _worker: Worker | undefined;

export function startCampaignWorker() {
  if (_worker) return _worker;

  const workerRedis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });

  _worker = new Worker<DispatchCampaignJob>("message-send", processCampaign, {
    connection: workerRedis,
    concurrency: 1,
    lockDuration: 300000,
    lockRenewTime: 60000,
  });

  _worker.on("completed", (job, result) => {
    console.log(`[worker] Campaign job ${job.id} completed:`, result);
  });

  _worker.on("failed", (job, err) => {
    console.error(`[worker] Campaign job ${job?.id} failed:`, err.message);
  });

  _worker.on("error", (err) => {
    console.error("[worker] Worker error:", err.message);
  });

  console.log("[worker] Campaign worker started");
  return _worker;
}
