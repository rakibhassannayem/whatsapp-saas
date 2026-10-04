import Link from "next/link";
import { Megaphone, UtensilsCrossed, CheckCheck } from "lucide-react";

export function LiveDemos() {
  return (
    <section id="demos" className="mx-auto max-w-6xl px-5 py-14 text-center">
      <p className="text-[13px] font-semibold text-blue-600">Broadcast Examples</p>
      <h2 className="mx-auto max-w-md text-2xl font-extrabold">One Custom Msg — Sent To Everyone At Once.</h2>
      <div className="mt-8 grid gap-4 text-left sm:grid-cols-2">
        {[
          { t: "Eid 20% OFF to 500 boutique customers", d: "To: All Customers (500) • Hi {{name}}, Eid Mubarak...", c: "bg-emerald-500", icon: Megaphone },
          { t: "Weekend discount to restaurant regulars", d: "To: Regulars (280) • Hi {{name}}, Friday treat...", c: "bg-orange-400", icon: UtensilsCrossed },
        ].map((d) => (
          <div key={d.t} className="rounded-2xl bg-slate-50 p-6">
            <p className="text-[14px] font-bold">{d.t}</p>
            <p className="mt-1 text-[12px] text-slate-500">{d.d}</p>
            <div className={`mt-4 flex h-36 flex-col items-center justify-center gap-2 rounded-xl ${d.c}`}>
              <d.icon className="size-10 text-white" />
              <span className="flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold text-slate-700"><CheckCheck className="size-3 text-emerald-600" /> Personalized per name</span>
            </div>
            <Link href="/dashboard/campaigns" className="mt-4 inline-block rounded-full bg-emerald-500 px-5 py-2 text-[12px] font-bold text-white">TRY THIS BROADCAST</Link>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[12px] text-slate-500">Eid offers, discounts, notices — same flow every time. No bot involved.</p>
    </section>
  );
}

export function CtaFooter() {
  return (
    <div className="mx-auto max-w-6xl px-3 sm:px-5">
      <div className="grid overflow-hidden rounded-[1.5rem] bg-emerald-500 text-white lg:grid-cols-[1.2fr_0.8fr]">
        <div className="p-8">
          <h2 className="text-2xl font-extrabold">Ready to send your Eid offer to all customers?</h2>
          <ul className="mt-4 space-y-2 text-[14px]">
            <li>› Upload your Excel list in 2 minutes</li>
            <li>› Tag VIP / Regulars once, reuse forever</li>
            <li>› Send your first broadcast today</li>
          </ul>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/dashboard/campaigns" className="rounded-full bg-white px-4 py-2 text-[12px] font-bold text-slate-900">See a broadcast demo</Link>
            <Link href="/signup" className="rounded-full bg-[#1a2340] px-4 py-2 text-[12px] font-bold text-white">Start Broadcasting Free</Link>
          </div>
        </div>
        <div className="flex items-center justify-center gap-3 p-6">
          {["E", "2", "0"].map((e) => (
            <span key={e} className="flex size-16 items-center justify-center rounded-full bg-white text-2xl font-bold text-emerald-700 shadow">{e}</span>
          ))}
        </div>
      </div>
      <div className="mt-3 grid gap-8 rounded-[1.5rem] bg-[#111] p-8 text-slate-300 sm:grid-cols-4">
        <div><p className="text-[13px] font-bold text-white">Sitemap</p><ul className="mt-3 space-y-2 text-[12px]"><li>Why Broadcast</li><li>Features</li><li>How it works?</li><li>Examples</li><li>Contact</li></ul></div>
        <div><p className="text-[13px] font-bold text-white">Broadcasts</p><ul className="mt-3 space-y-2 text-[12px]"><li>Eid Offer Blast</li><li>Discount Blast</li><li>Due Reminders</li><li>Re-opening Notice</li></ul></div>
        <div><p className="text-[13px] font-bold text-white">How It Works</p><ul className="mt-3 space-y-2 text-[12px]"><li>Customer Lists</li><li>Tags</li><li>Custom Templates</li><li>Bulk Broadcast</li></ul></div>
        <div className="text-right"><p className="text-[11px]">© 2026 WhatsApp Broadcast</p><p className="mt-1 text-[11px] text-slate-400">Bulk custom msgs — no bot.</p><Link href="/login" className="mt-1 inline-block text-[12px] underline">Sign in</Link></div>
      </div>
      <div className="h-6" />
    </div>
  );
}
