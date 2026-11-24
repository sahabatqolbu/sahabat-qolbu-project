"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, MessageCircle } from "lucide-react";
import { authService } from "@/services/authService";
import { useAuthStore } from "@/stores/authStore";

const ADMIN_WHATSAPP = "6281240000101";

export default function DataLinkPage() {
  const params = useParams<{ token: string }>();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const token = String(params?.token || "");
    // Drop the token from the address bar and history as soon as we have it.
    window.history.replaceState(null, "", "/isi-data/-");
    authService
      .exchangeDataLink(token)
      .then((data) => {
        const user = data?.data?.user;
        if (!user) throw new Error("no user");
        setAuth(user);
        window.location.assign("/jamaah/onboarding");
      })
      .catch((err) => {
        const message = err?.response?.data?.message;
        setError(message || "Link tidak bisa dibuka. Minta link baru ke admin Sahabat Qolbu.");
      });
  }, [params, setAuth]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm">
        <img src="/images/icon.png" alt="Sahabat Qolbu" className="mx-auto h-12 w-12 object-contain" />
        {error ? (
          <>
            <h1 className="mt-4 text-lg font-semibold text-gray-900">Link tidak berlaku</h1>
            <p className="mt-2 text-sm text-gray-600">{error}</p>
            <a
              href={`https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent("Assalamu'alaikum admin, link pengisian data jamaah saya tidak bisa dibuka. Mohon dikirim link baru.")}`}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90"
            >
              <MessageCircle className="h-4 w-4" /> Minta link baru via WhatsApp
            </a>
          </>
        ) : (
          <>
            <Loader2 className="mx-auto mt-4 h-6 w-6 animate-spin text-primary" />
            <h1 className="mt-3 text-lg font-semibold text-gray-900">Membuka formulir data jamaah</h1>
            <p className="mt-1 text-sm text-gray-600">Mohon tunggu sebentar.</p>
          </>
        )}
      </div>
    </main>
  );
}
