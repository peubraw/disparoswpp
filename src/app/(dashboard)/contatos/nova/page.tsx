"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createContactList } from "@/actions/contacts";
import { CsvUpload } from "@/components/contacts/csv-upload";

type Step = "form" | "upload";

export default function NovaListaPage() {
  const [step, setStep] = useState<Step>("form");
  const [listName, setListName] = useState("");
  const [listId, setListId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleCreateList(e: React.FormEvent) {
    e.preventDefault();
    if (!listName.trim()) return;
    setLoading(true);
    setError(null);
    const result = await createContactList(listName.trim());
    setLoading(false);
    if ("error" in result && result.error) {
      setError(result.error as string);
      return;
    }
    setListId(result.list.id);
    setStep("upload");
  }

  function handleImportSuccess(result: { imported: number; duplicates: number }) {
    alert(`${result.imported} contatos importados. ${result.duplicates} duplicatas ignoradas.`);
    router.push("/contatos");
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Nova Lista de Contatos</h1>

      {step === "form" && (
        <form onSubmit={handleCreateList} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome da lista <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              placeholder="Ex: Clientes Janeiro 2025"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push("/contatos")}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !listName.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Criando..." : "Criar Lista"}
            </button>
          </div>
        </form>
      )}

      {step === "upload" && listId && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
            <p className="text-sm text-green-800">
              Lista <strong>{listName}</strong> criada com sucesso. Agora importe seus contatos via CSV.
            </p>
          </div>
          <CsvUpload listId={listId} onSuccess={handleImportSuccess} />
          <button
            onClick={() => router.push("/contatos")}
            className="text-sm text-gray-500 hover:underline"
          >
            Pular importação
          </button>
        </div>
      )}
    </div>
  );
}
