export default function Loading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 p-4 sm:p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-slate-200 animate-pulse" />
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-14 w-full rounded-xl bg-slate-200 animate-pulse" />
        ))}
      </div>
    </div>
  );
}
