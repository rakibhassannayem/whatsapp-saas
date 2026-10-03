import Nav from "./Nav";
import Hero from "./Hero";
import { Audience, Modes, LogoStrip } from "./Services";
import { Banner } from "./Pricing";
import { Features } from "./Features";
import { HowItWorks } from "./Contact";
import { LiveDemos, CtaFooter } from "./Demos";

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



