import PlatformAdminSidebar from "@/components/platform-admin/platform-admin-sidebar";

export default function PlatformAdminShell({
  email,
  children,
}: {
  email: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f5f7f8]">
      <PlatformAdminSidebar email={email} />
      <div className="min-w-0 lg:pl-[264px]">
        <main className="mx-auto min-h-screen max-w-[1500px] px-4 py-6 sm:px-7 sm:py-8 lg:px-9">
          {children}
        </main>
      </div>
    </div>
  );
}
