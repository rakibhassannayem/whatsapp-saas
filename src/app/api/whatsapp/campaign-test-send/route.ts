import { NextResponse } from "next/server";
import { getDashboardContext, readJson } from "@/lib/supabase/dashboard-api";
import { getBusinessCampaign } from "@/lib/db/campaign-queries";

type TestSendRequestBody = Record<string, unknown> & {
  campaignId?: string;
};

export async function POST(request: Request) {
  // ১. ইউজার অথেন্টিকেশন ও বিজনেস প্রোফাইল যাচাই
  const context = await getDashboardContext();
  if ("response" in context) {
    return context.response;
  }
  const { business } = context;

  // ২. রিকোয়েস্ট বডি থেকে campaignId রিড করা
  const bodyResult = await readJson<TestSendRequestBody>(request);
  if ("response" in bodyResult) {
    return bodyResult.response;
  }

  const { campaignId } = bodyResult.data;
  if (!campaignId || typeof campaignId !== "string") {
    return NextResponse.json(
      { error: "Campaign ID প্রদান করা আবশ্যক।" },
      { status: 400 },
    );
  }

  // ৩. ক্যাম্পেইনটি এই ইউজারের বিজনেসের কি না যাচাই
  let campaign;
  try {
    campaign = await getBusinessCampaign(business.id, campaignId);
  } catch {
    return NextResponse.json(
      { error: "ক্যাম্পেইনের তথ্য লোড করা যায়নি।" },
      { status: 500 },
    );
  }

  if (!campaign) {
    return NextResponse.json(
      { error: "ক্যাম্পেইন খুঁজে পাওয়া যায়নি বা আপনার অনুমতি নেই।" },
      { status: 404 },
    );
  }

  // ৪. এনভায়রনমেন্ট ভ্যারিয়েবল যাচাই (সার্ভার-সাইড ভেরিফায়েড টেস্ট রেসিপিয়েন্ট)
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const apiVersion = process.env.WHATSAPP_API_VERSION;
  const testRecipient = process.env.WHATSAPP_TEST_RECIPIENT;

  if (!accessToken || !phoneNumberId || !apiVersion || !testRecipient) {
    return NextResponse.json(
      { error: ".env.local ফাইলে WhatsApp API-এর কনফিগারেশন অসম্পূর্ণ।" },
      { status: 500 },
    );
  }

  // ৫. Meta Graph API-তে অনুমোদিত hello_world টেমপ্লেট দিয়ে টেস্ট রিকোয়েস্ট পাঠানো
  try {
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
          to: testRecipient,
          type: "template",
          template: {
            name: "hello_world",
            language: { code: "en_US" },
          },
        }),
        cache: "no-store",
      },
    );

    const result = await response.json();

    if (!response.ok) {
      const details = result.error?.error_data?.details;
      const errorMessage = details
        ? `${result.error?.message ?? "Meta error"} — ${details}`
        : (result.error?.message ?? "Meta থেকে WhatsApp মেসেজ পাঠানো সম্ভব হয়নি।");

      return NextResponse.json(
        { error: errorMessage },
        { status: response.status },
      );
    }

    return NextResponse.json({
      success: true,
      campaignName: campaign.name,
      messageId: result.messages?.[0]?.id,
    });
  } catch {
    return NextResponse.json(
      { error: "Meta সার্ভারের সাথে সংযোগ করতে সমস্যা হয়েছে।" },
      { status: 500 },
    );
  }
}
