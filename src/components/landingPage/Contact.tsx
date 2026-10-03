import Link from "next/link";
import { BadgeCheck, FileSpreadsheet, Tags, Megaphone } from "lucide-react";

export function HowItWorks() {
  return (
    <section id="how" className="mx-auto max-w-6xl px-3 sm:px-5">
      <div className="rounded-[2rem] bg-[#1a2340] px-6 py-12 text-center text-white sm:px-12">
        <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-300">No bot • You send, they receive</p>
        <h2 className="mt-1 text-2xl font-extrabold">Send your Eid offer in 3 steps</h2>
        <div className="mt-8 grid gap-8 sm:grid-cols-3">
          {[
            { n: "1", t: "Import contacts from Excel", s: "Names + numbers in 2 minutes", icon: FileSpreadsheet },
            { n: "2", t: "Pick tag + write custom msg", s: "e.g. VIP + Hi {{name}}, 20% OFF", icon: Tags },
            { n: "3", t: "Broadcast to all at once", s: "Personal for each customer", icon: Megaphone },
          ].map((s) => (
            <div key={s.n}>
              <span className="mx-auto flex size-9 items-center justify-center rounded-full bg-emerald-500 text-[14px] font-bold">{s.n}</span>
              <p className="mx-auto mt-3 max-w-[200px] text-[14px] font-bold leading-5">{s.t}</p>
              <p className="mx-auto mt-1 max-w-[200px] text-[12px] leading-5 text-emerald-200/70">{s.s}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-[12px] text-emerald-200">
          <span className="flex items-center gap-1.5"><BadgeCheck className="size-4" />Personalized with customer name.</span>
          <span className="flex items-center gap-1.5"><BadgeCheck className="size-4" />Works with your existing WhatsApp number.</span>
        </div>
        <Link href="/signup" className="mt-6 inline-block rounded-full bg-emerald-400 px-6 py-2.5 text-[12px] font-bold text-emerald-950">START MY FIRST BROADCAST</Link>
      </div>
    </section>
  );
}

