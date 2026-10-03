import Link from "next/link";
import { CheckCheck, Megaphone, MessagesSquare } from "lucide-react";
import type { ReactNode } from "react";
import Nav from "@/components/landingPage/Nav";

const BULLETS = [
  "Upload your Excel customer list once",
  "Tag VIP / Regulars, write Hi {{name}} msg",
  "Broadcast Eid offers & discounts at once",
];

export default function AuthShell({
  title,
  subtitle,
  footer,
  children,
}: {
  title: string;
  subtitle: string;
  footer: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      <Nav />
      <div className="mx-auto max-w-6xl px-3 pb-10 pt-6 sm:px-5">
        <div className="grid overflow-hidden rounded-[2rem] border border-slate-200 shadow-sm lg:grid-cols-[1fr_1fr]">
          {/* Left: brand panel — same deep green as landing Hero */}
          <div className="relative bg-[#0b4a3c] p-8 text-white sm:p-10">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-md bg-emerald-400 text-emerald-950">
                <MessagesSquare className="size-4" />
              </span>
              <span className="text-[16px] font-bold tracking-tight">
                WhatsApp<span className="text-emerald-400"> Broadcast</span>
              </span>
            </Link>
            <span className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-200">
              <Megaphone className="size-3.5" /> No bot • No auto-reply • Just broadcast
            </span>
            <h2 className="mt-4 text-3xl font-extrabold leading-tight">
              One custom msg.
              <br />
              All customers.
              <br />
              <span className="text-emerald-400">At once.</span>
            </h2>
            <ul className="mt-6 space-y-2.5">
              {BULLETS.map((b) => (
                <li key={b} className="flex items-start gap-2 text-[13px] leading-5 text-emerald-50/85">
                  <CheckCheck className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                  {b}
                </li>
              ))}
            </ul>
            <div className="mt-6 max-w-sm rounded-2xl bg-white/10 p-4">
              <p className="text-[11px] font-bold text-emerald-200">EID OFFER • TO: VIP (342)</p>
              <div className="mt-2 rounded-xl rounded-tr-none bg-[#dcf8c6] p-3 text-[12px] leading-5 text-slate-800 shadow">
                Assalamu Alaikum Rahim! Eid Mubarak — Flat <b>20% OFF</b> till Friday.
              </div>
              <p className="mt-2 text-[11px] text-emerald-200/70">
                Eid Campaign • Discount Blast • Due Reminder
              </p>
            </div>
          </div>

          {/* Right: form panel */}
          <div className="bg-white p-8 sm:p-10">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{title}</h1>
            <p className="mt-1.5 text-[13px] leading-5 text-slate-500">{subtitle}</p>
            <div className="mt-6">{children}</div>
            <div className="mt-6 border-t border-slate-100 pt-5 text-[13px] text-slate-500">{footer}</div>
          </div>
        </div>
        <p className="mt-4 text-center text-[12px] text-slate-400">
          Works with your existing WhatsApp number — no bot needed.
        </p>
      </div>
    </div>
  );
}
