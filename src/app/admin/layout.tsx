import PlatformAdminAccessScreen from "@/components/platform-admin/platform-admin-access-screen";
import PlatformAdminShell from "@/components/platform-admin/platform-admin-shell";
import { getPlatformAdminContext } from "@/lib/supabase/platform-admin";

export default async function PlatformAdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const context = await getPlatformAdminContext();

  if (context.status === "unauthenticated") {
    return <PlatformAdminAccessScreen mode="login" />;
  }
  if (context.status === "not-admin") {
    return <PlatformAdminAccessScreen mode="denied" />;
  }

  if (context.status === "unavailable") {
    return <PlatformAdminAccessScreen mode="unavailable" />;
  }

  return <PlatformAdminShell email={context.user.email}>{children}</PlatformAdminShell>;
}
