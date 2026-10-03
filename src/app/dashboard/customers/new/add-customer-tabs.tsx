"use client";

import { useState } from "react";
import { FileSpreadsheet, UserPlus } from "lucide-react";
import { cn } from "cn";
import AddCustomerForm from "./add-customer-form";
import CustomerImporter from "../import/customer-import";

const TABS = [
  { id: "single", label: "Single customer", icon: UserPlus },
  { id: "import", label: "Import Excel / CSV", icon: FileSpreadsheet },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function AddCustomerTabs({
  defaultTab = "single",
  tags = [],
}: {
  defaultTab?: TabId;
  tags?: { id: string; name: string }[];
}) {
  const [tab, setTab] = useState<TabId>(defaultTab);

  return (
    <div className="mt-6 max-w-2xl">
      <div
        role="tablist"
        aria-label="Add customers"
        className="inline-flex rounded-full border border-slate-200 bg-slate-100 p-1"
      >
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[12px] font-bold transition",
              tab === id
                ? "bg-white text-emerald-800 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            )}
          >
            <Icon className="size-3.5" />
            {label}
          </button>
        ))}
      </div>

      <div role="tabpanel" className="mt-4">
        {tab === "single" ? (
          <div className="max-w-xl">
            <AddCustomerForm />
          </div>
        ) : (
          <CustomerImporter compact initialTags={tags} />
        )}
      </div>
    </div>
  );
}
