import Nav from '@/components/Nav';

interface Props {
  variant: 'home' | 'settings';
}

export default function PageLoadingSkeleton({ variant }: Props) {
  return (
    <>
      <Nav />
      {variant === 'home' ? <HomeSkeleton /> : <SettingsSkeleton />}
    </>
  );
}

function HomeSkeleton() {
  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8">
      {/* Page header */}
      <div className="mb-7">
        <div className="h-8 w-72 bg-bg-card rounded-lg animate-pulse mb-2" />
        <div className="h-4 w-52 bg-bg-card rounded animate-pulse" />
      </div>

      {/* Friend selector shimmer */}
      <div className="bg-bg-card border border-border-subtle rounded-2xl px-5 py-4 mb-3 animate-pulse">
        <div className="h-3 w-16 bg-bg-card-hover rounded mb-3" />
        <div className="flex gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="w-[60px] h-[60px] rounded-full bg-bg-card-hover" />
              <div className="h-2.5 w-10 bg-bg-card-hover rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Lists selector shimmer */}
      <div className="bg-bg-card border border-border-subtle rounded-2xl px-5 py-4 mb-5 animate-pulse">
        <div className="h-3 w-10 bg-bg-card-hover rounded mb-3" />
        <div className="flex gap-2">
          <div className="h-8 w-36 bg-bg-card-hover rounded-full" />
        </div>
      </div>

      {/* Empty state prompt */}
      <div className="text-center py-[60px] text-text-tertiary text-sm">
        Select a friend or list to get started.
      </div>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="max-w-[600px] mx-auto px-4 py-10">
      {/* Page title */}
      <div className="h-8 w-28 bg-bg-card rounded-lg animate-pulse mx-auto mb-9" />

      {/* Add a person panel */}
      <div className="bg-bg-card border border-border-subtle rounded-2xl p-6 mb-6 animate-pulse">
        <div className="h-5 w-32 bg-bg-card-hover rounded mb-2" />
        <div className="h-3 w-full bg-bg-card-hover rounded mb-1" />
        <div className="h-3 w-3/4 bg-bg-card-hover rounded mb-5" />
        <div className="h-11 w-full bg-bg-card-hover rounded-lg mb-3" />
        <div className="h-10 w-24 bg-bg-card-hover rounded-lg" />
      </div>

      {/* Entity card rows */}
      <div className="flex flex-col gap-2 mb-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-bg-card border border-border-subtle rounded-2xl p-4 animate-pulse flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-bg-card-hover shrink-0" />
            <div className="flex-1">
              <div className="h-4 w-32 bg-bg-card-hover rounded mb-2" />
              <div className="h-3 w-48 bg-bg-card-hover rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Import a list panel */}
      <div className="bg-bg-card border border-border-subtle rounded-2xl p-6 mb-6 animate-pulse">
        <div className="h-5 w-28 bg-bg-card-hover rounded mb-2" />
        <div className="h-3 w-full bg-bg-card-hover rounded mb-1" />
        <div className="h-3 w-2/3 bg-bg-card-hover rounded mb-5" />
        <div className="h-11 w-full bg-bg-card-hover rounded-lg mb-3" />
        <div className="h-10 w-24 bg-bg-card-hover rounded-lg" />
      </div>
    </div>
  );
}
