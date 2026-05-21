import type { Prisma } from "@prisma/client";

export type CampaignStatus =
  | "DRAFT"
  | "SCHEDULED"
  | "RUNNING"
  | "PAUSED"
  | "COMPLETED"
  | "FAILED";

export type MediaType = "NONE" | "IMAGE" | "VIDEO" | "AUDIO" | "DOCUMENT";

export type WaInstanceStatus = "DISCONNECTED" | "CONNECTING" | "CONNECTED";

export interface CampaignWithStats extends Prisma.CampaignGetPayload<{
  include: {
    user: true;
    waInstance: true;
    messages: true;
    contactLists: true;
  };
}> {
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  total: number;
}

export interface ContactRow {
  phoneNumber: string;
  name?: string;
  company?: string;
  [key: string]: string | undefined;
}
