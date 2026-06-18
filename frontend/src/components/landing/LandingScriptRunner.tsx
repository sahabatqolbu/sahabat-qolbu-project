"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    SQ_RENDER_PACKAGES?: () => void | Promise<void>;
    __sqLandingHeaderScrollHandler?: () => void;
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
    const mobileMenuBtn = document.getElementById("mobileMenuBtn");
    const mobileMenu = document.getElementById("mobileMenu");
    const header = document.getElementById("header");

    if (mobileMenuBtn && mobileMenu && !mobileMenuBtn.dataset.bound) {
      mobileMenuBtn.dataset.bound = "true";
      mobileMenuBtn.addEventListener("click", () => {
        const isOpen = !mobileMenu.classList.contains("hidden");
        mobileMenu.classList.toggle("hidden");
        mobileMenuBtn.setAttribute("aria-expanded", String(!isOpen));
      });

      mobileMenu.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
          mobileMenu.classList.add("hidden");
          mobileMenuBtn.setAttribute("aria-expanded", "false");
        });
      });
    }

    const updateHeader = () => {
      if (!header || !header.classList.contains("fixed")) return;
      if (window.scrollY > 50) {
        header.classList.add("bg-primary", "shadow-lg");
      } else {
        header.classList.remove("bg-primary", "shadow-lg");
      }
    };

    if (window.__sqLandingHeaderScrollHandler) {
      window.removeEventListener("scroll", window.__sqLandingHeaderScrollHandler);
    }
    window.__sqLandingHeaderScrollHandler = updateHeader;
    updateHeader();
    window.addEventListener("scroll", window.__sqLandingHeaderScrollHandler, {
      passive: true,
    });

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
      if (window.__sqLandingHeaderScrollHandler === updateHeader) {
        window.removeEventListener("scroll", updateHeader);
        delete window.__sqLandingHeaderScrollHandler;
      }
    };
  }, []);

  return null;
}
