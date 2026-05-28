"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-utils";
import { messageSendQueue, campaignSchedulerQueue } from "@/lib/queues";
import { CampaignStatus, WaInstanceStatus, MediaType, MessageStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { evolutionClient } from "@/lib/evolution-client";

const createCampaignSchema = z.object({
  name: z.string().min(1).max(100),
  waInstanceId: z.string().uuid(),
  messageTemplate: z.string().min(1).max(4096),
  contactListIds: z.array(z.string().uuid()).min(1),
  throttleDelay: z.number().int().min(1000).max(60000).default(3000),
  scheduledFor: z.string().datetime().optional().nullable(),
  mediaUrl: z.string().optional().nullable(),
  mediaType: z.enum(["NONE", "IMAGE", "VIDEO", "AUDIO", "DOCUMENT"]).optional().nullable(),
});

export async function createCampaign(data: z.infer<typeof createCampaignSchema>) {
  const user = await getCurrentUser();
  const parsed = createCampaignSchema.safeParse(data);
  if (!parsed.success) {
    return { error: "Dados inválidos." };
  }

  const instance = await prisma.waInstance.findFirst({
    where: { id: parsed.data.waInstanceId, userId: user.id },
  });
  if (!instance) return { error: "Instância não encontrada." };

  const lists = await prisma.contactList.findMany({
    where: { id: { in: parsed.data.contactListIds }, userId: user.id },
    include: { _count: { select: { contacts: true } } },
  });
  if (lists.length !== parsed.data.contactListIds.length) {
    return { error: "Uma ou mais listas não encontradas." };
  }

  const totalContacts = lists.reduce((sum, l) => sum + l._count.contacts, 0);
  if (totalContacts === 0) return { error: "As listas selecionadas não possuem contatos." };

  const campaign = await prisma.campaign.create({
    data: {
      userId: user.id,
      waInstanceId: parsed.data.waInstanceId,
      name: parsed.data.name,
      messageTemplate: parsed.data.messageTemplate,
      status: CampaignStatus.DRAFT,
      throttleDelay: parsed.data.throttleDelay,
      scheduledFor: parsed.data.scheduledFor ? new Date(parsed.data.scheduledFor) : null,
      mediaUrl: parsed.data.mediaUrl ?? null,
      mediaType: (parsed.data.mediaType as MediaType) ?? MediaType.NONE,
      contactLists: {
        create: parsed.data.contactListIds.map(id => ({ contactListId: id })),
      },
    },
  });

  revalidatePath("/campanhas");
  return { success: true, campaign };
}

export async function startCampaign(campaignId: string) {
  const user = await getCurrentUser();

  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, userId: user.id },
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

  if (!campaign) return { error: "Campanha não encontrada." };

  try {
    const res = await evolutionClient.getInstanceStatus(campaign.waInstance.instanceName) as { instance?: { state?: string } };
    const state = res?.instance?.state;
    if (state === "open" && campaign.waInstance.status !== WaInstanceStatus.CONNECTED) {
      await prisma.waInstance.update({
        where: { id: campaign.waInstance.id },
        data: { status: WaInstanceStatus.CONNECTED },
      });
      campaign.waInstance.status = WaInstanceStatus.CONNECTED;
    }
  } catch {
  }

  if (campaign.waInstance.status !== WaInstanceStatus.CONNECTED) {
    return { error: "Instância não conectada. Conecte o WhatsApp antes de iniciar a campanha." };
  }
  if (campaign.status === CampaignStatus.RUNNING) {
    return { error: "Campanha já está em execução." };
  }

  await prisma.campaign.update({
    where: { id: campaignId },
    data: { status: CampaignStatus.RUNNING },
  });

  await messageSendQueue.add(
    "dispatch-campaign",
    { campaignId, userId: user.id },
    { delay: campaign.scheduledFor && campaign.scheduledFor > new Date()
        ? campaign.scheduledFor.getTime() - Date.now()
        : 0 }
  );

  revalidatePath("/campanhas");
  revalidatePath(`/campanhas/${campaignId}`);
  return { success: true };
}

export async function pauseCampaign(campaignId: string) {
  const user = await getCurrentUser();
  const campaign = await prisma.campaign.findFirst({ where: { id: campaignId, userId: user.id } });
  if (!campaign) return { error: "Campanha não encontrada." };

  const jobs = await messageSendQueue.getJobs(["waiting", "delayed"]);
  for (const job of jobs) {
    if (job.data?.campaignId === campaignId) {
      await job.remove();
    }
  }

  await prisma.campaign.update({
    where: { id: campaignId },
    data: { status: CampaignStatus.PAUSED },
  });

  revalidatePath("/campanhas");
  return { success: true };
}

