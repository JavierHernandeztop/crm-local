"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { markContacted } from "@/lib/actions/contacts";

export function MarkContactedButton({ contactId }: { contactId: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handle = () => {
    startTransition(async () => {
      await markContacted(contactId);
      toast.success("Marcado como contactado");
      router.refresh();
    });
  };

  return (
    <Button variant="outline" onClick={handle} disabled={isPending}>
      <CheckCircle2 className="h-4 w-4" />
      {isPending ? "Guardando…" : "Marcar contactado"}
    </Button>
  );
}
