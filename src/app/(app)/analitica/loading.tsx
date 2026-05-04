import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AnalyticsLoading() {
  return (
    <div className="space-y-8 animate-in-fade">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-96" />
      </div>

      {Array.from({ length: 3 }).map((_, s) => (
        <section key={s} className="space-y-3">
          <div className="flex items-start gap-3">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-3 w-72" />
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="space-y-2">
                <Skeleton className="h-4 w-44" />
                <Skeleton className="h-3 w-64" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-56 w-full" />
              </CardContent>
            </Card>
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="pt-5 space-y-2">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-7 w-24" />
                    <Skeleton className="h-3 w-40" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
