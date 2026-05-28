"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteUserAsAdmin } from "@/actions/admin";
import { ConfirmDialog, shouldSkipConfirm } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";

const DELETE_USER_KEY = "skipDeleteUserConfirm";

export function DeleteUserButton({ userId, userName }: { userId: string; userName: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setLoading(true);
    setError(null);
    const result = await deleteUserAsAdmin(userId);
    setLoading(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    router.push("/admin");
  }

  function handleClick() {
    if (shouldSkipConfirm(DELETE_USER_KEY)) {
      handleDelete();
    } else {
      setDialogOpen(true);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button variant="destructive" size="sm" disabled={loading} onClick={handleClick}>
        {loading ? "Deletando..." : "Deletar conta"}
      </Button>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <ConfirmDialog
        open={dialogOpen}
        title={`Deletar conta de ${userName}?`}
        description="Todos os dados deste usuário (instâncias, campanhas, contatos, mensagens) serão removidos permanentemente. Esta ação não pode ser desfeita."
        confirmLabel="Deletar"
        cancelLabel="Cancelar"
        storageKey={DELETE_USER_KEY}
        onConfirm={() => { setDialogOpen(false); handleDelete(); }}
        onCancel={() => setDialogOpen(false)}
      />
    </div>
  );
}
