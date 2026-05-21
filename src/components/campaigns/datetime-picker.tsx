"use client";

import { useState } from "react";
import { format, addMinutes, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DateTimePickerProps {
  value?: Date | null;
  onChange: (date: Date | null) => void;
  label?: string;
  minDate?: Date;
}

export function DateTimePicker({
  value,
  onChange,
  label = "Data e hora",
  minDate,
}: DateTimePickerProps) {
  const now = minDate ?? new Date();
  const minDateStr = format(addMinutes(now, 1), "yyyy-MM-dd'T'HH:mm");

  const [isPast, setIsPast] = useState(false);

  const valueStr = value ? format(value, "yyyy-MM-dd'T'HH:mm") : "";

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    if (!raw) {
      onChange(null);
      setIsPast(false);
      return;
    }
    const parsed = new Date(raw);
    const past = isBefore(parsed, new Date());
    setIsPast(past);
    onChange(parsed);
  }

  return (
    <div className="space-y-1">
      <Label htmlFor="datetime-picker">{label}</Label>
      <Input
        id="datetime-picker"
        type="datetime-local"
        value={valueStr}
        min={minDateStr}
        onChange={handleChange}
        className="w-full"
      />
      {isPast && (
        <p className="text-sm text-amber-600">
          ⚠️ Horário passado — a campanha será disparada imediatamente ao confirmar.
        </p>
      )}
      {value && !isPast && (
        <p className="text-xs text-muted-foreground">
          Agendado para{" "}
          {format(value, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
        </p>
      )}
    </div>
  );
}
