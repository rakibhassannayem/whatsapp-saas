"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function WhatsAppTestButton() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function sendTestMessage() {
    setBusy(true);
    setMessage("");

    try {
      const response = await fetch("/api/whatsapp/test-message", {
        method: "POST",
      });
      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Message পাঠানো যায়নি।");
        return;
      }

      setMessage("Test message পাঠানো হয়েছে। WhatsApp-এ দেখে নাও।");
    } catch {
      setMessage("Request পাঠাতে সমস্যা হয়েছে। আবার চেষ্টা করো।");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button onClick={sendTestMessage} disabled={busy}>
        {busy ? "পাঠানো হচ্ছে..." : "Send test message"}
      </Button>

      {message && (
        <p className="text-sm" role="status">
          {message}
        </p>
      )}
    </div>
  );
}