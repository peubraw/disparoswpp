"use server";

import { evolutionClient } from "@/lib/evolution-client";

const WEBHOOK_EVENTS = [
  "MESSAGES_UPDATE",
  "CONNECTION_UPDATE",
  "MESSAGES_UPSERT",
];

export async function configureWebhook(instanceName: string): Promise<void> {
  const base = process.env.NEXTAUTH_URL ?? `http://localhost:3001`;
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const webhookUrl = `${base}${basePath}/api/webhooks/evolution`;

  const apiKey = process.env.EVOLUTION_API_KEY ?? "";
  await evolutionClient.setWebhook(instanceName, webhookUrl, WEBHOOK_EVENTS, apiKey ? { apikey: apiKey } : undefined);
}
