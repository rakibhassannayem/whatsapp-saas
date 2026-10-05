import Link from "next/link";
import { MessageCircle, CheckCheck } from "lucide-react";

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
