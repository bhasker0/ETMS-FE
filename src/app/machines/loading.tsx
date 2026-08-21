export default function Loading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 p-4 sm:p-6">
      <div className="h-12 w-full rounded-xl bg-slate-200 animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-32 rounded-xl bg-slate-200 animate-pulse" />
        ))}
      </div>
    </div>
  );
}
