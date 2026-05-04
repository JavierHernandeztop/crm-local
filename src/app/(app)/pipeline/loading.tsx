import { Skeleton } from "@/components/ui/skeleton";

export default function PipelineLoading() {
  return (
    <div className="space-y-4 animate-in-fade">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="w-[300px] shrink-0 rounded-xl border border-border bg-muted/30"
          >
            <div className="flex items-center gap-2 p-3 border-b border-border">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-8 rounded-full" />
            </div>
            <div className="p-2 space-y-2">
              {Array.from({ length: 3 }).map((_, j) => (
                <div
                  key={j}
                  className="rounded-lg border border-border bg-card p-3 space-y-2"
                >
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <div className="flex justify-between pt-1">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-8" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
