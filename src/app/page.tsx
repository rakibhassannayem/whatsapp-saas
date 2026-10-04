import Nav from "@/components/home/nav";
import Hero from "@/components/home/hero";
import { Audience, LogoStrip, Modes } from "@/components/home/services";
import { Banner } from "@/components/home/pricing";
import { Features } from "@/components/home/features";
import { HowItWorks } from "@/components/home/contact";
import { CtaFooter, LiveDemos } from "@/components/home/demos";

export default function HomePage() {
  return (
    <div className="bg-white">
      {/* Landing-only: hide global Header/Footer on "/" so the
          cloned pill-nav + black sitemap footer match the reference.
          Dashboard / login / signup pages are untouched. */}
      <style>{`header.sticky,body>footer{display:none!important}`}</style>
      <Nav />
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
      <CtaFooter />
    </div>
  );
}


