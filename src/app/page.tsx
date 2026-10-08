import { Banner, SubscriptionPlans } from "@/components/home/Pricing";
import { Features } from "@/components/home/Features";
import { HowItWorks } from "@/components/home/HowItWorks";
import { LiveDemos } from "@/components/home/Demos";
import Navbar from "@/components/common/Navbar";
import Hero from "@/components/home/Hero";
import { Audience, LogoStrip, Modes } from "@/components/home/Services";
import { Footer } from "@/components/common/Footer";

export default function HomePage() {
  return (
    <div className="bg-white">
      {/* Landing-only: hide global Header/Footer on "/" so the
          cloned pill-nav + black sitemap footer match the reference.
          Dashboard / login / signup pages are untouched. */}
      <style>{`header.sticky,body>footer{display:none!important}`}</style>
      <Navbar />
      <div className="mt-3">
        <Hero />
      </div>
      <Audience />
      <Modes />
      <LogoStrip />
      <Banner />
      <Features />
      <HowItWorks />
      <LiveDemos />
      <SubscriptionPlans />
      <Footer />
    </div>
  );
}
