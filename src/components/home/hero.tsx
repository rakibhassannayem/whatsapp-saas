import Link from "next/link";
import AuthAwareLink from "@/components/common/auth-aware-link";
import { Megaphone, BookCheck, Tags, Send, CheckCheck } from "lucide-react";

export function PhoneMock() {
  return (
    <div className="relative mx-auto w-[250px] sm:w-[270px]">
      <div className="rounded-[2rem] border-[6px] border-slate-900 bg-[#ece5dd] p-2 shadow-2xl">
        <div className="rounded-[1.5rem] bg-[#ece5dd]">
          <div className="flex items-center gap-2 rounded-t-[1.2rem] bg-[#075e54] px-3 py-2 text-white">
            <span className="flex size-6 items-center justify-center rounded-full bg-white/20 text-[10px]">
              <Megaphone className="size-3" />
            </span>
            <div>
              <p className="text-[11px] font-semibold leading-none">Eid Offer Broadcast</p>
              <p className="mt-0.5 text-[9px] text-emerald-200">To: VIP tag • 1,240 recipients</p>
            </div>
          </div>
          <div className="space-y-2 p-2">
            <div className="ml-auto max-w-[95%] rounded-lg rounded-tr-none bg-[#dcf8c6] p-2 text-[10px] leading-4 shadow">
              Assalamu Alaikum <b>Rahim!</b> Eid Mubarak — Flat <b>20% OFF</b> till Friday. Show this msg at counter.
              <span className="mt-1 block text-right text-[8px] text-slate-500">— Anar Boutique</span>
            </div>
            <div className="ml-auto max-w-[95%] rounded-lg rounded-tr-none bg-[#dcf8c6] p-2 text-[10px] leading-4 shadow">
              Assalamu Alaikum <b>Karim!</b> Eid Mubarak — Flat <b>20% OFF</b> till Friday. Show this msg at counter.
              <span className="mt-1 block text-right text-[8px] text-slate-500">— Anar Boutique</span>
            </div>
            <div className="mx-auto flex w-fit items-center gap-1 rounded-full bg-white/80 px-2 py-1 text-[9px] text-slate-600 shadow-sm">
              <CheckCheck className="size-3 text-sky-500" /> Sent to 1,240 • Delivered 1,189
            </div>
          </div>
          <div className="flex items-center gap-1 p-2">
            <div className="flex-1 rounded-full bg-white px-3 py-1.5 text-[10px] text-slate-400">Hi {"{{name}}"}, Eid offer...</div>
            <span className="flex size-7 items-center justify-center rounded-full bg-[#00a884] text-white">
              <Send className="size-3" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Hero() {
  return (
    <div id="about" className="mx-auto max-w-6xl px-3 sm:px-5">
      <div className="relative overflow-hidden rounded-[2rem] bg-[#0b4a3c] px-6 pb-10 pt-10 sm:px-12 sm:pt-14">
        <div className="relative grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-200">
              <Megaphone className="size-3.5" /> No bot • No auto-reply • Just broadcast
            </span>
            <h1 className="mt-4 text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl">
              Send One Eid Offer<br />To <span className="text-emerald-400">1,000 Customers</span><br />At Once
            </h1>
            <p className="mt-4 max-w-md text-[14px] leading-6 text-emerald-50/80">
              Upload your customer list from Excel, pick who gets it with tags, write one message with {"{{name}}"},
              and broadcast it on WhatsApp. Personal for everyone — sent in one click.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <AuthAwareLink href="/signup" className="rounded-full bg-emerald-400 px-5 py-2.5 text-[13px] font-semibold text-emerald-950">
                Start Free Broadcast
              </AuthAwareLink>
              <Link href="#how" className="rounded-full bg-white px-5 py-2.5 text-[13px] font-semibold text-slate-900">
                See How A Broadcast Looks
              </Link>
            </div>
            <p className="mt-4 text-[12px] text-emerald-200/70">
              Eid Campaign • Discount Blast • Re-opening Notice • Due Reminder
            </p>
          </div>
          <div className="relative flex justify-center"><PhoneMock /></div>
        </div>
        <div className="relative mt-8 grid max-w-lg grid-cols-3 gap-2 rounded-2xl bg-white p-2">
          {[
            { icon: BookCheck, t: "Import", s: "Customer List", bg: "bg-orange-50" },
            { icon: Tags, t: "Tag", s: "Audience", bg: "bg-emerald-50" },
            { icon: Megaphone, t: "Broadcast", s: "At Once", bg: "bg-slate-100" },
          ].map((c) => (
            <div key={c.s} className={`rounded-xl ${c.bg} p-3`}>
              <c.icon className="size-5 text-slate-700" />
              <p className="mt-2 text-[12px] font-bold leading-tight text-slate-900">{c.t}<br />{c.s}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


