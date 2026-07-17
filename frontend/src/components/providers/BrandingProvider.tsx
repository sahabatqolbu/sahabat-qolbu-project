"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  Suspense,
} from "react";
import { useSearchParams } from "next/navigation";

export interface BrandingData {
  companyName: string;
  tagline: string;
  logo: string;
  address: string;
  whatsapp: string;
  whatsappNumber: string;
  phone: string;
  email: string;
  instagram: string;
  facebook: string;
  youtube: string;
  tiktok: string;
  isAgentActive: boolean;
  agentSlug: string;
  logoTextSahabat: string;
  logoTextQolbu: string;
  logoLink: string;
  isLoading: boolean;
}

const defaultBranding: BrandingData = {
  companyName: "Sahabat Qolbu",
  tagline: "Cahaya Baitullah",
  logo: "/landing/images/icon.png",
  address:
    "Ruko Jl. Ebony, Metland Transyogi No.11, Kec. Cileungsi, Kab. Bogor, Jawa Barat 16820",
  whatsapp: "https://wa.me/6281255871984",
  whatsappNumber: "6281255871984",
  phone: "0812-5587-1984",
  email: "Sahabatqolbucahayabaitullah@gmail.com",
  instagram: "https://www.instagram.com/sahabatqolbu.ofc/",
  facebook: "https://www.facebook.com/sahabatqolbu.ofc",
  youtube: "",
  tiktok: "",
  isAgentActive: false,
  agentSlug: "",
  logoTextSahabat: "Sahabat",
  logoTextQolbu: "Qolbu",
  logoLink: "/",
  isLoading: true,
};

const BrandingContext = createContext<BrandingData>(defaultBranding);

export const useBranding = () => useContext(BrandingContext);

const getApiBaseUrl = () => {
  if (process.env.NODE_ENV === "production") {
    return "https://api.sahabatqolbu.com/api";
  }

  return (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(
    /\/+$/,
    "",
  );
};

const toAbsoluteUrl = (path?: string | null) => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const origin = getApiBaseUrl().replace(/\/api(?:\/.*)?$/, "");
  if (path.charAt(0) === "/") return origin + path;
  return origin + "/" + path;
};

const normalizeWaNumber = (raw?: string | null) => {
  if (!raw) return "";
  const digits = String(raw).replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("0")) return "62" + digits.slice(1);
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("8")) return "62" + digits;
  return digits;
};

function BrandingInnerProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const agentSlug = searchParams.get("agent") || "";
  const [branding, setBranding] = useState<BrandingData>(defaultBranding);

  useEffect(() => {
    let active = true;
    const apiBase = getApiBaseUrl();

    async function loadBranding() {
      try {
        // Fetch company profile
        const companyRes = await fetch(`${apiBase}/public/company-profile`, {
          headers: { Accept: "application/json" },
        });
        const companyPayload = companyRes.ok ? await companyRes.json() : null;
        const company = companyPayload?.data || {};

        const current = { ...defaultBranding };

        if (company.companyName) current.companyName = company.companyName;
        if (company.tagline) current.tagline = company.tagline;
        if (company.logo) current.logo = toAbsoluteUrl(company.logo);

        // Address formulation
        const addrParts = [];
        if (company.address) addrParts.push(company.address);
        const cityLine = [company.city, company.province]
          .filter(Boolean)
          .join(", ");
        if (cityLine) addrParts.push(cityLine);
        if (company.postalCode) addrParts.push(company.postalCode);
        if (addrParts.length > 0) {
          current.address = addrParts.join(", ");
        }

        if (company.phone) current.phone = company.phone;
        if (company.whatsapp) {
          const digits = normalizeWaNumber(company.whatsapp);
          current.whatsappNumber = digits;
          current.whatsapp = `https://wa.me/${digits}`;
        }
        if (company.email) current.email = company.email;
        if (company.instagram) current.instagram = company.instagram;
        if (company.facebook) current.facebook = company.facebook;
        if (company.youtube) current.youtube = company.youtube;
        if (company.tiktok) current.tiktok = company.tiktok;

        // If agent slug is provided, load agent details
        if (agentSlug) {
          const agentRes = await fetch(
            `${apiBase}/public/agents/${encodeURIComponent(agentSlug)}`,
            {
              headers: { Accept: "application/json" },
            },
          );
          if (agentRes.ok) {
            const agentPayload = await agentRes.json();
            const agentData = agentPayload?.data;
            if (agentData) {
              const { agent, cta, socials } = agentData;

              current.isAgentActive = true;
              current.agentSlug = agentSlug;
              current.logoTextSahabat = "Mitra Sahabat";
              current.logoTextQolbu = "Qolbu";
              current.logoLink = `/${encodeURIComponent(agentSlug)}`;

              if (agent.landingLogo) {
                current.logo = toAbsoluteUrl(agent.landingLogo);
              }

              if (cta?.whatsapp) {
                const digits = normalizeWaNumber(cta.whatsapp);
                current.whatsappNumber = digits;
                current.whatsapp = `https://wa.me/${digits}`;
              }
              if (cta?.email) {
                current.email = cta.email.replace(/^mailto:/, "");
              }

              const normalizeSocial = (urlOrHandle: string, base: string) => {
                if (!urlOrHandle) return "";
                const val = String(urlOrHandle).trim();
                if (!val) return "";
                if (val.startsWith("http://") || val.startsWith("https://"))
                  return val;
                return base + (val.startsWith("@") ? val.slice(1) : val);
              };

              if (socials?.instagram) {
                current.instagram = normalizeSocial(
                  socials.instagram,
                  "https://instagram.com/",
                );
              }
              if (socials?.facebook) {
                current.facebook = normalizeSocial(
                  socials.facebook,
                  "https://facebook.com/",
                );
              }
              if (socials?.youtube) {
                current.youtube = normalizeSocial(
                  socials.youtube,
                  "https://youtube.com/@",
                );
              }
              if (socials?.tiktok) {
                current.tiktok = normalizeSocial(
                  socials.tiktok,
                  "https://tiktok.com/@",
                );
              }

              // Apply theme color overriding
              const mainColor = agent.landingPrimaryColor || "#0A2C45";
              const accentColor = agent.landingAccentColor || "#FFC107";

              const hexToRgb = (hex: string) => {
                const raw = String(hex).trim().replace(/^#/, "");
                if (raw.length === 3) {
                  return {
                    r: parseInt(raw[0] + raw[0], 16),
                    g: parseInt(raw[1] + raw[1], 16),
                    b: parseInt(raw[2] + raw[2], 16),
                  };
                }
                if (raw.length === 6) {
                  return {
                    r: parseInt(raw.slice(0, 2), 16),
                    g: parseInt(raw.slice(2, 4), 16),
                    b: parseInt(raw.slice(4, 6), 16),
                  };
                }
                return null;
              };

              const mainRgb = hexToRgb(mainColor);
              const overlayStart = mainRgb
                ? `rgba(${mainRgb.r},${mainRgb.g},${mainRgb.b},0.9)`
                : "rgba(10,44,69,0.9)";
              const overlayEnd = mainRgb
                ? `rgba(${mainRgb.r},${mainRgb.g},${mainRgb.b},0.7)`
                : "rgba(10,44,69,0.7)";

              const styleId = "agent-theme-override";
              let styleNode = document.getElementById(styleId);
              if (styleNode) styleNode.remove();

              styleNode = document.createElement("style");
              styleNode.id = styleId;
              styleNode.textContent = `
                .text-gold { color: ${accentColor} !important; }
                .gold-gradient { background: ${accentColor} !important; }
                .bg-gold { background-color: ${accentColor} !important; }
                .hover\\:bg-gold:hover { background-color: ${accentColor} !important; }
                .hover\\:text-gold:hover { color: ${accentColor} !important; }
                .bg-primary { background-color: ${mainColor} !important; }
                .text-primary { color: ${mainColor} !important; }
                .border-primary { border-color: ${mainColor} !important; }
                .text-secondary { color: ${mainColor} !important; }
                .bg-secondary { background-color: ${mainColor} !important; }
                .from-primary { --tw-gradient-from: ${mainColor} var(--tw-gradient-from-position) !important; }
                .to-primary-600 { --tw-gradient-to: ${mainColor} var(--tw-gradient-to-position) !important; }
                .from-secondary { --tw-gradient-from: ${accentColor} var(--tw-gradient-from-position) !important; }
                .to-secondary-400 { --tw-gradient-to: ${accentColor} var(--tw-gradient-to-position) !important; }
                .gradient-overlay { background: linear-gradient(135deg, ${overlayStart} 0%, ${overlayEnd} 100%) !important; }
                #header.bg-primary { background-color: ${mainColor} !important; }
              `;
              document.head.appendChild(styleNode);
            }
          }
        } else {
          // Remove custom style override if no agent
          const styleId = "agent-theme-override";
          const styleNode = document.getElementById(styleId);
          if (styleNode) styleNode.remove();
        }

        if (active) {
          setBranding({ ...current, isLoading: false });
        }
      } catch (err) {
        console.error("Failed to load branding", err);
        if (active) {
          setBranding((prev) => ({ ...prev, isLoading: false }));
        }
      }
    }

    loadBranding();

    return () => {
      active = false;
    };
  }, [agentSlug]);

  return (
    <BrandingContext.Provider value={branding}>
      {children}
    </BrandingContext.Provider>
  );
}

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<>{children}</>}>
      <BrandingInnerProvider>{children}</BrandingInnerProvider>
    </Suspense>
  );
}

