"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createContactList, addContact } from "@/actions/contacts";
import { CsvUpload } from "@/components/contacts/csv-upload";

type Step = "form" | "import";
type ImportTab = "csv" | "manual";

export default function NovaListaPage() {
  const [step, setStep] = useState<Step>("form");
  const [listName, setListName] = useState("");
  const [listId, setListId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [importTab, setImportTab] = useState<ImportTab>("csv");

  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [addLoading, setAddLoading] = useState(false);
  const [addedCount, setAddedCount] = useState(0);

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
    setStep("import");
  }

  function handleImportSuccess(result: { imported: number; duplicates: number }) {
    alert(`${result.imported} contatos importados. ${result.duplicates} duplicatas ignoradas.`);
    router.push("/contatos");
  }

  async function handleAddContact(e: React.FormEvent) {
    e.preventDefault();
    if (!listId || !phone.trim()) return;
    setAddLoading(true);
    setAddError(null);
    const result = await addContact(listId, phone, name);
    setAddLoading(false);
    if ("error" in result && result.error) {
      setAddError(result.error as string);
      return;
    }
    setPhone("");
    setName("");
    setAddedCount((c) => c + 1);
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

      {step === "import" && listId && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
            <p className="text-sm text-green-800">
              Lista <strong>{listName}</strong> criada com sucesso. Adicione contatos abaixo.
            </p>
          </div>

          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setImportTab("csv")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                importTab === "csv"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Importar CSV
            </button>
            <button
              onClick={() => setImportTab("manual")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                importTab === "manual"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Adicionar manualmente
            </button>
          </div>

          {importTab === "csv" && (
            <CsvUpload listId={listId} onSuccess={handleImportSuccess} />
          )}

          {importTab === "manual" && (
            <div className="space-y-4">
              {addedCount > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-sm text-blue-800">
                  {addedCount} contato{addedCount !== 1 ? "s" : ""} adicionado{addedCount !== 1 ? "s" : ""}.
                </div>
              )}
              <form onSubmit={handleAddContact} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ex: 5511999999999"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 mt-1">Código do país + DDD + número. Ex: 5511999999999</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome (opcional)</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: João Silva"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {addError && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{addError}</p>
                )}
                <button
                  type="submit"
                  disabled={addLoading || !phone.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {addLoading ? "Adicionando..." : "Adicionar Contato"}
                </button>
              </form>
            </div>
          )}

          <button
            onClick={() => router.push("/contatos")}
            className="text-sm text-gray-500 hover:underline"
          >
            {addedCount > 0 || importTab === "csv" ? "Concluir" : "Pular"}
          </button>
        </div>
      )}
    </div>
  );
}
