"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { startCampaign, pauseCampaign, resumeCampaign, cancelCampaign, deleteCampaign } from "@/actions/campaigns";
import { Button } from "@/components/ui/button";
import { ConfirmDialog, shouldSkipConfirm } from "@/components/ui/confirm-dialog";

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

const DELETE_CAMPAIGN_KEY = "skipDeleteCampaignConfirm";

export function DeleteCampaignButton({ campaignId, status }: DeleteProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const router = useRouter();

  async function handleDelete() {
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

  function handleClick() {
    if (shouldSkipConfirm(DELETE_CAMPAIGN_KEY)) {
      handleDelete();
    } else {
      setDialogOpen(true);
    }
  }

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <Button
        variant="destructive"
        size="sm"
        disabled={loading || status === "RUNNING"}
        onClick={handleClick}
      >
        {loading ? "Apagando..." : "Apagar"}
      </Button>
      {error && <p className="text-xs text-red-600">{error}</p>}

      <ConfirmDialog
        open={dialogOpen}
        title="Apagar campanha?"
        description="Esta ação não pode ser desfeita. A campanha e todas as suas mensagens serão removidas permanentemente."
        confirmLabel="Apagar"
        cancelLabel="Cancelar"
        storageKey={DELETE_CAMPAIGN_KEY}
        onConfirm={() => { setDialogOpen(false); handleDelete(); }}
        onCancel={() => setDialogOpen(false)}
      />
    </div>
  );
}
