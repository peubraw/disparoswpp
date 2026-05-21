"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteContactList } from "@/actions/contacts";

interface DeleteListButtonProps {
  listId: string;
  listName: string;
}

export function DeleteListButton({ listId, listName }: DeleteListButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm(`Excluir lista "${listName}"?`)) return;
    setLoading(true);
    const result = await deleteContactList(listId);
    setLoading(false);
    if ("error" in result && result.error) {
      alert(result.error);
    } else {
      router.refresh();
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-red-600 hover:underline text-sm disabled:opacity-50"
    >
      {loading ? "Excluindo..." : "Excluir"}
    </button>
  );
}
