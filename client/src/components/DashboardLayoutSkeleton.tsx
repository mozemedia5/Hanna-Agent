import { Skeleton } from "./ui/skeleton";

export function DashboardLayoutSkeleton() {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar skeleton */}
      <div className="w-[280px] border-r border-border/50 bg-card/40 p-4 space-y-6 flex-shrink-0 hidden md:flex md:flex-col justify-between">
        <div className="space-y-6">
          {/* Logo area */}
          <div className="flex items-center gap-3 px-2">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-4 w-28 rounded" />
          </div>

          {/* Menu items */}
          <div className="space-y-2.5 px-1 pt-2">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>

        {/* User profile area at bottom */}
        <div className="px-2 pb-2">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-20 rounded" />
              <Skeleton className="h-2 w-32 rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="flex-1 flex flex-col justify-between p-6 max-w-5xl mx-auto w-full">
        {/* Top header bar */}
        <div className="flex items-center justify-between pb-6">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-lg md:hidden" />
            <Skeleton className="h-7 w-40 rounded-lg" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-20 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>

        {/* Center greeting / Skeleton bars */}
        <div className="my-auto space-y-8 max-w-3xl w-full mx-auto">
          <div className="space-y-3">
            <Skeleton className="h-10 w-2/3 rounded-xl bg-gradient-to-r from-muted via-muted/60 to-muted" />
            <Skeleton className="h-6 w-1/2 rounded-lg" />
          </div>

          {/* Suggestion card skeletons */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="p-4 rounded-2xl border border-border/40 bg-card/20 space-y-3">
              <Skeleton className="h-6 w-6 rounded-md" />
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-3 w-4/5 rounded" />
            </div>
            <div className="p-4 rounded-2xl border border-border/40 bg-card/20 space-y-3">
              <Skeleton className="h-6 w-6 rounded-md" />
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-3 w-3/4 rounded" />
            </div>
            <div className="p-4 rounded-2xl border border-border/40 bg-card/20 space-y-3">
              <Skeleton className="h-6 w-6 rounded-md" />
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-3 w-5/6 rounded" />
            </div>
          </div>
        </div>

        {/* Input Composer skeleton */}
        <div className="max-w-3xl w-full mx-auto pt-6 space-y-3">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <div className="flex justify-between items-center px-2">
            <Skeleton className="h-3.5 w-40 rounded" />
            <Skeleton className="h-3.5 w-24 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
