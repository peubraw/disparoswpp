"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cancelSchedule } from "@/actions/campaigns";
import { useRouter } from "next/navigation";
import { ConfirmDialog, shouldSkipConfirm } from "@/components/ui/confirm-dialog";

interface CancelScheduleButtonProps {
  campaignId: string;
}

const CANCEL_SCHEDULE_KEY = "skipCancelScheduleConfirm";

export function CancelScheduleButton({ campaignId }: CancelScheduleButtonProps) {
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const router = useRouter();

  async function handleCancel() {
    setLoading(true);
    await cancelSchedule(campaignId);
    setLoading(false);
    router.refresh();
  }

  function handleClick() {
    if (shouldSkipConfirm(CANCEL_SCHEDULE_KEY)) {
      handleCancel();
    } else {
      setDialogOpen(true);
    }
  }

  return (
    <>
      <Button variant="destructive" size="sm" onClick={handleClick} disabled={loading}>
        {loading ? "Cancelando..." : "Cancelar"}
      </Button>

      <ConfirmDialog
        open={dialogOpen}
        title="Cancelar agendamento?"
        description="A campanha voltará para Rascunho e precisará ser agendada novamente."
        confirmLabel="Cancelar agendamento"
        cancelLabel="Voltar"
        storageKey={CANCEL_SCHEDULE_KEY}
        onConfirm={() => { setDialogOpen(false); handleCancel(); }}
        onCancel={() => setDialogOpen(false)}
      />
    </>
  );
}
