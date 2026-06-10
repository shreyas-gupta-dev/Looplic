export function CatalogPageLoading() {
  return (
    <main className="flex-1">
      <div className="container py-6">
        <div className="mb-5 h-4 w-40 rounded-full bg-secondary/80" />
        <div className="mb-6 space-y-3">
          <div className="h-10 w-72 max-w-full rounded-2xl bg-secondary/80" />
          <div className="h-4 w-[32rem] max-w-full rounded-full bg-secondary/60" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-border bg-card p-4 shadow-card-brand">
              <div className="mx-auto size-14 rounded-2xl bg-secondary/80" />
              <div className="mx-auto mt-3 h-4 w-24 rounded-full bg-secondary/70" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
