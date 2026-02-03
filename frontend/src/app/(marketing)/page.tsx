// src/app/(marketing)/page.tsx

import Hero from "@/components/marketing/Hero";
import SearchWidget from "@/components/marketing/SearchWidget";
import FeaturedPackages from "@/components/marketing/FeaturedPackages";
import WhyChooseUs from "@/components/marketing/WhyChooseUs";
import Muthowwif from "@/components/marketing/Muthowwif";
import RegistrationForm from "@/components/marketing/RegistrationForm";
import Testimonials from "@/components/marketing/Testimonials";
import FAQ from "@/components/marketing/FAQ";

export default function HomePage() {
  return (
    <>
      <Hero />
      <SearchWidget />
      <FeaturedPackages />
      <WhyChooseUs />
      <Muthowwif />
      <RegistrationForm />
      <Testimonials />
      <FAQ />
    </>
  );
}
