import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function PlanDetailSkeleton() {
  return (
    <div className="container mx-auto">
      {/* Back button */}
      <Skeleton className="h-10 w-36 mb-6" />
      
      <div className="max-w-4xl mx-auto">
        <div className="grid gap-8 md:grid-cols-2">
          {/* Left column - Title and price card */}
          <div>
            <Skeleton className="h-14 w-3/4 mb-4" />
            <Skeleton className="h-6 w-full mb-2" />
            <Skeleton className="h-6 w-2/3 mb-8" />

            <Card className="bg-gradient-to-br from-muted/50 to-muted/30">
              <CardContent className="p-8">
                <div className="mb-4">
                  <Skeleton className="h-16 w-40 mb-2" />
                  <Skeleton className="h-5 w-44 mt-2" />
                  <Skeleton className="h-4 w-36 mt-2" />
                </div>

                <div className="space-y-3 pt-6">
                  <Skeleton className="h-12 w-full rounded-md" />
                  <Skeleton className="h-12 w-full rounded-md" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column - Features card */}
          <div>
            <Card>
              <CardHeader>
                <Skeleton className="h-7 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Skeleton className="h-6 w-6 rounded-full flex-shrink-0" />
                      <Skeleton className="h-5 flex-1" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <Skeleton className="h-7 w-36" />
              </CardHeader>
              <CardContent className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
