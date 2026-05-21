import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";

export class EvolutionClient {
  private readonly client: AxiosInstance;

  constructor(baseUrl: string, apiKey: string) {
    this.client = axios.create({
      baseURL: baseUrl,
      headers: { apikey: apiKey },
    });
  }

  private async request<T>(config: AxiosRequestConfig): Promise<T> {
    const response = await this.client.request<T>(config);
    return response.data;
  }

  async sendText(instanceName: string, number: string, text: string): Promise<{ key?: { id?: string } }> {
    return this.request<{ key?: { id?: string } }>({
      method: "POST",
      url: `/message/sendText/${encodeURIComponent(instanceName)}`,
      data: {
        number,
        text,
      },
    });
  }

  async sendMedia(instanceName: string, payload: {
    number: string;
    mediatype: string;
    mimetype: string;
    media: string;
    caption?: string;
    fileName?: string;
  }): Promise<{ key?: { id?: string } }> {
    return this.request<{ key?: { id?: string } }>({
      method: "POST",
      url: `/message/sendMedia/${encodeURIComponent(instanceName)}`,
      data: payload,
    });
  }
}

export const evolutionClient = new EvolutionClient(
  process.env.EVOLUTION_API_URL ?? "http://evolution-api:8081",
  process.env.EVOLUTION_API_KEY ?? "",
);
