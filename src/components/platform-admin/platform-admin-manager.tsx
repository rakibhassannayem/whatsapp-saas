"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { PlatformAdminBusiness } from "@/types/platform-admin";

type PlatformAdminManagerProps = {
  businesses: PlatformAdminBusiness[];
  subscriptionDataAvailable: boolean;
};

export default function PlatformAdminManager({
  businesses,
  subscriptionDataAvailable,
}: PlatformAdminManagerProps) {
  const router = useRouter();
  const [busyKey, setBusyKey] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const visibleBusinesses = businesses.filter((business) => {
    const searchable = [
      business.name,
      ...business.users.flatMap((user) => [user.fullName ?? "", user.email ?? ""]),
    ]
      .join(" ")
      .toLocaleLowerCase();
    return searchable.includes(search.trim().toLocaleLowerCase());
  });

  async function renameBusiness(
    event: FormEvent<HTMLFormElement>,
    businessId: string,
  ) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    setBusyKey(`business:${businessId}`);
    setMessage("");

    try {
      const response = await fetch("/api/platform-admin/businesses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, name }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error ?? "Business update করা যায়নি।");
      setMessage("Business-এর নাম update হয়েছে।");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Business update করা যায়নি।",
      );
    } finally {
      setBusyKey("");
    }
  }

  async function updateUser(userId: string, action: "suspend" | "reactivate") {
    setBusyKey(`user:${userId}`);
    setMessage("");

    try {
      const response = await fetch("/api/platform-admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error ?? "Account status update করা যায়নি।");
      setMessage(
        action === "suspend"
          ? "User account suspend হয়েছে।"
          : "User account reactivate হয়েছে।",
      );
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Account status update করা যায়নি।",
      );
    } finally {
      setBusyKey("");
    }
  }

  return (
    <div className="mt-6 space-y-5">
      {message && (
        <p className="rounded-lg bg-slate-100 px-4 py-3 text-sm" role="status">
          {message}
        </p>
      )}

      <label className="block max-w-lg">
        <span className="mb-2 block text-sm font-medium text-slate-700">
          Business বা owner খুঁজুন
        </span>
        <input
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          type="search"
          placeholder="Business name, user name বা email"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </label>

      {businesses.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          এখনো কোনো business তৈরি হয়নি।
        </div>
      ) : (
        visibleBusinesses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            এই search-এর সঙ্গে মেলে এমন business নেই।
          </div>
        ) : visibleBusinesses.map((business) => (
          <section
            key={business.id}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400" />
            <div className="p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  {business.name}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  তৈরি:{" "}
                  <time dateTime={business.createdAt}>
                    {business.createdAt.slice(0, 10)}
                  </time>
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                    {business.customerCount.toLocaleString()} customers
                  </span>
                  <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800">
                    {business.campaigns.length.toLocaleString()} campaigns
                  </span>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                    Sent-message tracking নেই
                  </span>
                </div>
              </div>
              <form
                className="flex w-full gap-2 sm:max-w-md"
                onSubmit={(event) => renameBusiness(event, business.id)}
              >
                <label
                  className="sr-only"
                  htmlFor={`business-name-${business.id}`}
                >
                  Business name
                </label>
                <input
                  id={`business-name-${business.id}`}
                  className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  name="name"
                  defaultValue={business.name}
                  maxLength={120}
                  required
                />
                <button
                  className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                  type="submit"
                  disabled={busyKey === `business:${business.id}`}
                >
                  {busyKey === `business:${business.id}`
                    ? "Saving…"
                    : "নাম বদলাও"}
                </button>
              </form>
            </div>

            <div className="mt-5 grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Subscription</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {subscriptionDataAvailable
                    ? business.subscription?.planName ?? "Plan record নেই"
                    : "Schema migration দরকার"}
                </p>
                {business.subscription && (
                  <p className="mt-1 text-xs capitalize text-slate-500">
                    {business.subscription.billingPeriod} · {business.subscription.status}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">মেয়াদ ও ব্যবহার limit</p>
                {business.subscription ? (
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    {business.subscription.expiresAt
                      ? `শেষ ${business.subscription.expiresAt.slice(0, 10)}`
                      : "মেয়াদ শেষের তারিখ নেই"}
                    <br />গ্রাহক {business.subscription.customerLimit ?? "নির্ধারিত নয়"} · campaign {business.subscription.campaignLimit ?? "নির্ধারিত নয়"} · মাসিক message {business.subscription.monthlyMessageLimit ?? "নির্ধারিত নয়"}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-slate-600">
                    {subscriptionDataAvailable ? "কোনো active/history record নেই" : "Subscription schema যোগ হলে দেখাবে"}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Payment history</p>
                <p className="mt-1 text-sm text-slate-600">
                  {business.payments.length === 0
                    ? subscriptionDataAvailable ? "কোনো payment record নেই" : "Schema migration দরকার"
                    : `${business.payments.length} record · সর্বশেষ ${business.payments[0].amount.toLocaleString()} ${business.payments[0].currency}`}
                </p>
              </div>
            </div>

            <div className="mt-5 border-t border-slate-100 pt-4">
              <h3 className="text-sm font-semibold text-slate-800">Campaign তালিকা</h3>
              {business.campaigns.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">এখনো campaign তৈরি হয়নি।</p>
              ) : (
                <ul className="mt-3 divide-y divide-slate-100">
                  {business.campaigns.map((campaign) => (
                    <li key={campaign.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{campaign.name}</p>
                        <p className="mt-1 text-xs text-slate-500">{campaign.createdAt.slice(0, 10)} · {campaign.audienceCount.toLocaleString()} audience member</p>
                      </div>
                      <span className="w-fit rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-600">{campaign.status}</span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-3 text-xs leading-5 text-slate-500">
                এখানে campaign-এর নাম, অবস্থা ও নির্বাচিত audience count দেখা যাচ্ছে। আসলে পাঠানো message-এর হিসাব বর্তমান database-এ সংরক্ষিত হয় না।
              </p>
            </div>

            <div className="mt-5 border-t border-slate-100 pt-4">
              <h3 className="text-sm font-semibold text-slate-800">
                Business users ({business.users.length})
              </h3>
              {business.users.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">
                  এই business-এ কোনো member নেই।
                </p>
              ) : (
                <ul className="mt-3 divide-y divide-slate-100">
                  {business.users.map((user) => (
                    <li
                      key={user.id}
                      className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {user.fullName || "নাম দেওয়া হয়নি"}
                        </p>
                        <p className="truncate text-sm text-slate-500">
                          {user.email || "Email নেই"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {user.role === "platform_admin"
                            ? "Platform admin"
                            : "Business user"}
                          {" · "}
                          {user.status === "suspended" ? "Suspended" : "Active"}
                        </p>
                      </div>
                      {user.role === "business_user" && (
                        <button
                          className="self-start rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-50 sm:self-auto"
                          type="button"
                          disabled={busyKey === `user:${user.id}`}
                          onClick={() =>
                            updateUser(
                              user.id,
                              user.status === "suspended"
                                ? "reactivate"
                                : "suspend",
                            )
                          }
                        >
                          {busyKey === `user:${user.id}`
                            ? "Updating…"
                            : user.status === "suspended"
                              ? "Reactivate"
                              : "Suspend"}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            </div>
          </section>
        ))
      )}
    </div>
  );
}
