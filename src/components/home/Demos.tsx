import Link from "next/link";
import { Megaphone, UtensilsCrossed, CheckCheck } from "lucide-react";

export function LiveDemos() {
  return (
    <section id="demos" className="mx-auto max-w-6xl px-5 py-14 text-center">
      <p className="text-[13px] font-semibold text-blue-600">
        Broadcast Examples
      </p>
      <h2 className="mx-auto max-w-md text-2xl font-extrabold">
        One Custom Msg — Sent To Everyone At Once.
      </h2>
      <div className="mt-8 grid gap-4 text-left sm:grid-cols-2">
        {[
          {
            t: "Eid 20% OFF to 500 boutique customers",
            d: "To: All Customers (500) • Hi {{name}}, Eid Mubarak...",
            c: "bg-emerald-500",
            icon: Megaphone,
          },
          {
            t: "Weekend discount to restaurant regulars",
            d: "To: Regulars (280) • Hi {{name}}, Friday treat...",
            c: "bg-orange-400",
            icon: UtensilsCrossed,
          },
        ].map((d) => (
          <div key={d.t} className="rounded-2xl bg-slate-50 p-6">
            <p className="text-[14px] font-bold">{d.t}</p>
            <p className="mt-1 text-[12px] text-slate-500">{d.d}</p>
            <div
              className={`mt-4 flex h-36 flex-col items-center justify-center gap-2 rounded-xl ${d.c}`}
            >
              <d.icon className="size-10 text-white" />
              <span className="flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold text-slate-700">
                <CheckCheck className="size-3 text-emerald-600" /> Personalized
                per name
              </span>
            </div>
            <Link
              href="/dashboard/campaigns"
              className="mt-4 inline-block rounded-full bg-emerald-500 px-5 py-2 text-[12px] font-bold text-white"
            >
              TRY THIS BROADCAST
            </Link>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[12px] text-slate-500">
        Eid offers, discounts, notices — same flow every time. No bot involved.
      </p>
    </section>
  );
}
