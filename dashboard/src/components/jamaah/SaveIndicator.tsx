// dashboard/src/components/jamaah/SaveIndicator.tsx
"use client";

import { Cloud, CloudOff, Check, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

interface SaveIndicatorProps {
  status: "idle" | "saving" | "saved" | "error";
  lastSaved: Date | null;
}

export function SaveIndicator({ status, lastSaved }: SaveIndicatorProps) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {status === "saving" && (
        <>
          <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
          <span className="text-blue-600">Menyimpan...</span>
        </>
      )}

      {status === "saved" && (
        <>
          <Check className="h-3 w-3 text-green-500" />
          <span className="text-green-600">Tersimpan</span>
        </>
      )}

      {status === "error" && (
        <>
          <CloudOff className="h-3 w-3 text-red-500" />
          <span className="text-red-600">Gagal menyimpan</span>
        </>
      )}

      {status === "idle" && lastSaved && (
        <>
          <Cloud className="h-3 w-3 text-gray-400" />
          <span className="text-gray-500">
            Disimpan{" "}
            {formatDistanceToNow(lastSaved, {
              addSuffix: true,
              locale: id,
            })}
          </span>
        </>
      )}
    </div>
  );
}
