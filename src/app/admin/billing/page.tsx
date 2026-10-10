import { CreditCard, ReceiptText } from "lucide-react";
import PlatformAdminDataNotice from "@/components/platform-admin/platform-admin-data-notice";
import { getPlatformAdminBusinesses } from "@/lib/supabase/platform-admin-data";

export default async function AdminBillingPage() {
  const result = await getPlatformAdminBusinesses();
  if (result.status !== "authorized") return <PlatformAdminDataNotice />;
  const payments = result.businesses.flatMap((business) =>
    business.payments.map((payment) => ({ ...payment, businessName: business.name })),
  );
  const paidPayments = payments.filter((payment) => payment.status === "paid");
  const collectedBdt = paidPayments
    .filter((payment) => payment.currency === "BDT")
    .reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Billing records</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Payment history</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Review which package each business paid for, when, and how much. This page does not accept payments or enable a payment method.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {[
          { label: "Payment records", value: result.subscriptionDataAvailable ? payments.length.toLocaleString() : "—", icon: ReceiptText },
          { label: "Recorded amount collected (BDT)", value: result.subscriptionDataAvailable ? collectedBdt.toLocaleString() : "—", icon: CreditCard },
        ].map(({ label, value, icon: Icon }) => (
          <section key={label} className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"><div><p className="text-sm text-slate-500">{label}</p><p className="mt-3 text-2xl font-bold text-slate-950">{value}</p></div><Icon className="size-5 text-emerald-700" /></section>
        ))}
      </div>

      {!result.subscriptionDataAvailable && (
        <div className="mt-6"><PlatformAdminDataNotice title="Payment history is not in local PostgreSQL yet" description="Payment history has not been moved into the local database. No payment gateway is connected." /></div>
      )}

      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4"><h2 className="font-semibold text-slate-900">Transactions</h2><p className="mt-1 text-xs text-slate-500">Package snapshots and payment records</p></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs text-slate-500">
            <thead className="bg-slate-50 uppercase tracking-wide"><tr>{["Payment date", "Business", "Package", "Amount", "Reference", "Status"].map((column) => <th key={column} className="px-4 py-3 font-semibold">{column}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-4 py-4">{payment.paidAt?.slice(0, 10) ?? payment.createdAt.slice(0, 10)}</td>
                  <td className="px-4 py-4 font-semibold text-slate-800">{payment.businessName}</td>
                  <td className="px-4 py-4">{payment.packageName}</td>
                  <td className="px-4 py-4">{payment.amount.toLocaleString()} {payment.currency}</td>
                  <td className="px-4 py-4">{payment.paymentReference ?? "—"}</td>
                  <td className="px-4 py-4"><span className="rounded-full bg-slate-100 px-2.5 py-1 capitalize">{payment.status}</span></td>
                </tr>
              ))}
              {result.subscriptionDataAvailable && payments.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-12 text-center"><p className="text-sm font-semibold text-slate-800">No payment records yet</p><p className="mt-2 text-xs text-slate-500">No payment records have been added yet.</p></td></tr>
              )}
              {!result.subscriptionDataAvailable && (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-xs text-slate-500">Payment records will appear here after the migration is applied.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
