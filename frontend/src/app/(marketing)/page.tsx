import FAQ from "@/components/marketing/FAQ";
import FeaturedPackages from "@/components/marketing/FeaturedPackages";
import Hero from "@/components/marketing/Hero";
import Muthowwif from "@/components/marketing/Muthowwif";
import SearchWidget from "@/components/marketing/SearchWidget";
import Testimonials from "@/components/marketing/Testimonials";
import WhyChooseUs from "@/components/marketing/WhyChooseUs";

export default function HomePage() {
  return (
    <>
      <Hero />
      <SearchWidget />
      <FeaturedPackages />
      <WhyChooseUs />
      <Muthowwif />
      <Testimonials />
      <FAQ />
    </>
  );
}
