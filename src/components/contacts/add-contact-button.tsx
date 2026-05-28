"use client";

import { useState } from "react";
import { addContact } from "@/actions/contacts";

interface Props {
  listId: string;
}

export function AddContactButton({ listId }: Props) {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await addContact(listId, phone, name);
    setLoading(false);
    if ("error" in result && result.error) {
      setError(result.error as string);
      return;
    }
    setPhone("");
    setName("");
    setOpen(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="font-heading text-xs tracking-widest uppercase border border-[rgba(37,211,102,0.4)] text-[#25D366] bg-[rgba(37,211,102,0.08)] hover:bg-[rgba(37,211,102,0.15)] rounded-sm px-4 py-2 transition-colors"
      >
        + Adicionar Contato
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-[#111a16] border border-[rgba(37,211,102,0.2)] rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-heading tracking-widest uppercase font-semibold text-[#e8f5e9]">Adicionar Contato</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-heading text-xs tracking-widest uppercase text-muted-foreground mb-1">
                  Telefone <span className="text-[#ef4444]">*</span>
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ex: 5511999999999"
                  className="w-full bg-[#0a0f0d] border border-[rgba(37,211,102,0.2)] text-[#e8f5e9] focus:border-[#25D366] focus:ring-0 rounded-sm px-3 py-2 text-sm focus:outline-none"
                  required
                  autoFocus
                />
                <p className="text-xs text-muted-foreground mt-1">Formato: código do país + DDD + número. Ex: 5511999999999</p>
              </div>

              <div>
                <label className="block font-heading text-xs tracking-widest uppercase text-muted-foreground mb-1">Nome</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: João Silva (opcional)"
                  className="w-full bg-[#0a0f0d] border border-[rgba(37,211,102,0.2)] text-[#e8f5e9] focus:border-[#25D366] focus:ring-0 rounded-sm px-3 py-2 text-sm focus:outline-none"
                />
              </div>

              {error && (
                <p className="text-sm text-[#ef4444] bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] rounded-sm px-3 py-2">{error}</p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setOpen(false); setError(null); }}
                  className="font-heading text-xs tracking-widest uppercase border border-[rgba(37,211,102,0.15)] text-muted-foreground bg-transparent hover:border-[rgba(37,211,102,0.3)] rounded-sm px-4 py-2 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !phone.trim()}
                  className="font-heading text-xs tracking-widest uppercase border border-[rgba(37,211,102,0.4)] text-[#25D366] bg-[rgba(37,211,102,0.08)] hover:bg-[rgba(37,211,102,0.15)] rounded-sm px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? "Salvando..." : "Adicionar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
