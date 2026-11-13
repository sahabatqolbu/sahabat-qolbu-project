import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-primary-900">
      <div className="text-center text-white">
        <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
        <p className="text-lg">Memverifikasi...</p>
      </div>
    </div>
  );
}
