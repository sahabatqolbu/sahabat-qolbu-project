"use client";

import { useMemo } from "react";

export default function AgentLandingFrame({ namaagen }: { namaagen: string }) {
  const iframeSrc = useMemo(
    () => `/landing/index.html?agent=${encodeURIComponent(namaagen)}`,
    [namaagen],
  );

  return (
    <iframe
      src={iframeSrc}
      title={`Landing Agen ${namaagen}`}
      loading="lazy"
      sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
      referrerPolicy="strict-origin-when-cross-origin"
      className="h-screen w-full border-0"
    />
  );
}
