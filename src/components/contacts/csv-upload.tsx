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
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          dragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
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
          <p className="text-sm text-gray-700">
            <span className="font-medium">{file.name}</span> ({(file.size / 1024).toFixed(1)} KB)
          </p>
        ) : (
          <p className="text-sm text-gray-500">
            Arraste um arquivo CSV ou <span className="text-blue-600 underline">clique para selecionar</span>
          </p>
        )}
      </div>

      {headers.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-600">Coluna CSV</th>
                <th className="px-4 py-2 text-left font-medium text-gray-600">Mapeado para</th>
              </tr>
            </thead>
            <tbody>
              {headers.map((h) => (
                <tr key={h} className="border-t">
                  <td className="px-4 py-2 text-gray-800">{h}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        mapping[h] === "phoneNumber"
                          ? "bg-green-100 text-green-800"
                          : mapping[h] === "name"
                          ? "bg-blue-100 text-blue-800"
                          : mapping[h] === "company"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-gray-100 text-gray-600"
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
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
      )}

      <button
        onClick={handleImport}
        disabled={!file || loading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Importando..." : "Importar Contatos"}
      </button>
    </div>
  );
}
