import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import PromotionalPopup from "@/components/marketing/PromotionalPopup";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="landing-static">
      <PromotionalPopup />
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
