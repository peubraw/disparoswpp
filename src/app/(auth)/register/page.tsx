"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerUser } from "@/actions/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setPending(true);
    try {
      const result = await registerUser(formData);
      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        router.push("/login");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0f0d]">
      <div className="w-full max-w-md rounded-xl border border-[rgba(37,211,102,0.2)] bg-[#111a16] p-8 shadow-sm">
        <h1 className="mb-6 text-2xl font-heading tracking-widest uppercase font-bold text-[#e8f5e9] flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-[#25D366] animate-pulse"></div>
          DISPAROS
        </h1>

        {error && (
          <div className="mb-4 rounded-md bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] p-3 text-sm text-[#ef4444]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="mb-1 block font-heading text-xs tracking-widest uppercase text-muted-foreground">
              Nome
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              autoComplete="name"
              className="w-full rounded-sm bg-[#0a0f0d] border border-[rgba(37,211,102,0.2)] px-3 py-2 text-sm text-[#e8f5e9] focus:border-[#25D366] focus:outline-none focus:ring-0"
              placeholder="Seu nome"
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block font-heading text-xs tracking-widest uppercase text-muted-foreground">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-sm bg-[#0a0f0d] border border-[rgba(37,211,102,0.2)] px-3 py-2 text-sm text-[#e8f5e9] focus:border-[#25D366] focus:outline-none focus:ring-0"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block font-heading text-xs tracking-widest uppercase text-muted-foreground">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="new-password"
              className="w-full rounded-sm bg-[#0a0f0d] border border-[rgba(37,211,102,0.2)] px-3 py-2 text-sm text-[#e8f5e9] focus:border-[#25D366] focus:outline-none focus:ring-0"
              placeholder="••••••"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="mb-1 block font-heading text-xs tracking-widest uppercase text-muted-foreground">
              Confirmar senha
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              autoComplete="new-password"
              className="w-full rounded-sm bg-[#0a0f0d] border border-[rgba(37,211,102,0.2)] px-3 py-2 text-sm text-[#e8f5e9] focus:border-[#25D366] focus:outline-none focus:ring-0"
              placeholder="••••••"
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-sm font-heading text-xs tracking-widest uppercase border border-[rgba(37,211,102,0.4)] text-[#25D366] bg-[rgba(37,211,102,0.08)] hover:bg-[rgba(37,211,102,0.15)] px-4 py-2 disabled:opacity-50"
          >
            {pending ? "Criando conta..." : "Criar conta"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link href="/login" className="font-heading text-xs tracking-widest uppercase text-[#25D366] hover:text-[#e8f5e9] hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
