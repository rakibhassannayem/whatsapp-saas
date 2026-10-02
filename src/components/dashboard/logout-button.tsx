"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { dashboardApiRequest } from "@/lib/dashboard-api";

export default function LogoutButton() {
  const router = useRouter();
  const [message, setMessage] = useState("");

  async function handleLogout() {
    const { error } = await dashboardApiRequest<{ success: boolean }>(
      "/api/dashboard/logout",
      { method: "POST" },
    );

    if (error) {
      setMessage(error);
      return;
    }

    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="mt-6">
      <button className="rounded border px-4 py-2" onClick={handleLogout}>
        Log out
      </button>

      {message && <p className="mt-3">{message}</p>}
    </div>
  );
}
