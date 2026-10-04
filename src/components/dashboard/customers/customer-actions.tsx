"use client";

import { useState } from "react";
import { dashboardApiRequest } from "@/lib/dashboard-api";
import type { Customer, CustomerTag, Tag } from "./customer-types";
import CustomerEditForm from "./customer-edit-form";

export function useCustomerActions(
  initialCustomers: Customer[],
  initialCustomerTags: CustomerTag[]
) {
  const [customers, setCustomers] = useState(initialCustomers);
  const [customerTags, setCustomerTags] = useState(initialCustomerTags);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [busy, setBusy] = useState(false);

  function notify(text: string, error = false) {
    setMessage(text);
    setIsError(error);
  }

  async function handleDelete(customer: Customer) {
    const confirmed = window.confirm(`Remove ${customer.full_name} from the customer list?`);
    if (!confirmed) return;
    notify("");
    setBusy(true);
    const { error } = await dashboardApiRequest<{ success: boolean }>(
      "/api/dashboard/customers",
      { method: "DELETE", body: { id: customer.id } }
    );
    setBusy(false);
    if (error) {
      notify(error, true);
      return;
    }
    setCustomers((current) => current.filter((item) => item.id !== customer.id));
    notify("Customer deleted.");
  }

  async function handleAddTag(customerId: string, tagId: string) {
    notify("");
    setBusy(true);
    const { error } = await dashboardApiRequest<{ success: boolean }>(
      "/api/dashboard/customers/tags",
      { method: "POST", body: { customerId, tagId } }
    );
    setBusy(false);
    if (error) {
      notify(error, true);
      return;
    }
    setCustomerTags((current) => [...current, { customer_id: customerId, tag_id: tagId }]);
    notify("Tag added to customer.");
  }

  async function handleRemoveTag(customerId: string, tagId: string) {
    notify("");
    setBusy(true);
    const { error } = await dashboardApiRequest<{ success: boolean }>(
      "/api/dashboard/customers/tags",
      { method: "DELETE", body: { customerId, tagId } }
    );
    setBusy(false);
    if (error) {
      notify(error, true);
      return;
    }
    setCustomerTags((current) =>
      current.filter((item) => !(item.customer_id === customerId && item.tag_id === tagId))
    );
    notify("Tag removed from customer.");
  }

  return {
    customers,
    customerTags,
    editingCustomer,
    setEditingCustomer,
    message,
    isError,
    busy,
    setBusy,
    notify,
    handleDelete,
    handleAddTag,
    handleRemoveTag,
  };
}

export type { Customer, Tag, CustomerTag };
export { CustomerEditForm };
