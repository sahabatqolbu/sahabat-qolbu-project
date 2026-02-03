import { Loader2 } from "lucide-react";

export default function RootLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="mb-4">
          <span className="text-5xl">🕌</span>
        </div>
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
        <p className="text-gray-600 text-sm">Memuat...</p>
      </div>
    </div>
  );
}
