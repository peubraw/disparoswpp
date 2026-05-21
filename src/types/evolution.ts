export interface EvolutionInstance {
  instanceName: string;
  status: "open" | "close" | "connecting";
  owner?: string;
}

export interface EvolutionQRCode {
  code: string;
  base64: string;
  count: number;
}

export interface EvolutionSendTextPayload {
  number: string;
  text: string;
  delay?: number;
}

export interface EvolutionSendMediaPayload {
  number: string;
  mediatype: "image" | "video" | "audio" | "document";
  mimetype: string;
  caption?: string;
  media: string;
  fileName?: string;
}

export type EvolutionEventType =
  | "MESSAGES_UPSERT"
  | "MESSAGES_UPDATE"
  | "CONNECTION_UPDATE";

export interface EvolutionWebhookMessage {
  event: EvolutionEventType;
  instance: string;
  data: Record<string, unknown>;
}

export interface EvolutionMessageStatus {
  id: string;
  status: "PENDING" | "SENT" | "DELIVERED" | "READ" | "FAILED";
}
