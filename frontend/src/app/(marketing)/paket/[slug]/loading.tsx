import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary via-primary to-primary-700">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary shadow-2xl shadow-secondary/30">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <div>
          <p className="font-display text-lg font-black text-secondary">
            Memuat Detail Paket
          </p>
          <p className="mt-1 text-sm font-medium text-white/70">
            Mohon tunggu sebentar…
          </p>
        </div>
      </div>
    </div>
  );
}