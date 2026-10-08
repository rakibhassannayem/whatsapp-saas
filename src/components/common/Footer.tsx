import Link from "next/link";
import AuthAwareLink from "@/components/common/auth-aware-link";

export function Footer() {
  return (
    <div className="mx-auto max-w-6xl px-3 sm:px-5">
      <div className="grid overflow-hidden rounded-[1.5rem] bg-emerald-500 text-white lg:grid-cols-[1.2fr_0.8fr]">
        <div className="p-8">
          <h2 className="text-2xl font-extrabold">
            Ready to send your Eid offer to all customers?
          </h2>
          <ul className="mt-4 space-y-2 text-[14px]">
            <li>› Upload your Excel list in 2 minutes</li>
            <li>› Tag VIP / Regulars once, reuse forever</li>
            <li>› Send your first broadcast today</li>
          </ul>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/dashboard/campaigns"
              className="rounded-full bg-white px-4 py-2 text-[12px] font-bold text-slate-900"
            >
              See a broadcast demo
            </Link>
            <AuthAwareLink
              href="/signup"
              className="rounded-full bg-[#1a2340] px-4 py-2 text-[12px] font-bold text-white"
            >
              Start Broadcasting Free
            </AuthAwareLink>
          </div>
        </div>
        <div className="flex items-center justify-center gap-3 p-6">
          {["E", "2", "0"].map((e) => (
            <span
              key={e}
              className="flex size-16 items-center justify-center rounded-full bg-white text-2xl font-bold text-emerald-700 shadow"
            >
              {e}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-3 grid gap-8 rounded-[1.5rem] bg-[#111] p-8 text-slate-300 sm:grid-cols-4">
        <div>
          <p className="text-[13px] font-bold text-white">Sitemap</p>
          <ul className="mt-3 space-y-2 text-[12px]">
            <li>Why Broadcast</li>
            <li>Features</li>
            <li>How it works?</li>
            <li>Examples</li>
            <li>Contact</li>
          </ul>
        </div>
        <div>
          <p className="text-[13px] font-bold text-white">Broadcasts</p>
          <ul className="mt-3 space-y-2 text-[12px]">
            <li>Eid Offer Blast</li>
            <li>Discount Blast</li>
            <li>Due Reminders</li>
            <li>Re-opening Notice</li>
          </ul>
        </div>
        <div>
          <p className="text-[13px] font-bold text-white">How It Works</p>
          <ul className="mt-3 space-y-2 text-[12px]">
            <li>Customer Lists</li>
            <li>Tags</li>
            <li>Custom Templates</li>
            <li>Bulk Broadcast</li>
          </ul>
        </div>
        <div className="text-right">
          <p className="text-[11px]">© 2026 WhatsApp Broadcast</p>
          <p className="mt-1 text-[11px] text-slate-400">
            Bulk custom msgs — no bot.
          </p>
          <AuthAwareLink
            href="/login"
            className="mt-1 inline-block text-[12px] underline"
          >
            Sign in
          </AuthAwareLink>
        </div>
      </div>
      <div className="h-6" />
    </div>
  );
}
