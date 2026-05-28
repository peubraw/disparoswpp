"use client";

import { useState } from "react";
import { deleteContact } from "@/actions/contacts";
import { ConfirmDialog, shouldSkipConfirm } from "@/components/ui/confirm-dialog";

interface Props {
  contactId: string;
  listId: string;
}

const DELETE_CONTACT_KEY = "skipDeleteContactConfirm";

export function DeleteContactButton({ contactId, listId }: Props) {
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  async function handleDelete() {
    setLoading(true);
    await deleteContact(contactId, listId);
    setLoading(false);
  }

  function handleClick() {
    if (shouldSkipConfirm(DELETE_CONTACT_KEY)) {
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
        className="text-red-500 hover:text-red-700 text-sm disabled:opacity-50"
      >
        {loading ? "..." : "Remover"}
      </button>

      <ConfirmDialog
        open={dialogOpen}
        title="Remover contato?"
        description="O contato será removido desta lista permanentemente."
        confirmLabel="Remover"
        cancelLabel="Cancelar"
        storageKey={DELETE_CONTACT_KEY}
        onConfirm={() => { setDialogOpen(false); handleDelete(); }}
        onCancel={() => setDialogOpen(false)}
      />
    </>
  );
}
