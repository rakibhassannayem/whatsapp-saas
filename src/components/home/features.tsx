import {
  Check,
  Tags,
  Megaphone,
  UploadCloud,
  FileSpreadsheet,
  CalendarCheck,
  PenLine,
} from "lucide-react";

export function Pill({ t }: { t: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-[12px]">
      <Check className="size-3.5 text-emerald-600" />
      {t}
    </span>
  );
}

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-5 py-14">
      <p className="text-center text-[12px] font-bold uppercase tracking-widest text-emerald-600">
        HOW BROADCASTING WORKS
      </p>
      <h2 className="text-center text-2xl font-extrabold sm:text-3xl">
        Write once. Send to all customers at once.
      </h2>
      <p className="mx-auto mt-2 max-w-xl text-center text-[13px] text-slate-500">
        No bot. No auto-reply. You write the Eid offer or discount msg — we
        personalize and broadcast it.
      </p>
      <div className="mt-10 grid items-center gap-8 lg:grid-cols-2">
        <div className="rounded-[1.5rem] bg-slate-100 p-6 text-center">
          <UploadCloud className="mx-auto size-10 text-blue-500" />
          <p className="mt-2 text-[14px] font-bold">Drop your Excel here</p>
          <p className="mt-1 text-[12px] text-slate-500">
            Names + phone numbers — deduped automatically
          </p>
          <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-4 py-2 text-[12px] font-bold text-white">
            <FileSpreadsheet className="size-4" />
            Upload Files
          </span>
        </div>
        <div>
          <p className="text-5xl font-extrabold text-slate-100">1</p>
          <h3 className="-mt-6 text-2xl font-extrabold">
            Bring your customer list
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            <Pill t="Import CSV / Excel" />
            <Pill t="Validated phones" />
            <Pill t="No typing one-by-one" />
          </div>
          <p className="mt-4 text-[13px] italic text-slate-500">
            Your list stays yours — ready for every Eid & discount blast.
          </p>
        </div>
      </div>
      <div className="mt-10 grid items-center gap-8 lg:grid-cols-2">
        <div>
          <p className="text-5xl font-extrabold text-slate-100">2</p>
          <h3 className="-mt-6 text-2xl font-extrabold">
            Pick exactly who gets it
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            <Pill t="Tag VIP / Regulars" />
            <Pill t="Avoid wrong sends" />
            <Pill t="Live audience count" />
          </div>
          <p className="mt-4 text-[13px] italic text-slate-500">
            Eid offer to all? VIP preview to 342? You choose.
          </p>
        </div>
        <div className="rounded-[1.5rem] bg-emerald-50 p-6">
          <div className="flex flex-wrap gap-2">
            {["VIP", "Eid Offer", "Regulars", "Due"].map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold shadow-sm"
              >
                <Tags className="size-3.5 text-emerald-600" />
                {t}
              </span>
            ))}
          </div>
          <p className="mt-4 flex items-center gap-2 text-[13px] font-semibold">
            <CalendarCheck className="size-4 text-emerald-600" />
            1,240 customers selected for this broadcast
          </p>
        </div>
      </div>
      <div className="mt-10 grid items-center gap-8 lg:grid-cols-2">
        <div className="rounded-[1.5rem] bg-[#1a2340] p-6 text-white">
          <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-300">
            One template → personal for all
          </p>
          <div className="mt-3 space-y-3">
            <div className="rounded-xl bg-white/10 p-3 text-[12px] leading-5">
              Hi {"{{name}}"}, Eid Mubarak! Flat <b>20% OFF</b> till Friday at
              Anar Boutique.
            </div>
            <div className="flex items-center gap-2 text-[12px] text-emerald-200">
              <PenLine className="size-4" /> Rahim gets “Hi Rahim...” • Karim
              gets “Hi Karim...”
            </div>
          </div>
        </div>
        <div>
          <p className="text-5xl font-extrabold text-slate-100">3</p>
          <h3 className="-mt-6 text-2xl font-extrabold">
            Write once, personalize for all
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            <Pill t="Hi {{name}} templates" />
            <Pill t="Eid / discount ready" />
            <Pill t="Reuse every festival" />
          </div>
          <p className="mt-4 text-[13px] italic text-slate-500">
            Feels 1-to-1, sent 1-to-1000.
          </p>
        </div>
      </div>
      <div className="mt-10 grid items-center gap-8 lg:grid-cols-2">
        <div>
          <p className="text-5xl font-extrabold text-slate-100">4</p>
          <h3 className="-mt-6 text-2xl font-extrabold">
            Broadcast at once & track
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            <Pill t="Send to all in one click" />
            <Pill t="Sent / delivered count" />
            <Pill t="Works with your number" />
          </div>
          <p className="mt-4 text-[13px] italic text-slate-500">
            No bot replies — your customers just get your offer.
          </p>
        </div>
        <div className="rounded-[1.5rem] bg-slate-100 p-6">
          <div className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
            <span className="flex size-11 items-center justify-center rounded-full bg-emerald-600 text-white">
              <Megaphone className="size-5" />
            </span>
            <div>
              <p className="text-[13px] font-bold">Eid Offer broadcast</p>
              <p className="text-[12px] text-slate-500">
                To VIP (342) • Sent 342 • Delivered 318
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
