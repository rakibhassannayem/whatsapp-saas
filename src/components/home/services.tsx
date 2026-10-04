import { Check, Store, UtensilsCrossed, GraduationCap, Tractor, Megaphone, BellRing } from "lucide-react";
import Link from "next/link";

export function Audience() {
  const items = [
    { icon: Store, t: "Clothing & boutiques", s: "Eid / Puja offers to all customers" },
    { icon: UtensilsCrossed, t: "Restaurants & cafes", s: "Weekend discounts to regulars" },
    { icon: GraduationCap, t: "Coaching & pharmacy", s: "Notices & reminders by batch" },
    { icon: Tractor, t: "Shops & field teams", s: "Price updates & re-opening news" },
  ];
  return (
    <section id="industry" className="mx-auto max-w-6xl px-5 py-12 text-center">
      <p className="text-[12px] font-bold uppercase tracking-widest text-red-400">WHO IT&apos;S FOR</p>
      <h2 className="mx-auto mt-2 max-w-xl text-2xl font-extrabold tracking-tight sm:text-3xl">
        Got a customer list? Send them all one message at once
      </h2>
      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {items.map((i) => (
          <div key={i.t} className="rounded-2xl bg-slate-50 p-5 text-left">
            <span className="flex size-9 items-center justify-center rounded-full bg-white shadow-sm">
              <i.icon className="size-4 text-red-400" />
            </span>
            <p className="mt-3 text-[13px] font-bold leading-5">{i.t}</p>
            <p className="mt-1 text-[12px] leading-5 text-slate-500">{i.s}</p>
          </div>
        ))}
      </div>
      <p className="mt-6 text-[15px]">
        If your customers are already in Excel or on WhatsApp,{" "}
        <span className="font-semibold text-emerald-600">you can broadcast tomorrow!</span>
      </p>
    </section>
  );
}

export function Modes() {
  return (
    <section className="mx-auto max-w-6xl px-3 sm:px-5">
      <div className="rounded-[2rem] bg-slate-50 px-5 py-10 sm:px-10">
        <p className="text-center text-[14px] font-semibold text-blue-600">Two kinds of broadcasts — no bot needed</p>
        <h2 className="mx-auto mt-2 max-w-2xl text-center text-2xl font-extrabold tracking-tight">
          One Message To Everyone, Or Only To The Right Tag.
        </h2>
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="flex items-center gap-1.5 text-[11px] font-bold text-blue-600"><Megaphone className="size-3.5" /> FOR ALL CUSTOMERS</p>
            <h3 className="mt-1 text-xl font-extrabold">Offer Blast</h3>
            <p className="mt-2 rounded-xl bg-slate-50 p-3 text-[12px] leading-5 text-slate-600">
              &ldquo;Assalamu Alaikum {"{{name}}"}, Eid Mubarak — 20% OFF till Friday!&rdquo;
            </p>
            <ul className="mt-4 space-y-2.5 text-[13px]">
              {["Eid / Puja / discount announcement", "New arrival or re-opening news", "Same text, personalized with name"].map((t) => (
                <li key={t} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />{t}</li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              {["Eid Offer", "Flat 20% OFF", "New Collection"].map((p) => (
                <span key={p} className="rounded-full bg-slate-100 px-3 py-1 text-[12px]">{p}</span>
              ))}
            </div>
            <Link href="/dashboard/campaigns" className="mt-5 inline-block rounded-full bg-blue-600 px-5 py-2 text-[13px] font-semibold text-white">Try An Offer Blast</Link>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600"><BellRing className="size-3.5" /> FOR A TAGGED SEGMENT</p>
            <h3 className="mt-1 text-xl font-extrabold">Targeted Reminder</h3>
            <p className="mt-2 rounded-xl bg-slate-50 p-3 text-[12px] leading-5 text-slate-600">
              To tag: <b>VIP (342)</b> — &ldquo;Hi {"{{name}}"}, your due reminder + VIP preview tonight.&rdquo;
            </p>
            <ul className="mt-4 space-y-2.5 text-[13px]">
              {["Pick VIP / Due / Regulars by tag", "Avoid sending to the wrong people", "See live audience count before send"].map((t) => (
                <li key={t} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />{t}</li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              {["VIP", "Due 30 days", "Regulars"].map((p) => (
                <span key={p} className="rounded-full bg-slate-100 px-3 py-1 text-[12px]">{p}</span>
              ))}
            </div>
            <Link href="/dashboard/campaigns" className="mt-5 inline-block rounded-full bg-emerald-500 px-5 py-2 text-[13px] font-semibold text-white">Try A Targeted Send</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function LogoStrip() {
  return (
    <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-8 px-5 py-8 opacity-40">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className="text-[15px] font-extrabold text-slate-800">LogoIpsum</span>
      ))}
    </div>
  );
}


