import { Loader2 } from 'lucide-react';

export default function RootLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <Loader2 className="h-10 w-10 animate-spin text-amber-600" />
      <p className="text-slate-600 font-medium">લોડ થઈ રહ્યું છે... / Loading...</p>
    </div>
  );
}
