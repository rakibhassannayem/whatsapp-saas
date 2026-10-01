import Link from "next/link";
import type { ReactNode } from "react";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <Link className="text-lg font-semibold" href="/dashboard">
            WhatsApp SaaS
          </Link>

          <nav
            className="flex flex-wrap gap-2"
            aria-label="Dashboard navigation"
          >
            <Link
              className="rounded-md px-3 py-2 text-sm hover:bg-gray-100"
              href="/dashboard"
            >
              Dashboard
            </Link>

            <Link
              className="rounded-md px-3 py-2 text-sm hover:bg-gray-100"
              href="/dashboard/customers"
            >
              Customers
            </Link>

            <Link
              className="rounded-md px-3 py-2 text-sm hover:bg-gray-100"
              href="/dashboard/tags"
            >
              Tags
            </Link>

            <Link
              className="rounded-md px-3 py-2 text-sm hover:bg-gray-100"
              href="/dashboard/templates"
            >
              Templates
            </Link>

            <Link
              className="rounded-md px-3 py-2 text-sm hover:bg-gray-100"
              href="/dashboard/campaigns"
            >
              Campaigns
            </Link>
          </nav>
        </div>
      </header>

      {children}
    </div>
  );
}
