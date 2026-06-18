"use client";

import { useEffect } from "react";

const companySyncScript = "/landing/js/company-sync.js";

export default function CompanySyncRunner() {
  useEffect(() => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[data-company-sync-script="${companySyncScript}"]`,
    );

    if (existing) {
      existing.remove();
    }

    const script = document.createElement("script");
    script.src = companySyncScript;
    script.dataset.companySyncScript = companySyncScript;
    script.async = true;
    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  return null;
}
