import PlatformAdminPasswordSetup from "@/components/platform-admin/platform-admin-password-setup";

export default function PlatformAdminSetupPage() {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
        Invitation accepted
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
        Finish admin setup
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
        Create your password to use the separate platform-admin login.
      </p>
      <PlatformAdminPasswordSetup />
    </div>
  );
}
