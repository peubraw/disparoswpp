"use client";

import { useState } from "react";
import { deleteContact } from "@/actions/contacts";

interface Props {
  contactId: string;
  listId: string;
}

export function DeleteContactButton({ contactId, listId }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Remover este contato?")) return;
    setLoading(true);
    await deleteContact(contactId, listId);
    setLoading(false);
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-red-500 hover:text-red-700 text-sm disabled:opacity-50"
    >
      {loading ? "..." : "Remover"}
    </button>
  );
}
