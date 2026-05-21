"use client";

import { interpolateTemplate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface TemplateEditorProps {
  value: string;
  onChange: (value: string) => void;
  variables?: string[];
}

export function TemplateEditor({ value, onChange, variables = [] }: TemplateEditorProps) {
  const allVariables = ["nome", "empresa", ...variables.filter(v => v !== "nome" && v !== "empresa")];

  const handleInsertVariable = (variable: string) => {
    const varString = `{${variable}}`;
    onChange(value + varString);
  };

  const previewVars = allVariables.reduce((acc, curr) => {
    if (curr === "nome") acc[curr] = "Pedro";
    else if (curr === "empresa") acc[curr] = "Acme";
    else acc[curr] = `[${curr}]`;
    return acc;
  }, {} as Record<string, string>);

  const previewText = interpolateTemplate(value, previewVars);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Mensagem</Label>
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Escreva sua mensagem aqui. Use variáveis como {nome}."
          className="min-h-[150px]"
        />
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{value.length} / 4096 caracteres</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Inserir Variáveis</Label>
        <div className="flex flex-wrap gap-2">
          {allVariables.map((variable) => (
            <Button
              key={variable}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleInsertVariable(variable)}
            >
              {`{${variable}}`}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2 rounded-md border bg-muted p-4">
        <Label className="text-muted-foreground">Pré-visualização</Label>
        <p className="whitespace-pre-wrap text-sm">{previewText || "Sua mensagem aparecerá aqui..."}</p>
      </div>
    </div>
  );
}
