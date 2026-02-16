import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function HomePlanCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <Skeleton className="h-8 w-3/4 mb-2" />
        <Skeleton className="h-4 w-full" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Skeleton className="h-10 w-28 mb-1" />
          <Skeleton className="h-3 w-20 mt-2" />
        </div>

        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded-full flex-shrink-0" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </div>

        <Skeleton className="h-10 w-full rounded-md" />
      </CardContent>
    </Card>
  );
}

export function HomePlansGridSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-3 max-w-6xl mx-auto">
      {[1, 2, 3].map((i) => (
        <HomePlanCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="relative h-[600px] bg-muted">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="container mx-auto px-4 text-center">
          <Skeleton className="h-16 md:h-20 w-80 mx-auto mb-6" />
          <Skeleton className="h-10 md:h-12 w-96 mx-auto mb-8" />
          <div className="flex flex-wrap gap-4 justify-center">
            <Skeleton className="h-12 w-40 rounded-md" />
            <Skeleton className="h-12 w-32 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function BlogCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="w-full h-48" />
      <CardHeader>
        <Skeleton className="h-6 w-full mb-2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-10 w-full rounded-md" />
      </CardContent>
    </Card>
  );
}

export function BlogGridSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-3 max-w-6xl mx-auto">
      {[1, 2, 3].map((i) => (
        <BlogCardSkeleton key={i} />
      ))}
    </div>
  );
}
