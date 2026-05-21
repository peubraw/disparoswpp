import { Queue } from "bullmq";
import { redis } from "@/lib/redis";

let _messageSendQueue: Queue | undefined;
let _campaignSchedulerQueue: Queue | undefined;

export function getMessageSendQueue(): Queue {
  if (!_messageSendQueue) {
    _messageSendQueue = new Queue("message-send", {
      connection: redis,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    });
  }
  return _messageSendQueue;
}

export function getCampaignSchedulerQueue(): Queue {
  if (!_campaignSchedulerQueue) {
    _campaignSchedulerQueue = new Queue("campaign-scheduler", {
      connection: redis,
      defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 100,
      },
    });
  }
  return _campaignSchedulerQueue;
}

export const messageSendQueue = new Proxy({} as Queue, {
  get(_, prop) {
    return getMessageSendQueue()[prop as keyof Queue];
  },
});

export const campaignSchedulerQueue = new Proxy({} as Queue, {
  get(_, prop) {
    return getCampaignSchedulerQueue()[prop as keyof Queue];
  },
});
