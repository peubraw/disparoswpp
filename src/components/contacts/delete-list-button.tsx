"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteContactList } from "@/actions/contacts";
import { ConfirmDialog, shouldSkipConfirm } from "@/components/ui/confirm-dialog";

interface DeleteListButtonProps {
  listId: string;
  listName: string;
}

const DELETE_LIST_KEY = "skipDeleteListConfirm";

export function DeleteListButton({ listId, listName }: DeleteListButtonProps) {
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setLoading(true);
    const result = await deleteContactList(listId);
    setLoading(false);
    if ("error" in result && result.error) {
      alert(result.error);
    } else {
      router.refresh();
    }
  }

  function handleClick() {
    if (shouldSkipConfirm(DELETE_LIST_KEY)) {
      handleDelete();
    } else {
      setDialogOpen(true);
    }
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={loading}
        className="font-heading text-xs font-bold tracking-widest text-[#ef4444] hover:text-[#fca5a5] transition-colors uppercase disabled:opacity-40"
      >
        {loading ? "[ EXCLUINDO... ]" : "[ EXCLUIR ]"}
      </button>

      <ConfirmDialog
        open={dialogOpen}
        title={`Excluir lista "${listName}"?`}
        description="Todos os contatos desta lista serão removidos permanentemente. Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        storageKey={DELETE_LIST_KEY}
        onConfirm={() => { setDialogOpen(false); handleDelete(); }}
        onCancel={() => setDialogOpen(false)}
      />
    </>
  );
}
