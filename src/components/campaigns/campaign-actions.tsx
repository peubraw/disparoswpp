"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { startCampaign, pauseCampaign, cancelCampaign } from "@/actions/campaigns";
import { Button } from "@/components/ui/button";

interface Props {
  campaignId: string;
  status: string;
}

export function CampaignActions({ campaignId, status }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handle(action: () => Promise<{ error?: string; success?: boolean }>) {
    setLoading(true);
    setError(null);
    const result = await action();
    setLoading(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        {(status === "DRAFT" || status === "PAUSED") && (
          <Button
            disabled={loading}
            onClick={() => handle(() => startCampaign(campaignId))}
          >
            {loading ? "Iniciando..." : "Iniciar"}
          </Button>
        )}
        {status === "RUNNING" && (
          <Button
            variant="secondary"
            disabled={loading}
            onClick={() => handle(() => pauseCampaign(campaignId))}
          >
            {loading ? "Pausando..." : "Pausar"}
          </Button>
        )}
        {["RUNNING", "PAUSED", "SCHEDULED"].includes(status) && (
          <Button
            variant="destructive"
            disabled={loading}
            onClick={() => handle(() => cancelCampaign(campaignId))}
          >
            {loading ? "Cancelando..." : "Cancelar"}
          </Button>
        )}
      </div>
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
      )}
    </div>
  );
}