export async function resumeCampaign(campaignId: string) {
  const user = await getCurrentUser();

  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, userId: user.id },
    include: {
      waInstance: true,
      contactLists: {
        select: { contactListId: true },
      },
    },
  });

  if (!campaign) return { error: "Campanha não encontrada." };
  if (campaign.status !== CampaignStatus.PAUSED) {
    return { error: "A campanha precisa estar pausada para ser retomada." };
  }

  const pendingMessages = await prisma.message.findMany({
    where: { campaignId, status: MessageStatus.PENDING },
    orderBy: { createdAt: "asc" },
  });

  const contactListIds = campaign.contactLists.map(({ contactListId }) => contactListId);
  const jobs = [] as Array<{
    messageId: string;
    contactPhone: string;
    contactName?: string;
    contactCustomFields: Record<string, string | undefined>;
    instanceName: string;
    messageTemplate: string;
    mediaUrl?: string;
    mediaType: MediaType;
  }>;

  for (const message of pendingMessages) {
    const contact = await prisma.contact.findFirst({
      where: {
        contactListId: { in: contactListIds },
        phoneNumber: message.contactPhone,
      },
    });

    if (!contact) {
      return { error: "Contato não encontrado para uma das mensagens pendentes." };
    }

    const customFields =
      contact.customFields && typeof contact.customFields === "object" && !Array.isArray(contact.customFields)
        ? (contact.customFields as Record<string, string | undefined>)
        : {};

    jobs.push({
      messageId: message.id,
      contactPhone: message.contactPhone,
      contactName: contact.name ?? undefined,
      contactCustomFields: customFields,
      instanceName: campaign.waInstance.instanceName,
      messageTemplate: campaign.messageTemplate,
      mediaUrl: campaign.mediaUrl ?? undefined,
      mediaType: campaign.mediaType,
    });
  }

  await prisma.campaign.update({
    where: { id: campaignId },
    data: { status: CampaignStatus.RUNNING },
  });

  for (const [index, jobData] of jobs.entries()) {
    await messageSendQueue.add(
      "send-message",
      jobData,
      {
        delay: index * campaign.throttleDelay,
        jobId: jobData.messageId,
      }
    );
  }

  revalidatePath("/campanhas");
  revalidatePath(`/campanhas/${campaignId}`);
  return { success: true };
}

export async function cancelCampaign(campaignId: string) {
  const user = await getCurrentUser();
  const campaign = await prisma.campaign.findFirst({ where: { id: campaignId, userId: user.id } });
  if (!campaign) return { error: "Campanha não encontrada." };

  await prisma.message.updateMany({
    where: { campaignId, status: "PENDING" },
    data: { status: "FAILED" },
  });

  const jobs = await messageSendQueue.getJobs(["waiting", "delayed"]);
  for (const job of jobs) {
    if (job.data?.campaignId === campaignId) {
      await job.remove();
    }
  }

  await prisma.campaign.update({
    where: { id: campaignId },
    data: { status: CampaignStatus.PAUSED },
  });

  revalidatePath("/campanhas");
  return { success: true };
}

export async function scheduleCampaign(campaignId: string, scheduledFor: string) {
  const user = await getCurrentUser();
  const campaign = await prisma.campaign.findFirst({ where: { id: campaignId, userId: user.id } });
  if (!campaign) return { error: "Campanha não encontrada." };

  const scheduledDate = new Date(scheduledFor);
  const now = new Date();
  const isInPast = scheduledDate <= now;

  if (isInPast) {
    const result = await startCampaign(campaignId);
    if ("error" in result) return result;
    revalidatePath("/campanhas");
    revalidatePath("/campanhas/agendadas");
    return { success: true, warning: "Horário passado, disparando agora" };
  }

  const existingJobs = await campaignSchedulerQueue.getJobs(["delayed", "waiting"]);
  for (const job of existingJobs) {
    if (job.id === campaignId) {
      await job.remove();
    }
  }

  const delay = scheduledDate.getTime() - now.getTime();

  await campaignSchedulerQueue.add(
    "schedule-campaign",
    { campaignId, userId: user.id },
    { delay, jobId: campaignId }
  );

  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      scheduledFor: scheduledDate,
      status: CampaignStatus.SCHEDULED,
    },
  });

  revalidatePath("/campanhas");
  revalidatePath("/campanhas/agendadas");
  return { success: true };
}

export async function deleteCampaign(campaignId: string) {
  const user = await getCurrentUser();
  const campaign = await prisma.campaign.findFirst({ where: { id: campaignId, userId: user.id } });
  if (!campaign) return { error: "Campanha não encontrada." };

  if (campaign.status === CampaignStatus.RUNNING) {
    return { error: "Não é possível apagar uma campanha em execução. Cancele primeiro." };
  }

  const jobs = await messageSendQueue.getJobs(["waiting", "delayed"]);
  for (const job of jobs) {
    if (job.data?.campaignId === campaignId) await job.remove();
  }
  const schedulerJob = await campaignSchedulerQueue.getJob(campaignId);
  if (schedulerJob) await schedulerJob.remove();

  await prisma.message.deleteMany({ where: { campaignId } });
  await prisma.campaignContactList.deleteMany({ where: { campaignId } });
  await prisma.campaign.delete({ where: { id: campaignId } });

  revalidatePath("/campanhas");
  return { success: true };
}

export async function cancelSchedule(campaignId: string) {
  const user = await getCurrentUser();
  const campaign = await prisma.campaign.findFirst({ where: { id: campaignId, userId: user.id } });
  if (!campaign) return { error: "Campanha não encontrada." };

  const job = await campaignSchedulerQueue.getJob(campaignId);
  if (job) {
    await job.remove();
  }

  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      status: CampaignStatus.DRAFT,
      scheduledFor: null,
    },
  });

  revalidatePath("/campanhas");
  revalidatePath("/campanhas/agendadas");
  return { success: true };
}
