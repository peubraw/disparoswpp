"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginUser } from "@/actions/auth";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const formData = new FormData(e.currentTarget);
    try {
      const result = await loginUser(formData);
      if (result?.error) {
        setError(result.error);
      }
    } catch {
      // signIn throws a redirect internally on success — that's expected
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
              autoComplete="current-password"
              className="w-full rounded-sm bg-[#0a0f0d] border border-[rgba(37,211,102,0.2)] px-3 py-2 text-sm text-[#e8f5e9] focus:border-[#25D366] focus:outline-none focus:ring-0"
              placeholder="••••••"
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-sm font-heading text-xs tracking-widest uppercase border border-[rgba(37,211,102,0.4)] text-[#25D366] bg-[rgba(37,211,102,0.08)] hover:bg-[rgba(37,211,102,0.15)] px-4 py-2 disabled:opacity-50"
          >
            {pending ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Não tem conta?{" "}
          <Link href="/register" className="font-heading text-xs tracking-widest uppercase text-[#25D366] hover:text-[#e8f5e9] hover:underline">
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  );
}
