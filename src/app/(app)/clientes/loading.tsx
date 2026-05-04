import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ClientsLoading() {
  return (
    <div className="space-y-6 animate-in-fade">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="border-b border-border px-4 py-3 grid grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-3 w-20" />
            ))}
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="border-b border-border last:border-b-0 px-4 py-4 grid grid-cols-5 gap-4 items-center"
            >
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20 ml-auto" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
