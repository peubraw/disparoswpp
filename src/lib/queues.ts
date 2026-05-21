import { Queue } from "bullmq";
import { redis } from "@/lib/redis";

export const messageSendQueue = new Queue("message-send", {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});

export const campaignSchedulerQueue = new Queue("campaign-scheduler", {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 100,
  },
});
