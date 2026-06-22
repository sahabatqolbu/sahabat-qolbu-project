"use client";

import { useEffect } from "react";
import { getDashboardUrl } from "@/lib/dashboard-url";

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

type LandingUser = {
  fullName?: string;
  role?: string;
};

const getApiBaseUrl = () =>
  (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(
    /\/+$/,
    "",
  );

const parseStoredUser = (): LandingUser | null => {
  try {
    const stored = window.localStorage.getItem("user_data");
    return stored ? (JSON.parse(stored) as LandingUser) : null;
  } catch {
    window.localStorage.removeItem("user_data");
    return null;
  }
};

const setAccountState = (user: LandingUser | null) => {
  const dashboardUrl = getDashboardUrl(user?.role);
  const guestElements = document.querySelectorAll<HTMLElement>("[data-auth-guest]");
  const userElements = document.querySelectorAll<HTMLAnchorElement>("[data-auth-user]");
  const dashboardLinks = document.querySelectorAll<HTMLAnchorElement>(
    "[data-auth-dashboard-link]",
  );

  dashboardLinks.forEach((link) => {
    link.href = dashboardUrl;
  });

  if (user) {
    guestElements.forEach((element) => {
      element.hidden = true;
    });
    userElements.forEach((element) => {
      element.hidden = false;
    });
    return;
  }

  guestElements.forEach((element) => {
    element.hidden = false;
  });
  userElements.forEach((element) => {
    element.hidden = true;
  });
};

const syncAccountState = async () => {
  const storedUser = parseStoredUser();
  setAccountState(storedUser);

  try {
    const response = await fetch(`${getApiBaseUrl()}/auth/me`, {
      credentials: "include",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      window.localStorage.removeItem("user_data");
      setAccountState(null);
      return;
    }

    const payload = await response.json();
    const user = payload?.data as LandingUser | undefined;

    if (user) {
      window.localStorage.setItem("user_data", JSON.stringify(user));
      setAccountState(user);
      return;
    }

    setAccountState(null);
  } catch {
    // Keep the local state if the API cannot be reached from this page.
  }
};

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
      await syncAccountState();

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
