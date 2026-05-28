"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** localStorage key — when set, shows "Não perguntar novamente" checkbox */
  storageKey?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  storageKey,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [skipNext, setSkipNext] = useState(false);

  function handleConfirm() {
    if (storageKey && skipNext) {
      localStorage.setItem(storageKey, "1");
    }
    onConfirm();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {storageKey && (
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={skipNext}
              onChange={(e) => setSkipNext(e.target.checked)}
              className="accent-[#25D366] h-4 w-4"
            />
            Não perguntar novamente
          </label>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant="destructive" onClick={handleConfirm}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Returns whether the user has previously checked "Não perguntar novamente"
 * for the given storageKey. Call this before showing the dialog — if true,
 * skip the dialog and proceed directly.
 */
export function shouldSkipConfirm(storageKey: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(storageKey) === "1";
}
