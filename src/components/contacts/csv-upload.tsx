"use client";

import { useCallback, useRef, useState } from "react";

import { ColumnMapper } from "./column-mapper";

interface ImportResult {
  imported: number;
  duplicates: number;
  errors: number;
}

interface CsvUploadProps {
  listId: string;
  onSuccess: (result: { imported: number; duplicates: number }) => void;
}

export function CsvUpload({ listId, onSuccess }: CsvUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  function readHeaders(f: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const firstLine = text.split("\n")[0] ?? "";
      const cols = firstLine.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
      setHeaders(cols);
      setMapping({});
    };
    reader.readAsText(f);
  }

  const handleMappingChange = useCallback(
    (nameMapping: Record<string, string>) => {
      const indexMapping: Record<string, string> = {};

      for (const [headerName, fieldName] of Object.entries(nameMapping)) {
        const idx = headers.indexOf(headerName);
        if (idx >= 0) indexMapping[String(idx)] = fieldName;
      }

      setMapping(indexMapping);
    },
    [headers],
  );

  function handleFile(f: File) {
    setFile(f);
    setError(null);
    readHeaders(f);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  async function handleImport() {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("listId", listId);
      formData.append("mapping", JSON.stringify(mapping));
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
      const res = await fetch(`${basePath}/api/contacts/import`, { method: "POST", body: formData });
      const data = (await res.json()) as ImportResult & { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Erro ao importar.");
        return;
      }
      onSuccess({ imported: data.imported, duplicates: data.duplicates });
    } catch {
      setError("Erro de rede ao importar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-sm p-8 text-center cursor-pointer transition-colors ${
          dragging ? "border-[#25D366] bg-[rgba(37,211,102,0.05)]" : "border-[rgba(37,211,102,0.2)] hover:border-[rgba(37,211,102,0.4)]"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
        {file ? (
          <p className="text-sm text-[#e8f5e9]">
            <span className="font-medium">{file.name}</span> ({(file.size / 1024).toFixed(1)} KB)
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Arraste um arquivo CSV ou <span className="text-[#25D366] hover:text-[#e8f5e9] underline">clique para selecionar</span>
          </p>
        )}
      </div>

      {headers.length > 0 && <ColumnMapper headers={headers} onMappingChange={handleMappingChange} />}

      {error && (
        <p className="text-sm text-[#ef4444] bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] rounded-sm px-3 py-2">{error}</p>
      )}

      <button
        onClick={handleImport}
        disabled={!file || loading}
        className="w-full font-heading text-xs tracking-widest uppercase border border-[rgba(37,211,102,0.4)] text-[#25D366] bg-[rgba(37,211,102,0.08)] hover:bg-[rgba(37,211,102,0.15)] rounded-sm px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Importando..." : "Importar Contatos"}
      </button>
    </div>
  );
}
