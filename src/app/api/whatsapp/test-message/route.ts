import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "লগইন করতে হবে।" }, { status: 401 });
  }

  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const apiVersion = process.env.WHATSAPP_API_VERSION;
  const recipient = process.env.WHATSAPP_TEST_RECIPIENT;

  if (!accessToken || !phoneNumberId || !apiVersion || !recipient) {
    return NextResponse.json(
      { error: ".env.local-এ WhatsApp-এর সব variable দেওয়া হয়নি।" },
      { status: 500 },
    );
  }

  const response = await fetch(
    `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: recipient,
        type: "template",
        template: {
          name: "hello_world",
          language: { code: "en_US" },
          // components: [
          //   {
          //     type: "body",
          //     parameters: [{ type: "text", text: "John Doe" }],
          //   },
          // ],
        },
      }),
      cache: "no-store",
    },
  );

  const result = await response.json();

  if (!response.ok) {
    return NextResponse.json(
      { error: result.error?.message ?? "Meta থেকে message পাঠানো যায়নি।" },
      { status: response.status },
    );
  }

  return NextResponse.json({ success: true, result });
}