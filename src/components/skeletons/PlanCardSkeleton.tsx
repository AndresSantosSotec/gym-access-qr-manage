import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function PlanCardSkeleton() {
  return (
    <Card className="relative">
      <CardHeader className="pb-4">
        <Skeleton className="h-9 w-3/4 mb-2" />
        <Skeleton className="h-5 w-full" />
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="pb-6 border-b">
          <Skeleton className="h-12 w-32 mb-2" />
          <Skeleton className="h-4 w-40 mt-2" />
          <Skeleton className="h-3 w-24 mt-2" />
        </div>

        <div>
          <Skeleton className="h-5 w-20 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-5 w-5 rounded-full flex-shrink-0" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        </div>

        <div className="pt-6 space-y-3">
          <Skeleton className="h-11 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}

export function PlansGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
      {Array.from({ length: count }).map((_, i) => (
        <PlanCardSkeleton key={i} />
      ))}
    </div>
  );
}
