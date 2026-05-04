import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ContactsLoading() {
  return (
    <div className="space-y-6 animate-in-fade">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>

      <div className="flex gap-3 items-center">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-7 w-20 rounded-full" />
        <Skeleton className="h-7 w-24 rounded-full" />
        <Skeleton className="h-7 w-20 rounded-full" />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="border-b border-border px-4 py-3 grid grid-cols-6 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-3 w-20" />
            ))}
          </div>
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="border-b border-border last:border-b-0 px-4 py-4 grid grid-cols-6 gap-4 items-center"
            >
              <Skeleton className="h-4 w-32" />
              <div className="space-y-1">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-6 ml-auto rounded" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
