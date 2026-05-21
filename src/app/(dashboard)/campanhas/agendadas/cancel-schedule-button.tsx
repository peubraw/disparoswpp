"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cancelSchedule } from "@/actions/campaigns";
import { useRouter } from "next/navigation";

interface CancelScheduleButtonProps {
  campaignId: string;
}

export function CancelScheduleButton({ campaignId }: CancelScheduleButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleCancel() {
    if (!confirm("Cancelar agendamento? A campanha voltará para Rascunho.")) return;
    setLoading(true);
    await cancelSchedule(campaignId);
    setLoading(false);
    router.refresh();
  }

  return (
    <Button variant="destructive" size="sm" onClick={handleCancel} disabled={loading}>
      {loading ? "Cancelando..." : "Cancelar"}
    </Button>
  );
}
