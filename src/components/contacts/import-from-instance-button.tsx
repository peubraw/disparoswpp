"use client";

import { useState } from "react";
import { importFromInstance, importGroupsFromInstance } from "@/actions/contacts";

interface Props {
  listId: string;
  instances: string[];
}

type ImportMode = "contacts" | "groups";

export function ImportFromInstanceButton({ listId, instances }: Props) {
  const [loading, setLoading] = useState<ImportMode | null>(null);
  const [pendingMode, setPendingMode] = useState<ImportMode | null>(null);
  const [selectedInstance, setSelectedInstance] = useState<string>("");

  const hasInstances = instances.length > 0;
  const needsPicker = instances.length > 1;

  async function runImport(mode: ImportMode, instanceName: string) {
    setLoading(mode);
    setPendingMode(null);
    setSelectedInstance("");
    try {
      const result = mode === "contacts"
        ? await importFromInstance(listId, instanceName)
        : await importGroupsFromInstance(listId, instanceName);

      if ("error" in result && result.error) {
        alert(result.error as string);
        return;
      }
      const label = mode === "contacts" ? "contatos" : "grupos";
      alert(`Importação concluída: ${result.imported} de ${result.total} ${label} importados.`);
    } finally {
      setLoading(null);
    }
  }

  function handleClick(mode: ImportMode) {
    if (!hasInstances) {
      alert("Nenhuma instância conectada disponível.");
      return;
    }
    if (needsPicker) {
      setPendingMode(mode);
      setSelectedInstance(instances[0]);
      return;
    }
    runImport(mode, instances[0]);
  }

  function handlePickerConfirm() {
    if (!pendingMode || !selectedInstance) return;
    runImport(pendingMode, selectedInstance);
  }

  const btnClass = "font-heading text-xs tracking-widest uppercase border border-[rgba(37,211,102,0.4)] text-[#25D366] bg-[rgba(37,211,102,0.08)] hover:bg-[rgba(37,211,102,0.15)] rounded-sm px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <button
          onClick={() => handleClick("contacts")}
          disabled={loading !== null || !hasInstances}
          className={btnClass}
        >
          {loading === "contacts" ? "Importando..." : "Importar Contatos"}
        </button>
        <button
          onClick={() => handleClick("groups")}
          disabled={loading !== null || !hasInstances}
          className={btnClass}
        >
          {loading === "groups" ? "Importando..." : "Importar Grupos"}
        </button>
      </div>

      {pendingMode && (
        <div className="flex items-center gap-2 p-2 border border-[rgba(37,211,102,0.3)] rounded-sm bg-[rgba(37,211,102,0.05)]">
          <span className="font-heading text-xs text-[#25D366] uppercase tracking-widest whitespace-nowrap">
            Instância:
          </span>
          <select
            value={selectedInstance}
            onChange={e => setSelectedInstance(e.target.value)}
            className="flex-1 bg-[#0a0f0d] border border-[rgba(37,211,102,0.3)] text-[#e8f5e9] text-xs rounded-sm px-2 py-1 focus:outline-none focus:border-[#25D366]"
          >
            {instances.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          <button onClick={handlePickerConfirm} className={btnClass}>
            Confirmar
          </button>
          <button
            onClick={() => { setPendingMode(null); setSelectedInstance(""); }}
            className="font-heading text-xs tracking-widest uppercase border border-[rgba(239,68,68,0.4)] text-[#ef4444] bg-transparent hover:bg-[rgba(239,68,68,0.08)] rounded-sm px-3 py-2 transition-colors"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}
