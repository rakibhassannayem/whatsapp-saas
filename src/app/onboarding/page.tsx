import { redirect } from "next/navigation";
import OnboardingPage from "@/components/onboarding/onboarding-page";
import { createClient } from "@/lib/supabase/server";

export default async function OnboardingRoute() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  return <OnboardingPage />;
}
