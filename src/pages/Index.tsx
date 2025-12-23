import { Navbar } from "@/components/layout/Navbar";
import { Hero } from "@/components/home/Hero";
import { RoleSection } from "@/components/home/RoleSection";
import { HowItWorks } from "@/components/home/HowItWorks";
import { FeaturedIdeas } from "@/components/home/FeaturedIdeas";
import { TrustSection } from "@/components/home/TrustSection";
import { CTASection } from "@/components/home/CTASection";
import { Footer } from "@/components/layout/Footer";

const Index = () => {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <RoleSection />
      <HowItWorks />
      <FeaturedIdeas />
      <TrustSection />
      <CTASection />
      <Footer />
    </main>
  );
};

export default Index;
