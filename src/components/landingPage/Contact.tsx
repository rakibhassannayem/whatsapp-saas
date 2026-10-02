import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
const Contact = () => {
  return (
    <section id="contact" className="scroll-mt-24 px-5 py-20 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-5xl rounded-3xl bg-slate-950 px-6 py-12 text-white sm:px-12 sm:py-14">
        <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-emerald-300">
              Contact
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Have a question about your messaging workflow?
            </h2>
            <p className="mt-4 leading-7 text-slate-300">
              Get in touch to discuss your needs or create a workspace and
              explore the product.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 text-black">
            <Link className={buttonVariants({ size: "lg" })} href="/dashboard">
              Get started
            </Link>
            <Link
              className={buttonVariants({
                variant: "outline",
                size: "lg",
              })}
              href="mailto:hello@example.com"
            >
              Contact us
              <ArrowUpRight data-icon="inline-end" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
