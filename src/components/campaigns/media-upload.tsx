"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const MAX_SIZE = 16 * 1024 * 1024;

interface MediaUploadProps {
  onFileSelected: (file: File | null) => void;
}

export function MediaUpload({ onFileSelected }: MediaUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) {
      handleRemove();
      return;
    }

    if (selected.size > MAX_SIZE) {
      setError("O arquivo não pode ter mais de 16MB.");
      handleRemove();
      return;
    }

    setError(null);
    setFile(selected);
    onFileSelected(selected);

    if (selected.type.startsWith("image/") || selected.type.startsWith("video/")) {
      const url = URL.createObjectURL(selected);
      setPreview(url);
    } else {
      setPreview(null);
    }
  };

  const handleRemove = () => {
    setFile(null);
    setError(null);
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
    onFileSelected(null);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Mídia (Opcional)</Label>
        {!file ? (
          <Input
            type="file"
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
            onChange={handleFileChange}
          />
        ) : (
          <div className="space-y-4 rounded-md border p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{file.name}</span>
              <Button type="button" variant="destructive" size="sm" onClick={handleRemove}>
                Remover
              </Button>
            </div>
            
            {preview && file.type.startsWith("image/") && (
              <>
                <Image src={preview} alt="Preview" width={400} height={192} unoptimized className="max-h-48 rounded-md object-contain" />
              </>
            )}
            
            {preview && file.type.startsWith("video/") && (
              <video src={preview} controls className="max-h-48 rounded-md" />
            )}
            
            {!preview && (
              <p className="text-sm text-muted-foreground">
                Tamanho: {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            )}
          </div>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
