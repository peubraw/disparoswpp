"use client";

import { useRef, useState } from "react";

interface ImportResult {
  imported: number;
  duplicates: number;
  errors: number;
}

interface CsvUploadProps {
  listId: string;
  onSuccess: (result: { imported: number; duplicates: number }) => void;
}

const PHONE_KEYS = ["telefone", "phone", "phonenumber", "numero", "celular", "mobile"];
const NAME_KEYS = ["nome", "name"];
const COMPANY_KEYS = ["empresa", "company", "compania"];

function detectMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  for (const h of headers) {
    const lower = h.toLowerCase().trim().replace(/\s/g, "");
    if (PHONE_KEYS.includes(lower)) mapping[h] = "phoneNumber";
    else if (NAME_KEYS.includes(lower)) mapping[h] = "name";
    else if (COMPANY_KEYS.includes(lower)) mapping[h] = "company";
    else mapping[h] = "customField";
  }
  return mapping;
}

const FIELD_LABELS: Record<string, string> = {
  phoneNumber: "Telefone",
  name: "Nome",
  company: "Empresa",
  customField: "Campo personalizado",
};

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
      setMapping(detectMapping(cols));
    };
    reader.readAsText(f);
  }

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
      const res = await fetch("/api/contacts/import", { method: "POST", body: formData });
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

      {headers.length > 0 && (
        <div className="border border-[rgba(37,211,102,0.15)] rounded-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[rgba(37,211,102,0.05)] border-b border-[rgba(37,211,102,0.15)]">
              <tr>
                <th className="px-4 py-2 text-left font-heading text-xs tracking-widest uppercase text-[#25D366]">Coluna CSV</th>
                <th className="px-4 py-2 text-left font-heading text-xs tracking-widest uppercase text-[#25D366]">Mapeado para</th>
              </tr>
            </thead>
            <tbody>
              {headers.map((h) => (
                <tr key={h} className="border-t border-[rgba(37,211,102,0.08)] hover:bg-[rgba(37,211,102,0.04)] transition-colors">
                  <td className="px-4 py-2 text-[#e8f5e9]">{h}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-sm font-heading tracking-widest uppercase text-[10px] ${
                        mapping[h] === "phoneNumber"
                          ? "bg-[rgba(37,211,102,0.1)] text-[#25D366] border border-[rgba(37,211,102,0.2)]"
                          : mapping[h] === "name"
                          ? "bg-[rgba(37,211,102,0.1)] text-[#25D366] border border-[rgba(37,211,102,0.2)]"
                          : mapping[h] === "company"
                          ? "bg-[rgba(37,211,102,0.1)] text-[#25D366] border border-[rgba(37,211,102,0.2)]"
                          : "bg-[rgba(232,245,233,0.1)] text-[#e8f5e9] border border-[rgba(37,211,102,0.15)]"
                      }`}
                    >
                      {FIELD_LABELS[mapping[h]] ?? mapping[h]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
