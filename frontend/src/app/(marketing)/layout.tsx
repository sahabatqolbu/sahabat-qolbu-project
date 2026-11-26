import { Amiri, Poppins } from "next/font/google";
import PromotionalPopup from "@/components/marketing/PromotionalPopup";
import { SiteFooter, SiteHeader } from "@/components/sq/chrome";
import "@/components/sq/sq.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

const amiri = Amiri({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-amiri",
  display: "swap",
});

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`sq ${poppins.variable} ${amiri.variable}`}>
      <PromotionalPopup />
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}
