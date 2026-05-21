import { Worker } from "bullmq";
import Redis from "ioredis";
import { processCampaignDispatch } from "./workers/campaign-worker";
import { processSendMessage } from "./workers/message-worker";
import { processScheduledCampaign } from "./workers/scheduled-campaign-worker";

const connection = new Redis(process.env.REDIS_URL ?? "redis://redis:6379", {
  maxRetriesPerRequest: null,
});

const messageSendWorker = new Worker(
  "message-send",
  async (job) => {
    if (job.name === "dispatch-campaign") {
      return processCampaignDispatch(job as Parameters<typeof processCampaignDispatch>[0]);
    }
    if (job.name === "send-message") {
      return processSendMessage(job as Parameters<typeof processSendMessage>[0]);
    }
  },
  {
    connection,
    concurrency: 5,
  }
);

const campaignSchedulerWorker = new Worker(
  "campaign-scheduler",
  async (job) => {
    if (job.name === "schedule-campaign") {
      return processScheduledCampaign(
        job as Parameters<typeof processScheduledCampaign>[0]
      );
    }
  },
  {
    connection,
    concurrency: 2,
  }
);

messageSendWorker.on("completed", (job) => {
  void job;
});

messageSendWorker.on("failed", (job, err) => {
  void job;
  void err;
});

campaignSchedulerWorker.on("completed", (job) => {
  void job;
});

campaignSchedulerWorker.on("failed", (job, err) => {
  void job;
  void err;
});

async function shutdown() {
  await messageSendWorker.close();
  await campaignSchedulerWorker.close();
  await connection.quit();
  process.exit(0);
}

process.on("SIGTERM", () => void shutdown());
process.on("SIGINT", () => void shutdown());
