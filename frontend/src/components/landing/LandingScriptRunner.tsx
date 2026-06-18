"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    SQ_RENDER_PACKAGES?: () => void | Promise<void>;
  }
}

const scripts = [
  "/landing/js/packages-data.js",
  "/landing/js/packages-renderer.js",
  "/landing/js/company-sync.js",
];

const loadScript = (src: string) =>
  new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[data-landing-script="${src}"]`,
    );

    if (existing) {
      if (existing.dataset.loaded === "true") {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.dataset.landingScript = src;
    script.async = false;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(script);
  });

export default function LandingScriptRunner() {
  useEffect(() => {
    let cancelled = false;

    async function run() {
      for (const script of scripts) {
        await loadScript(script);
      }

      if (!cancelled) {
        await window.SQ_RENDER_PACKAGES?.();
      }
    }

    run().catch(() => {
      // Keep static HTML visible if optional package scripts fail.
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
