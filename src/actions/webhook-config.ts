"use server";

import { evolutionClient } from "@/lib/evolution-client";

const WEBHOOK_EVENTS = [
  "MESSAGES_UPDATE",
  "CONNECTION_UPDATE",
  "MESSAGES_UPSERT",
];

export async function configureWebhook(instanceName: string): Promise<void> {
  const webhookUrl = process.env.NEXTAUTH_URL
    ? `${process.env.NEXTAUTH_URL}/api/webhooks/evolution`
    : `http://localhost:3001/api/webhooks/evolution`;

  await evolutionClient.setWebhook(instanceName, webhookUrl, WEBHOOK_EVENTS);
}
