"use client";

import { useState } from "react";
import { importFromInstance, importGroupsFromInstance } from "@/actions/contacts";

interface Props {
  listId: string;
  instanceName: string | null;
}

type ImportMode = "contacts" | "groups";

export function ImportFromInstanceButton({ listId, instanceName }: Props) {
  const [loading, setLoading] = useState<ImportMode | null>(null);

  async function handleImport(mode: ImportMode) {
    if (!instanceName) {
      alert("Nenhuma instância conectada disponível.");
      return;
    }

    const label = mode === "contacts" ? "contatos" : "grupos";
    if (!confirm(`Importar ${label} da instância "${instanceName}" para esta lista?`)) return;

    setLoading(mode);
    try {
      const result = mode === "contacts"
        ? await importFromInstance(listId, instanceName)
        : await importGroupsFromInstance(listId, instanceName);

      if ("error" in result && result.error) {
        alert(result.error as string);
        return;
      }
      alert(`Importação concluída: ${result.imported} de ${result.total} ${label} importados.`);
    } finally {
      setLoading(null);
    }
  }

  const btnClass = "font-heading text-xs tracking-widest uppercase border border-[rgba(37,211,102,0.4)] text-[#25D366] bg-[rgba(37,211,102,0.08)] hover:bg-[rgba(37,211,102,0.15)] rounded-sm px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors";

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleImport("contacts")}
        disabled={loading !== null || !instanceName}
        className={btnClass}
      >
        {loading === "contacts" ? "Importando..." : "Importar Contatos"}
      </button>
      <button
        onClick={() => handleImport("groups")}
        disabled={loading !== null || !instanceName}
        className={btnClass}
      >
        {loading === "groups" ? "Importando..." : "Importar Grupos"}
      </button>
    </div>
  );
}
