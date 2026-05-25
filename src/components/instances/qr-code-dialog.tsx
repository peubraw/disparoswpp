"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type QRCodeDialogProps = {
  instanceId: string;
  instanceName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type QRResponse = { base64: string; code: string };

export function QRCodeDialog({
  instanceId,
  instanceName,
  open,
  onOpenChange,
}: QRCodeDialogProps) {
  const [base64, setBase64] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearTimers() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }

  useEffect(() => {
    if (!open) {
      clearTimers();
      return;
    }

    Promise.resolve().then(() => {
      setBase64(null);
      setExpired(false);
    });

    const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

    async function fetchQR() {
      try {
        const r = await fetch(`${basePath}/api/instances/${instanceId}/qr`);
        const data = await r.json() as QRResponse & { error?: string };
        if (data.base64) {
          setBase64(data.base64);
          return true;
        }
      } catch {}
      return false;
    }

    fetchQR().then((ok) => {
      if (!ok) {
        const retryInterval = setInterval(async () => {
          const success = await fetchQR();
          if (success) clearInterval(retryInterval);
        }, 3000);
        intervalRef.current = retryInterval;
      }
    });

    timeoutRef.current = setTimeout(() => {
      clearTimers();
      setExpired(true);
    }, 120000);

    return clearTimers;
  }, [open, instanceId, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Conectar {instanceName}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          {expired ? (
            <p className="text-sm text-destructive">
              QR code expirado, tente novamente.
            </p>
          ) : !base64 ? (
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          ) : base64 ? (
            <>
              <Image src={base64} alt="QR Code" width={256} height={256} unoptimized />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              QR code não disponível.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
