"use client";

import { useState, type FormEvent } from "react";
import { dashboardApiRequest } from "@/lib/dashboard-api";

type Customer = {
  id: string;
  full_name: string;
  phone_e164: string;
  email: string | null;
  created_at: string;
};

type Tag = {
  id: string;
  name: string;
};

type CustomerTag = {
  customer_id: string;
  tag_id: string;
};

type CustomerFormProps = {
  initialCustomers: Customer[];
  initialTags: Tag[];
  initialCustomerTags: CustomerTag[];
};

export default function CustomerForm({
  initialCustomers,
  initialTags,
  initialCustomerTags,
}: CustomerFormProps) {
  const [customers, setCustomers] = useState(initialCustomers);
  const [customerTags, setCustomerTags] = useState(initialCustomerTags);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const fullName = String(formData.get("fullName") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();

    setMessage("");
    setBusy(true);

    const { data, error } = await dashboardApiRequest<Customer>(
      "/api/dashboard/customers",
      {
        method: "POST",
        body: {
          full_name: fullName,
          phone_e164: phone,
          email: email || null,
        },
      },
    );

    setBusy(false);

    if (error || !data) {
      setMessage(error ?? "Customer যোগ করা যায়নি।");
      return;
    }

    setCustomers((current) => [data, ...current]);
    setMessage("Customer যোগ হয়েছে।");
    form.reset();
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const customerToUpdate = editingCustomer;
    if (!customerToUpdate) return;

    const formData = new FormData(event.currentTarget);
    const fullName = String(formData.get("fullName") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();

    setMessage("");
    setBusy(true);

    const { data, error } = await dashboardApiRequest<Customer>(
      "/api/dashboard/customers",
      {
        method: "PATCH",
        body: {
          id: customerToUpdate.id,
          full_name: fullName,
          phone_e164: phone,
          email: email || null,
        },
      },
    );

    setBusy(false);

    if (error || !data) {
      setMessage(error ?? "Customer update করা যায়নি।");
      return;
    }

    setCustomers((current) =>
      current.map((customer) => (customer.id === data.id ? data : customer)),
    );
    setEditingCustomer(null);
    setMessage("Customer update হয়েছে।");
  }

  async function handleDelete(customer: Customer) {
    const confirmed = window.confirm(
      `${customer.full_name}-কে customer list থেকে delete করবে?`,
    );

    if (!confirmed) return;

    setMessage("");
    setBusy(true);

    const { error } = await dashboardApiRequest<{ success: boolean }>(
      "/api/dashboard/customers",
      { method: "DELETE", body: { id: customer.id } },
    );

    setBusy(false);

    if (error) {
      setMessage(error);
      return;
    }

    setCustomers((current) =>
      current.filter((item) => item.id !== customer.id),
    );
    setMessage("Customer delete হয়েছে।");
  }

  async function handleAddTag(customerId: string, tagId: string) {
    setMessage("");
    setBusy(true);

    const { error } = await dashboardApiRequest<{ success: boolean }>(
      "/api/dashboard/customer-tags",
      { method: "POST", body: { customerId, tagId } },
    );

    setBusy(false);

    if (error) {
      setMessage(error);
      return;
    }

    setCustomerTags((current) => [
      ...current,
      { customer_id: customerId, tag_id: tagId },
    ]);
    setMessage("Customer-এর সঙ্গে tag যুক্ত হয়েছে।");
  }

  async function handleRemoveTag(customerId: string, tagId: string) {
    setMessage("");
    setBusy(true);

    const { error } = await dashboardApiRequest<{ success: boolean }>(
      "/api/dashboard/customer-tags",
      { method: "DELETE", body: { customerId, tagId } },
    );

    setBusy(false);

    if (error) {
      setMessage(error);
      return;
    }

    setCustomerTags((current) =>
      current.filter(
        (item) => !(item.customer_id === customerId && item.tag_id === tagId),
      ),
    );
    setMessage("Customer থেকে tag সরানো হয়েছে।");
  }

  const filteredCustomers = customers.filter((customer) => {
    const query = search.trim().toLowerCase();

    return (
      customer.full_name.toLowerCase().includes(query) ||
      customer.phone_e164.toLowerCase().includes(query) ||
      (customer.email?.toLowerCase().includes(query) ?? false)
    );
  });

  return (
    <>
      <form className="mt-8 space-y-4 rounded border p-4" onSubmit={handleAdd}>
        <h2 className="font-semibold">Add a customer</h2>

        <label className="block">
          <span className="mb-1 block">Full name</span>
          <input
            className="w-full rounded border p-2"
            name="fullName"
            maxLength={120}
            required
          />
        </label>

        <label className="block">
          <span className="mb-1 block">WhatsApp phone</span>
          <input
            className="w-full rounded border p-2"
            name="phone"
            type="tel"
            placeholder="+8801712345678"
            pattern="^\+[1-9][0-9]{1,14}$"
            maxLength={16}
            required
          />
          <span className="mt-1 block text-sm text-gray-600">
            Country code-সহ লিখো, যেমন +8801712345678
          </span>
        </label>

        <label className="block">
          <span className="mb-1 block">Email (optional)</span>
          <input
            className="w-full rounded border p-2"
            name="email"
            type="email"
            autoComplete="email"
          />
        </label>

        <button
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
          type="submit"
          disabled={busy}
        >
          {busy ? "Saving..." : "Add customer"}
        </button>
      </form>

      <section className="mt-8">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-semibold">
            Customers ({filteredCustomers.length} / {customers.length})
          </h2>

          <input
            className="w-full rounded-md border bg-white p-2 sm:max-w-xs"
            type="search"
            placeholder="নাম, ফোন বা email দিয়ে খুঁজো"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {customers.length === 0 ? (
          <p className="text-gray-600">এখনো কোনো customer যোগ করা হয়নি।</p>
        ) : filteredCustomers.length === 0 ? (
          <p className="rounded-lg border bg-white p-4 text-gray-600">
            এই search-এর সঙ্গে মেলে এমন customer পাওয়া যায়নি।
          </p>
        ) : (
          <ul className="divide-y rounded border">
            {filteredCustomers.map((customer) => (
              <li className="p-4" key={customer.id}>
                {editingCustomer?.id === customer.id ? (
                  <form
                    key={editingCustomer.id}
                    className="space-y-3"
                    onSubmit={handleUpdate}
                  >
                    <label className="block">
                      <span className="mb-1 block">Full name</span>
                      <input
                        className="w-full rounded border p-2"
                        name="fullName"
                        defaultValue={customer.full_name}
                        maxLength={120}
                        required
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1 block">WhatsApp phone</span>
                      <input
                        className="w-full rounded border p-2"
                        name="phone"
                        type="tel"
                        defaultValue={customer.phone_e164}
                        pattern="^\+[1-9][0-9]{1,14}$"
                        maxLength={16}
                        required
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1 block">Email (optional)</span>
                      <input
                        className="w-full rounded border p-2"
                        name="email"
                        type="email"
                        defaultValue={customer.email ?? ""}
                      />
                    </label>

                    <div className="flex gap-3">
                      <button
                        className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
                        type="submit"
                        disabled={busy}
                      >
                        Save changes
                      </button>
                      <button
                        className="rounded border px-3 py-2"
                        type="button"
                        onClick={() => setEditingCustomer(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <p className="font-medium">{customer.full_name}</p>
                    <p className="text-sm text-gray-600">
                      {customer.phone_e164}
                    </p>
                    {customer.email && (
                      <p className="text-sm text-gray-600">{customer.email}</p>
                    )}

                    <div className="mt-3">
                      <p className="mb-2 text-sm font-medium">Tags</p>

                      <div className="flex flex-wrap gap-2">
                        {customerTags
                          .filter((item) => item.customer_id === customer.id)
                          .map((item) => {
                            const tag = initialTags.find(
                              (availableTag) => availableTag.id === item.tag_id,
                            );

                            if (!tag) return null;

                            return (
                              <span
                                className="flex items-center gap-2 rounded-full border px-3 py-1 text-sm"
                                key={item.tag_id}
                              >
                                {tag.name}
                                <button
                                  className="text-red-700 disabled:opacity-50"
                                  type="button"
                                  disabled={busy}
                                  aria-label={`${tag.name} tag সরাও`}
                                  onClick={() =>
                                    handleRemoveTag(customer.id, tag.id)
                                  }
                                >
                                  ×
                                </button>
                              </span>
                            );
                          })}
                      </div>

                      {initialTags.length === 0 ? (
                        <p className="mt-2 text-sm text-gray-600">
                          আগে Tags পেজে অন্তত একটি tag তৈরি করো।
                        </p>
                      ) : (
                        <select
                          className="mt-3 rounded border p-2"
                          value=""
                          disabled={busy}
                          aria-label={`${customer.full_name}-এর জন্য tag বেছে নাও`}
                          onChange={(event) => {
                            const tagId = event.target.value;
                            if (tagId) {
                              void handleAddTag(customer.id, tagId);
                            }
                          }}
                        >
                          <option value="">Tag যুক্ত করো…</option>
                          {initialTags
                            .filter(
                              (tag) =>
                                !customerTags.some(
                                  (item) =>
                                    item.customer_id === customer.id &&
                                    item.tag_id === tag.id,
                                ),
                            )
                            .map((tag) => (
                              <option key={tag.id} value={tag.id}>
                                {tag.name}
                              </option>
                            ))}
                        </select>
                      )}
                    </div>

                    <div className="mt-3 flex gap-3"></div>

                    <div className="mt-3 flex gap-3">
                      <button
                        className="rounded border px-3 py-1"
                        type="button"
                        onClick={() => setEditingCustomer(customer)}
                      >
                        Edit
                      </button>
                      <button
                        className="rounded border px-3 py-1 text-red-700"
                        type="button"
                        disabled={busy}
                        onClick={() => handleDelete(customer)}
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {message && <p className="mt-4">{message}</p>}
    </>
  );
}
