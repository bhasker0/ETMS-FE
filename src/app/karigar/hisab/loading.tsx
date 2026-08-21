export default function Loading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 p-4 sm:p-6">
      <div className="h-12 w-full max-w-xs rounded-xl bg-slate-200 animate-pulse" />
      <div className="flex gap-4">
        <div className="h-10 w-32 rounded-xl bg-slate-200 animate-pulse" />
        <div className="h-10 w-32 rounded-xl bg-slate-200 animate-pulse" />
      </div>
      <div className="h-64 w-full rounded-xl bg-slate-200 animate-pulse" />
    </div>
  );
}
