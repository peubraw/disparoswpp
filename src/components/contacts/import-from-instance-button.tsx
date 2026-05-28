"use client";

import { useState } from "react";
import { importFromInstance } from "@/actions/contacts";

interface Props {
  listId: string;
  instanceName: string | null;
}

export function ImportFromInstanceButton({ listId, instanceName }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleImport() {
    if (!instanceName) {
      alert("Nenhuma instância conectada disponível.");
      return;
    }

    if (!confirm(`Importar contatos da instância "${instanceName}" para esta lista?`)) return;

    setLoading(true);
    try {
      const result = await importFromInstance(listId, instanceName);
      if ("error" in result && result.error) {
        alert(result.error as string);
        return;
      }
      alert(`Importação concluída: ${result.imported} de ${result.total} contatos importados.`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleImport}
      disabled={loading || !instanceName}
      className="font-heading text-xs tracking-widest uppercase border border-[rgba(37,211,102,0.4)] text-[#25D366] bg-[rgba(37,211,102,0.08)] hover:bg-[rgba(37,211,102,0.15)] rounded-sm px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {loading ? "Importando..." : "Importar da Instância"}
    </button>
  );
}
