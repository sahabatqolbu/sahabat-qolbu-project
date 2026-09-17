"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Root error caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-950">
      <Card className="max-w-md w-full shadow-lg border-red-100 dark:border-red-900/30">
        <CardHeader className="text-center pb-2">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Terjadi Kesalahan Aplikasi
          </CardTitle>
          <CardDescription className="text-gray-500 mt-1">
            Aplikasi mengalami kendala saat memproses halaman ini.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3 pt-2">
          <div className="p-3 bg-gray-100 dark:bg-gray-900 rounded text-xs font-mono text-gray-700 dark:text-gray-300">
            {error.message || "Unknown error occurred"}
          </div>
        </CardContent>

        <CardFooter className="flex gap-2 pt-2">
          <Button
            variant="outline"
            className="flex-1 gap-1.5"
            onClick={() => reset()}
          >
            <RefreshCw className="h-4 w-4" />
            Muat Ulang
          </Button>

          <Button
            className="flex-1 gap-1.5 bg-primary hover:bg-primary/90"
            onClick={() => {
              window.location.href = "/admin";
            }}
          >
            <Home className="h-4 w-4" />
            Ke Beranda
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
