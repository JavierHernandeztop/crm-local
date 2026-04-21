export const dynamic = "force-dynamic";

import { Settings2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { listContactsByStage, listStages } from "@/lib/queries";
import { KanbanBoard } from "@/components/kanban-board";
import { ContactFormDialog } from "@/components/contact-form-dialog";

export default function PipelinePage() {
  const stages = listStages();
  const contactsMap = listContactsByStage();
  const contactsByStage = stages.map((s) => ({
    stage: s,
    contacts: contactsMap.get(s.id) ?? [],
  }));

  return (
    <div className="space-y-4 animate-in-fade">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Pipeline
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Arrastra los contactos entre etapas para avanzar tu proceso.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/ajustes#etapas">
              <Settings2 className="h-4 w-4" /> Configurar etapas
            </Link>
          </Button>
          <ContactFormDialog stages={stages} />
        </div>
      </div>

      {stages.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl py-16 text-center">
          <p className="text-muted-foreground mb-4">
            Aún no has configurado etapas de tu pipeline.
          </p>
          <Button asChild>
            <Link href="/ajustes#etapas">Configurar etapas</Link>
          </Button>
        </div>
      ) : (
        <KanbanBoard stages={stages} contactsByStage={contactsByStage} />
      )}
    </div>
  );
}
