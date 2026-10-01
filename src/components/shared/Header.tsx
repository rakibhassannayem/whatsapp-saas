import Link from "next/link";
import { MessageCircle, Menu } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

const navigation = [
  { label: "Features", href: "/#features" },
  { label: "Services", href: "/#services" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Blog", href: "/#blog" },
  { label: "Contact", href: "/#contact" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link
          className="flex items-center gap-2.5"
          href="/"
          aria-label="WhatsApp SaaS home"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-600 text-white">
            <MessageCircle className="size-5" aria-hidden="true" />
          </span>
          <span className="font-semibold tracking-tight text-slate-950">
            WhatsApp SaaS
          </span>
        </Link>

        <nav
          className="hidden items-center gap-6 md:flex"
          aria-label="Main navigation"
        >
          {navigation.map((item) => (
            <Link
              className="text-sm text-slate-600 transition hover:text-slate-950"
              href={item.href}
              key={item.label}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            className={buttonVariants({ variant: "ghost", size: "sm" })}
            href="/login"
          >
            Sign in
          </Link>
          <Link className={buttonVariants({ size: "sm" })} href="/signup">
            Get started
          </Link>
        </div>

        <details className="group relative md:hidden">
          <summary className="flex cursor-pointer list-none items-center gap-2 rounded-md border px-3 py-2 text-sm text-slate-700 [&::-webkit-details-marker]:hidden">
            <Menu className="size-4" aria-hidden="true" />
            Menu
          </summary>

          <div className="absolute right-0 top-12 z-50 grid w-56 gap-1 rounded-xl border bg-white p-2 shadow-lg">
            {navigation.map((item) => (
              <Link
                className="rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                href={item.href}
                key={item.label}
              >
                {item.label}
              </Link>
            ))}

            <div className="my-1 border-t" />

            <Link
              className="rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              href="/login"
            >
              Sign in
            </Link>
            <Link
              className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              href="/signup"
            >
              Get started
            </Link>
          </div>
        </details>
      </div>
    </header>
  );
}