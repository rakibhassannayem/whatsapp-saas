import { redirect } from "next/navigation";
import OnboardingPage from "@/components/onboarding/onboarding-page";
import { auth } from "@/auth";

export default async function OnboardingRoute() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return <OnboardingPage />;
}
