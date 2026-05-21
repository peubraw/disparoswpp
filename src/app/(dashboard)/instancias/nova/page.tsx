"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createInstance } from "@/actions/instances";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function NovaInstanciaPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmed = name.trim();
    if (!trimmed) {
      setError("Nome é obrigatório.");
      return;
    }
    if (!/^[a-zA-Z0-9-]+$/.test(trimmed)) {
      setError("Use apenas letras, números e hífens.");
      return;
    }
    if (trimmed.length > 50) {
      setError("Nome deve ter no máximo 50 caracteres.");
      return;
    }

    setLoading(true);
    const result = await createInstance(trimmed);
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    router.push("/instancias");
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-md">
      <h1 className="text-2xl font-bold">Nova Instância</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Nome da instância</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="minha-instancia"
            maxLength={50}
            required
          />
          <p className="text-xs text-muted-foreground">
            Apenas letras, números e hífens. Máximo 50 caracteres.
          </p>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={loading}>
          {loading ? "Criando..." : "Criar instância"}
        </Button>
      </form>
    </div>
  );
}
