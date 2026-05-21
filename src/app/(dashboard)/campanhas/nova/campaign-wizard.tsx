"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { createCampaign } from "@/actions/campaigns";
import { TemplateEditor } from "@/components/campaigns/template-editor";
import { MediaUpload } from "@/components/campaigns/media-upload";

type Instance = { id: string; instanceName: string };
type ContactList = { id: string; name: string; contactCount: number };

export function CampaignWizard({ instances, contactLists }: { instances: Instance[]; contactLists: ContactList[] }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [waInstanceId, setWaInstanceId] = useState("");
  const [messageTemplate, setMessageTemplate] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [selectedLists, setSelectedLists] = useState<string[]>([]);
  const [throttleDelay, setThrottleDelay] = useState("3000");
  const [scheduledFor, setScheduledFor] = useState("");

  const handleNext = () => {
    setError(null);
    if (step === 1) {
      if (!name) return setError("Nome da campanha é obrigatório.");
      if (!waInstanceId) return setError("Selecione uma instância conectada.");
    } else if (step === 2) {
      if (!messageTemplate) return setError("A mensagem não pode estar vazia.");
    } else if (step === 3) {
      if (selectedLists.length === 0) return setError("Selecione pelo menos uma lista de contatos.");
      const totalContacts = contactLists.filter(l => selectedLists.includes(l.id)).reduce((acc, l) => acc + l.contactCount, 0);
      if (totalContacts === 0) return setError("As listas selecionadas não possuem contatos.");
    }
    setStep((s) => Math.min(s + 1, 4));
  };

  const handleBack = () => {
    setError(null);
    setStep((s) => Math.max(s - 1, 1));
  };

  const toggleList = (id: string) => {
    setSelectedLists((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      let mediaUrl = null;
      let mediaType = "NONE";

      if (mediaFile) {
        const formData = new FormData();
        formData.append("file", mediaFile);

        const res = await fetch("/api/campaigns/media-upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          throw new Error("Falha ao fazer upload da mídia.");
        }

        const data = await res.json();
        mediaUrl = data.url;

        if (mediaFile.type.startsWith("image/")) mediaType = "IMAGE";
        else if (mediaFile.type.startsWith("video/")) mediaType = "VIDEO";
        else if (mediaFile.type.startsWith("audio/")) mediaType = "AUDIO";
        else mediaType = "DOCUMENT";
      }

      const res = await createCampaign({
        name,
        waInstanceId,
        messageTemplate,
        contactListIds: selectedLists,
        throttleDelay: parseInt(throttleDelay),
        scheduledFor: scheduledFor ? new Date(scheduledFor).toISOString() : null,
        mediaUrl,
        mediaType: mediaType as "NONE" | "IMAGE" | "VIDEO" | "AUDIO" | "DOCUMENT",
      });

      if (res.error) {
        throw new Error(res.error);
      }

      router.push("/campanhas");
    } catch (err: any) {
      setError(err.message || "Erro ao criar campanha.");
      setLoading(false);
    }
  };

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>Passo {step} de 4</CardTitle>
        <CardDescription>
          {step === 1 && "Configurações iniciais"}
          {step === 2 && "Crie sua mensagem"}
          {step === 3 && "Selecione o público-alvo"}
          {step === 4 && "Opções de envio"}
        </CardDescription>
        <Progress value={(step / 4) * 100} className="mt-2" />
      </CardHeader>
      
      <CardContent className="space-y-6">
        {error && <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>}

        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da Campanha</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Promoção de Natal" />
            </div>
            <div className="space-y-2">
              <Label>Instância do WhatsApp</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={waInstanceId}
                onChange={(e) => setWaInstanceId(e.target.value)}
              >
                <option value="">Selecione uma instância</option>
                {instances.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.instanceName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <TemplateEditor value={messageTemplate} onChange={setMessageTemplate} />
            <MediaUpload onFileSelected={setMediaFile} />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <Label>Listas de Contatos</Label>
            {contactLists.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma lista encontrada.</p>
            ) : (
              <div className="grid gap-3">
                {contactLists.map((list) => (
                  <label
                    key={list.id}
                    className="flex items-center justify-between rounded-md border p-4 hover:bg-muted/50 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedLists.includes(list.id)}
                        onChange={() => toggleList(list.id)}
                        className="h-4 w-4"
                      />
                      <span className="font-medium">{list.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{list.contactCount} contatos</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Intervalo entre mensagens (ms)</Label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1000"
                  max="60000"
                  step="500"
                  value={throttleDelay}
                  onChange={(e) => setThrottleDelay(e.target.value)}
                  className="w-full"
                />
                <span className="w-16 text-right text-sm">{parseInt(throttleDelay) / 1000}s</span>
              </div>
              <p className="text-xs text-muted-foreground">Tempo de espera entre o envio de cada mensagem para evitar bloqueios.</p>
            </div>

            <div className="space-y-2">
              <Label>Agendar para (opcional)</Label>
              <Input
                type="datetime-local"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Deixe em branco para salvar como rascunho e iniciar manualmente depois.</p>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handleBack} disabled={step === 1 || loading}>
          Voltar
        </Button>
        {step < 4 ? (
          <Button onClick={handleNext}>Próximo</Button>
        ) : (
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Criando..." : "Criar Campanha"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
