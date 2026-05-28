"use client";

import { useState } from "react";
import { validateContactListNumbers } from "@/actions/contacts";

interface Props {
  listId: string;
  instanceName: string | null;
}

export function ValidateContactListNumbersButton({ listId, instanceName }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleValidate() {
    if (!instanceName) {
      alert("Nenhuma instância conectada disponível para validar números.");
      return;
    }

    setLoading(true);
    try {
      const result = await validateContactListNumbers(listId, instanceName);
      if ("error" in result && result.error) {
        alert(result.error as string);
        return;
      }

      alert(`Validação concluída: ${result.valid} válidos, ${result.invalid} inválidos, ${result.total} total.`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleValidate}
      disabled={loading || !instanceName}
      className="font-heading text-xs tracking-widest uppercase border border-[rgba(37,211,102,0.4)] text-[#25D366] bg-[rgba(37,211,102,0.08)] hover:bg-[rgba(37,211,102,0.15)] rounded-sm px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {loading ? "Validando..." : "Validar Números"}
    </button>
  );
}
