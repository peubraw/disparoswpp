"use client";

import { useState } from "react";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { QRCodeDialog } from "@/components/instances/qr-code-dialog";
import { deleteInstance } from "@/actions/instances";

type InstanceCardProps = {
  instance: {
    id: string;
    instanceName: string;
    status: string;
    phoneNumber: string | null;
  };
};

export function InstanceCard({ instance }: InstanceCardProps) {
  const [qrOpen, setQrOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    await deleteInstance(instance.id);
    setDeleting(false);
  }

  return (
    <div className="rounded-lg border bg-card p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-lg">{instance.instanceName}</span>
        <StatusBadge status={instance.status} />
      </div>
      <span className="text-sm text-muted-foreground">
        {instance.phoneNumber ?? "Não conectado"}
      </span>
      <div className="flex gap-2 mt-auto">
        {instance.status !== "CONNECTED" && (
          <Button variant="outline" size="sm" onClick={() => setQrOpen(true)}>
            Ver QR
          </Button>
        )}
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={deleting}
        >
          {deleting ? "Deletando..." : "Deletar"}
        </Button>
      </div>
      <QRCodeDialog
        instanceId={instance.id}
        instanceName={instance.instanceName}
        open={qrOpen}
        onOpenChange={setQrOpen}
      />
    </div>
  );
}
