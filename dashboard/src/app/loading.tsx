import { Loader2 } from "lucide-react";

export default function RootLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm">
          <img src="/images/icon.png" alt="Sahabat Qolbu" className="h-12 w-12 object-contain" />
        </div>
        <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin text-slate-800" />
        <p className="text-sm text-slate-600">Memuat...</p>
      </div>
    </div>
  );
}