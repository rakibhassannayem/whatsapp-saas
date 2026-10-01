import Link from "next/link";
import { MessageCircle } from "lucide-react";

const productLinks = [
  { label: "Features", href: "/#features" },
  { label: "Services", href: "/#services" },
  { label: "Pricing", href: "/#pricing" },
];

const companyLinks = [
  { label: "Blog", href: "/#blog" },
  { label: "Contact", href: "/#contact" },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <Link className="inline-flex items-center gap-2.5" href="/">
              <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-600 text-white">
                <MessageCircle className="size-5" aria-hidden="true" />
              </span>
              <span className="font-semibold tracking-tight text-slate-950">
                WhatsApp SaaS
              </span>
            </Link>

            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-600">
              Organize customer contacts, prepare message templates, and build
              focused campaign audiences in one workspace.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-950">Product</h2>
            <ul className="mt-4 space-y-3">
              {productLinks.map((item) => (
                <li key={item.label}>
                  <Link
                    className="text-sm text-slate-600 hover:text-slate-950"
                    href={item.href}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-950">Company</h2>
            <ul className="mt-4 space-y-3">
              {companyLinks.map((item) => (
                <li key={item.label}>
                  <Link
                    className="text-sm text-slate-600 hover:text-slate-950"
                    href={item.href}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  className="text-sm text-slate-600 hover:text-slate-950"
                  href="/login"
                >
                  Sign in
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-slate-200 pt-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} WhatsApp SaaS. All rights reserved.</p>
          <p>Built for teams that care about customer conversations.</p>
        </div>
      </div>
    </footer>
  );
}