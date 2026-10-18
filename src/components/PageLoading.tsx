export function PageLoading() {
  return (
    <div className="animate-pulse space-y-5" aria-busy="true" aria-label="Yuklanmoqda">
      <div className="h-9 w-64 rounded-2xl bg-ink/10" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 rounded-[1.75rem] bg-white/70" />)}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="h-72 rounded-[1.75rem] bg-white/70" />
        <div className="h-72 rounded-[1.75rem] bg-white/70" />
      </div>
    </div>
  );
}
