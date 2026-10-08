export default function PlatformAdminDataNotice({
  title = "Admin data এখন লোড করা যাচ্ছে না",
  description = "Supabase schema, platform-admin migration এবং server environment configuration পরীক্ষা করো।",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
      <p className="text-sm font-semibold text-amber-950">{title}</p>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-amber-900/75">
        {description}
      </p>
    </section>
  );
}
