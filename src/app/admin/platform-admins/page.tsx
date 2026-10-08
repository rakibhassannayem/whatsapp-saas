import PlatformAdminAdminsManager from "@/components/platform-admin/platform-admin-admins-manager";
import PlatformAdminDataNotice from "@/components/platform-admin/platform-admin-data-notice";
import { getPlatformAdminAccounts } from "@/lib/supabase/platform-admin-data";

export default async function PlatformAdminsPage() {
  const result = await getPlatformAdminAccounts();
  if (result.status !== "authorized") return <PlatformAdminDataNotice />;

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
        Access control
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
        Platform admins
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
        Invite a new administrator without asking them to use public signup, or grant admin access to an existing account.
      </p>
      <PlatformAdminAdminsManager
        currentUserId={result.currentUserId}
        initialAccounts={result.accounts}
      />
    </div>
  );
}
