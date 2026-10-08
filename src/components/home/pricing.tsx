import Link from "next/link";
import { Check, CheckCheck, MessageCircle, Sparkles } from "lucide-react";

export function Banner() {
  return (
    <section className="mx-auto max-w-6xl px-3 sm:px-5">
      <div className="relative grid overflow-hidden rounded-[2rem] bg-[#ffde59] lg:grid-cols-2">
        <div className="p-8 sm:p-12">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-700">
            Not a bot • Not auto-reply
          </p>
          <h2 className="mt-2 text-3xl font-extrabold leading-tight sm:text-4xl">
            One Message.
            <br />
            Every Customer.
            <br />
            Personal — Like You Sent It One-By-One.
          </h2>
          <p className="mt-3 max-w-sm text-[13px] leading-6 text-slate-700">
            Write your Eid offer once with {"{{name}}"}. We personalize it for
            each customer and broadcast it on WhatsApp.
          </p>
          <Link
            href="#how"
            className="mt-6 inline-block rounded-full border border-slate-900 px-5 py-2 text-[12px] font-bold"
          >
            SEE HOW IT WORKS
          </Link>
        </div>
        <div className="relative flex items-end justify-center">
          <div className="absolute right-6 top-6 flex size-14 items-center justify-center rounded-2xl bg-white shadow">
            <MessageCircle className="size-7 text-emerald-600" />
          </div>
          <div className="m-6 w-full max-w-sm rounded-2xl bg-white/80 p-4">
            <p className="text-[11px] font-bold text-slate-500">
              EID OFFER • TO: VIP (342)
            </p>
            <div className="mt-2 rounded-xl rounded-tr-none bg-[#dcf8c6] p-3 text-[12px] leading-5 shadow-sm">
              Hi {"{{name}}"}, Eid Mubarak! Flat 20% OFF till Friday — show this
              msg at counter.
            </div>
            <p className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-slate-600">
              <CheckCheck className="size-3.5 text-sky-500" /> 2,000 contacts
              ready • Tags, templates done
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SubscriptionPlans() {
  const periods = [
    {
      name: "Monthly",
      description: "মাসে মাসে plan ব্যবহার",
      note: "প্রতি মাসে renewal",
      featured: false,
    },
    {
      name: "Yearly",
      description: "এক বছর ধরে plan ব্যবহার",
      note: "বছরে একবার renewal",
      featured: true,
    },
  ];

  return (
    <section id="plans" className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
          <Sparkles className="size-3.5" /> Simple subscription options
        </span>
        <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
          Choose how you want to subscribe
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          মাসিক অথবা বাৎসরিক—তোমার business-এর জন্য সুবিধাজনক সময়কাল বেছে নাও।
          Package price ও usage limit শিগগির ঘোষণা করা হবে।
        </p>
      </div>

      <div className="mx-auto mt-9 grid max-w-3xl gap-4 md:grid-cols-2">
        {periods.map((period) => (
          <article
            key={period.name}
            className={`relative rounded-3xl border p-6 sm:p-7 ${
              period.featured
                ? "border-emerald-500 bg-[#0b4a3c] text-white shadow-xl shadow-emerald-950/10"
                : "border-slate-200 bg-white text-slate-950 shadow-sm"
            }`}
          >
            {period.featured && (
              <span className="absolute right-5 top-5 rounded-full bg-emerald-300 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-950">
                Yearly
              </span>
            )}
            <p className={`text-sm font-semibold ${period.featured ? "text-emerald-200" : "text-emerald-700"}`}>
              {period.name} plan
            </p>
            <h3 className="mt-2 text-2xl font-bold">{period.description}</h3>
            <p className={`mt-5 text-lg font-bold ${period.featured ? "text-white" : "text-slate-900"}`}>
              মূল্য শিগগির জানানো হবে
            </p>
            <p className={`mt-1 text-xs ${period.featured ? "text-emerald-100/70" : "text-slate-500"}`}>
              {period.note}
            </p>
            <ul className={`mt-6 space-y-3 border-t pt-5 text-sm ${period.featured ? "border-white/15 text-emerald-50" : "border-slate-100 text-slate-600"}`}>
              {["Customer ও campaign management", "CSV এবং Excel customer import", "ব্যবহারের limit package অনুযায়ী নির্ধারিত হবে"].map((feature) => (
                <li key={feature} className="flex items-start gap-2.5">
                  <Check className={`mt-0.5 size-4 shrink-0 ${period.featured ? "text-emerald-300" : "text-emerald-600"}`} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className={`mt-7 inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition ${
                period.featured
                  ? "bg-emerald-300 text-emerald-950 hover:bg-emerald-200"
                  : "bg-slate-950 text-white hover:bg-slate-800"
              }`}
            >
              Account তৈরি করো
            </Link>
            <p className={`mt-3 text-center text-[11px] ${period.featured ? "text-emerald-100/60" : "text-slate-400"}`}>
              এখনো online payment চালু হয়নি
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
