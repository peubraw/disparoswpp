"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { QRCodeDialog } from "@/components/instances/qr-code-dialog";
import { deleteInstance } from "@/actions/instances";
import { cn } from "@/lib/utils";

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

  // Custom futuristic badge replacing the generic UI one to adhere to constraints
  const renderStatus = () => {
    switch (instance.status) {
      case "CONNECTED":
        return (
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-sm bg-[rgba(37,211,102,0.1)] border border-[rgba(37,211,102,0.3)]">
            <div className="h-1.5 w-1.5 rounded-full bg-[#25D366] animate-pulse-green shadow-[0_0_5px_#25D366]"></div>
            <span className="text-[10px] font-heading font-bold tracking-widest text-[#25D366]">CONNECTED</span>
          </div>
        );
      case "CONNECTING":
        return (
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-sm bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.3)]">
            <div className="h-1.5 w-1.5 rounded-full bg-[#f59e0b] animate-pulse"></div>
            <span className="text-[10px] font-heading font-bold tracking-widest text-[#f59e0b]">CONNECTING</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-sm bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)]">
            <div className="h-1.5 w-1.5 rounded-full bg-[#ef4444]"></div>
            <span className="text-[10px] font-heading font-bold tracking-widest text-[#ef4444]">DISCONNECTED</span>
          </div>
        );
    }
  };

  return (
    <div className="rounded-xl border border-[rgba(37,211,102,0.15)] bg-[#111a16] p-5 flex flex-col gap-4 transition-all duration-300 hover:border-[rgba(37,211,102,0.4)] hover:shadow-[0_0_15px_rgba(37,211,102,0.1)] hover:-translate-y-1 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-24 h-24 bg-[radial-gradient(circle_at_top_right,rgba(37,211,102,0.05)_0,transparent_70%)] pointer-events-none"></div>
      
      <div className="flex items-start justify-between z-10 relative">
        <span className="font-heading font-bold text-lg text-[#e8f5e9] tracking-wider group-hover:text-[#25D366] transition-colors">
          {instance.instanceName}
        </span>
        {renderStatus()}
      </div>
      
      <div className="font-mono text-sm text-[rgba(37,211,102,0.5)] bg-[rgba(37,211,102,0.02)] px-3 py-1.5 rounded border border-[rgba(37,211,102,0.05)] inline-block w-fit">
        {instance.phoneNumber ?? "Aguardando conexão..."}
      </div>
      
      <div className="flex gap-3 mt-auto pt-2 z-10 relative">
        {instance.status !== "CONNECTED" && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setQrOpen(true)}
            className="flex-1 bg-transparent border-[rgba(37,211,102,0.4)] text-[#25D366] hover:bg-[rgba(37,211,102,0.1)] hover:text-[#25D366] font-heading text-xs tracking-widest uppercase transition-all"
          >
            [ VER QR ]
          </Button>
        )}
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={deleting}
          className={cn(
            "flex-1 bg-[rgba(239,68,68,0.1)] text-[#ef4444] border border-[rgba(239,68,68,0.2)] hover:bg-[rgba(239,68,68,0.2)] hover:text-[#ef4444] font-heading text-xs tracking-widest uppercase transition-all",
            instance.status === "CONNECTED" && "w-full"
          )}
        >
          {deleting ? "[ DELETANDO... ]" : "[ DELETAR ]"}
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
