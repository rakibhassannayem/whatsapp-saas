"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();
  const [message, setMessage] = useState("");

  async function handleLogout() {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      setMessage(error.message);
      return;
    }

    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="mt-6">
      <button
        className="rounded border px-4 py-2"
        onClick={handleLogout}
      >
        Log out
      </button>

      {message && <p className="mt-3">{message}</p>}
    </div>
  );
}