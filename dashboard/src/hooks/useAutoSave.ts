// dashboard/src/hooks/useAutoSave.ts
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface UseAutoSaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<any>;
  debounceMs?: number;
  enabled?: boolean;
}

export function useAutoSave<T>({
  data,
  onSave,
  debounceMs = 2000,
  enabled = true,
}: UseAutoSaveOptions<T>) {
  const { toast } = useToast();
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousDataRef = useRef<string>("");

  // Mutation untuk save
  const saveMutation = useMutation({
    mutationFn: onSave,
    onMutate: () => {
      setSaveStatus("saving");
    },
    onSuccess: () => {
      setSaveStatus("saved");
      setLastSaved(new Date());
      // Reset to idle after 3 seconds
      setTimeout(() => setSaveStatus("idle"), 3000);
    },
    onError: (error: any) => {
      setSaveStatus("error");
      console.error("Auto-save error:", error);
      toast({
        variant: "destructive",
        title: "Gagal menyimpan",
        description: "Perubahan gagal disimpan. Coba lagi.",
      });
    },
  });

  // Manual save function
  const saveNow = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    saveMutation.mutate(data);
  }, [data, saveMutation]);

  // Auto-save dengan debounce
  useEffect(() => {
    if (!enabled) return;

    const currentData = JSON.stringify(data);

    // Skip jika data tidak berubah
    if (currentData === previousDataRef.current) return;

    // Clear timeout sebelumnya
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set status ke "akan menyimpan"
    setSaveStatus("idle");

    // Debounce save
    timeoutRef.current = setTimeout(() => {
      previousDataRef.current = currentData;
      saveMutation.mutate(data);
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, debounceMs, enabled, saveMutation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    saveStatus,
    lastSaved,
    saveNow,
    isSaving: saveMutation.isPending,
  };
}
