import Link from "next/link";
import { MessagesSquare } from "lucide-react";
import NavUserMenu from "@/components/auth/NavUserMenu";

const NAV = [
  { label: "Home", href: "/" },
  { label: "Features", href: "/#features" },
  { label: "Who It's For", href: "/#industry" },
  { label: "How It Works", href: "/#how" },
  { label: "Examples", href: "/#demos" },
];

export default function Nav() {
  return (
    <div className="sticky top-0 z-50 bg-white/80 py-3 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-3 sm:px-5">
      <div className="flex items-center justify-between rounded-full border border-slate-200 bg-white/90 py-2 pl-4 pr-2 shadow-sm backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-md bg-emerald-600 text-white">
            <MessagesSquare className="size-4" />
          </span>
          <span className="text-[15px] font-bold tracking-tight">
            WhatsApp<span className="text-emerald-600"> Broadcast</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-6 text-[13px] text-slate-600 lg:flex">
          {NAV.map((n) => (
            <Link key={n.label} href={n.href} className="hover:text-slate-950">
              {n.label}
            </Link>
          ))}
        </nav>
        <NavUserMenu />
      </div>
      </div>
    </div>
  );
}

