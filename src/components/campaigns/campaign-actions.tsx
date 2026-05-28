"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { startCampaign, pauseCampaign, resumeCampaign, cancelCampaign, deleteCampaign } from "@/actions/campaigns";
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
        {status === "DRAFT" && (
          <Button
            disabled={loading}
            onClick={() => handle(() => startCampaign(campaignId))}
          >
            {loading ? "Iniciando..." : "Iniciar"}
          </Button>
        )}
        {status === "PAUSED" && (
          <Button
            disabled={loading}
            onClick={() => handle(() => resumeCampaign(campaignId))}
          >
            {loading ? "Retomando..." : "Retomar"}
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

interface DeleteProps {
  campaignId: string;
  status: string;
}

export function DeleteCampaignButton({ campaignId, status }: DeleteProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Tem certeza que deseja apagar esta campanha? Esta ação não pode ser desfeita.")) return;
    setLoading(true);
    setError(null);
    const result = await deleteCampaign(campaignId);
    setLoading(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <Button
        variant="destructive"
        size="sm"
        disabled={loading || status === "RUNNING"}
        onClick={handleDelete}
      >
        {loading ? "Apagando..." : "Apagar"}
      </Button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
