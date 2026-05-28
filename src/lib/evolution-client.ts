import axios, { AxiosError, type AxiosInstance, type AxiosRequestConfig } from "axios";
import type {
  EvolutionQRCode,
  EvolutionSendMediaPayload,
  EvolutionSendTextPayload,
} from "@/types";

type RetryableResponse = {
  status?: number;
};

export class EvolutionClient {
  private readonly client: AxiosInstance;

  constructor(baseUrl: string, apiKey: string) {
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        apikey: apiKey,
      },
    });
  }

  private async request<T>(config: AxiosRequestConfig, attempt = 0): Promise<T> {
    try {
      const response = await this.client.request<T>(config);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const response = (error as AxiosError).response as RetryableResponse | undefined;
        const status = response?.status;
        const shouldRetry =
          typeof status === "number" && (status === 429 || (status >= 500 && status <= 599));

        if (shouldRetry && attempt < 3) {
          const delayMs = 500 * 2 ** attempt;
          await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
          return this.request<T>(config, attempt + 1);
        }
      }

      throw error;
    }
  }

  async createInstance(name: string): Promise<unknown> {
    return this.request<unknown>({
      method: "POST",
      url: "/instance/create",
      data: { instanceName: name, integration: "WHATSAPP-BAILEYS" },
    });
  }

  async getInstanceStatus(name: string): Promise<unknown> {
    return this.request<unknown>({
      method: "GET",
      url: `/instance/connectionState/${encodeURIComponent(name)}`,
    });
  }

  async getQRCode(name: string): Promise<EvolutionQRCode> {
    return this.request<EvolutionQRCode>({
      method: "GET",
      url: `/instance/connect/${encodeURIComponent(name)}`,
    });
  }

  async deleteInstance(name: string): Promise<unknown> {
    return this.request<unknown>({
      method: "DELETE",
      url: `/instance/delete/${encodeURIComponent(name)}`,
    });
  }

  async sendText(instance: string, payload: EvolutionSendTextPayload): Promise<unknown> {
    return this.request<unknown>({
      method: "POST",
      url: `/message/sendText/${encodeURIComponent(instance)}`,
      data: payload,
    });
  }

  async sendMedia(instance: string, payload: EvolutionSendMediaPayload): Promise<unknown> {
    return this.request<unknown>({
      method: "POST",
      url: `/message/sendMedia/${encodeURIComponent(instance)}`,
      data: payload,
    });
  }

  async setWebhook(instance: string, url: string, events: string[], headers?: Record<string, string>): Promise<unknown> {
    return this.request<unknown>({
      method: "POST",
      url: `/webhook/set/${encodeURIComponent(instance)}`,
      data: { webhook: { enabled: true, url, events, webhookByEvents: false, webhookBase64: false, ...(headers ? { headers } : {}) } },
    });
  }

  async fetchInstances(): Promise<Array<{ name?: string; ownerJid?: string; connectionStatus?: string }>> {
    return this.request<Array<{ name?: string; ownerJid?: string; connectionStatus?: string }>>({
      method: "GET",
      url: "/instance/fetchInstances",
    });
  }
}

export const evolutionClient = new EvolutionClient(
  process.env.EVOLUTION_API_URL ?? "",
  process.env.EVOLUTION_API_KEY ?? "",
);
