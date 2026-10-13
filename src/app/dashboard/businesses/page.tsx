import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import PageHeader from "@/components/dashboard/page-header";
import BusinessesManager from "@/components/dashboard/businesses/businesses-manager";
import { auth } from "@/auth";
import {
  getActiveDashboardBusiness,
  getDashboardBusinesses,
} from "@/lib/dashboard-business";

export default async function BusinessesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { data: businesses, error } = await getDashboardBusinesses(session.user.id);
  if (error) {
    return (
      <div>
        <PageHeader title="My businesses" />
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          Could not load businesses: {error.message}
        </p>
      </div>
    );
  }

  const availableBusinesses = businesses ?? [];
  const activeBusiness = await getActiveDashboardBusiness(availableBusinesses);

  return (
    <div>
      <PageHeader
        title="My businesses"
        subtitle="View and manage the business workspaces connected to your account."
        actions={
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-600"
          >
            <Plus className="size-4" />
            Add business
          </Link>
        }
      />
      <BusinessesManager
        initialBusinesses={availableBusinesses}
        activeBusinessId={activeBusiness?.id ?? null}
      />
    </div>
  );
}
