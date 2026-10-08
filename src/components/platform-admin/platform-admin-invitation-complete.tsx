"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, ShieldCheck } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin-client";

export default function PlatformAdminInvitationComplete() {
  const router = useRouter();
  const started = useRef(false);
  const [message, setMessage] = useState("Verifying your invitation…");
  const [error, setError] = useState("");

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    async function finishInvitation() {
      const query = new URLSearchParams(window.location.search);
      const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const accessToken = fragment.get("access_token") ?? query.get("access_token");
      const refreshToken = fragment.get("refresh_token") ?? query.get("refresh_token");
      const tokenHash = query.get("token_hash");
      const type = query.get("type");
      const destination = query.get("next") === "/admin/setup" ? "/admin/setup" : "/admin";

      // Remove one-time credentials from the address bar before making requests.
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);

      const supabase = createAdminClient();
      let authError: Error | null = null;

      if (accessToken && refreshToken) {
        const result = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        authError = result.error;
      } else if (tokenHash && type === "invite") {
        const result = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: "invite",
        });
        authError = result.error;
      } else {
        const result = await supabase.auth.getSession();
        authError = result.error;
        if (!result.data.session && !authError) {
          authError = new Error("No invitation session was found.");
        }
      }

      if (authError) {
        setError("This invitation link is invalid, expired, or has already been used. Ask an admin to send a new invitation.");
        return;
      }

      const { data: isPlatformAdmin, error: roleError } = await supabase.rpc("is_platform_admin");
      if (roleError || isPlatformAdmin !== true) {
        await supabase.auth.signOut();
        setError("The invitation was verified, but this account is not on the platform-admin allowlist. Ask an existing admin to grant access again.");
        return;
      }

      setMessage("Invitation accepted. Redirecting to password setup…");
      router.replace(destination);
      router.refresh();
    }

    void finishInvitation();
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#07120f] px-5 py-12 text-white">
      <section className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#0d1b17] p-8 shadow-2xl">
        <span className="flex size-12 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
          <ShieldCheck className="size-5" />
        </span>
        <h1 className="mt-5 text-2xl font-semibold">Platform admin invitation</h1>
        {error ? (
          <p className="mt-3 rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm leading-6 text-rose-200" role="alert">
            {error}
          </p>
        ) : (
          <p className="mt-3 flex items-center gap-2 text-sm leading-6 text-slate-300" role="status">
            <LoaderCircle className="size-4 animate-spin" />{message}
          </p>
        )}
      </section>
    </main>
  );
}
