"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Upload, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { removeLogo, uploadLogo } from "@/lib/actions/logo";

export function LogoUpload({
  logoPath,
  businessName,
}: {
  logoPath: string | null;
  businessName: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [preview, setPreview] = useState<string | null>(logoPath);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPreview(String(reader.result));
    reader.readAsDataURL(file);
    const fd = new FormData();
    fd.set("logo", file);
    startTransition(async () => {
      try {
        await uploadLogo(fd);
        toast.success("Logo actualizado");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error");
        setPreview(logoPath);
      }
    });
    e.target.value = "";
  };

  const onRemove = () => {
    startTransition(async () => {
      await removeLogo();
      setPreview(null);
      toast.success("Logo eliminado");
      router.refresh();
    });
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-16 w-16 rounded-xl border border-border bg-background flex items-center justify-center overflow-hidden shrink-0">
        {preview ? (
          <Image
            src={preview}
            alt="Logo"
            fill
            sizes="64px"
            className="object-contain p-1"
            unoptimized
          />
        ) : (
          <span className="text-2xl font-bold text-primary">
            {businessName.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <div className="space-y-2 min-w-0">
        <div className="text-sm text-muted-foreground">
          PNG, JPG, WEBP o SVG · máximo 2 MB. Se muestra en el sidebar.
        </div>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
            onChange={onChange}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            {preview ? "Cambiar logo" : "Subir logo"}
          </Button>
          {preview && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isPending}
              onClick={onRemove}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4" /> Quitar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
