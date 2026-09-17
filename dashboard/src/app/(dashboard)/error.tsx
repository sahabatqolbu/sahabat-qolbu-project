"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle, ChevronDown, ChevronUp, RefreshCw, Trash2, Home } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Log error to console for diagnostic
    console.error("Dashboard caught an error:", error);
  }, [error]);

  const handleClearDraftAndReload = () => {
    try {
      // Clear package create draft and other dashboard drafts
      sessionStorage.removeItem("sq-admin-package-create-draft-v1");
      sessionStorage.clear();
    } catch {
      // ignore
    }
    window.location.reload();
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <Card className="max-w-lg w-full shadow-lg border-red-100 dark:border-red-900/30">
        <CardHeader className="text-center pb-2">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Halaman Gagal Dimuat
          </CardTitle>
          <CardDescription className="text-gray-500 mt-1">
            Terjadi kendala teknis saat memuat data di halaman ini. Jangan khawatir, data akun Anda tetap aman.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-2">
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-xs text-amber-800 dark:text-amber-300">
            💡 <strong>Tips:</strong> Jika masalah terjadi saat membuat/mengedit paket atau data form, klik tombol <strong>Bersihkan Draft & Reload</strong> untuk mereset cache lokal.
          </div>

          <div>
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-medium"
            >
              {showDetails ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              {showDetails ? "Sembunyikan detail teknis" : "Lihat detail teknis"}
            </button>

            {showDetails && (
              <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-900 rounded text-xs font-mono text-gray-700 dark:text-gray-300 overflow-x-auto max-h-40">
                <p className="font-semibold text-red-600">{error.name}: {error.message}</p>
                {error.digest && <p className="text-gray-400 mt-1">Digest: {error.digest}</p>}
                {error.stack && (
                  <pre className="mt-2 text-[11px] whitespace-pre-wrap opacity-75">{error.stack}</pre>
                )}
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button
            variant="outline"
            className="w-full sm:w-auto flex-1 gap-1.5"
            onClick={() => reset()}
          >
            <RefreshCw className="h-4 w-4" />
            Coba Lagi
          </Button>

          <Button
            variant="outline"
            className="w-full sm:w-auto flex-1 gap-1.5 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-amber-700 dark:text-amber-300"
            onClick={handleClearDraftAndReload}
          >
            <Trash2 className="h-4 w-4" />
            Bersihkan Draft & Reload
          </Button>

          <Button
            className="w-full sm:w-auto gap-1.5 bg-primary hover:bg-primary/90"
            onClick={() => {
              window.location.href = "/admin/packages";
            }}
          >
            <Home className="h-4 w-4" />
            Daftar Paket
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
