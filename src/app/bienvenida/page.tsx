import { redirect } from "next/navigation";
import { getSettings } from "@/lib/queries";
import { OnboardingWizard } from "@/components/onboarding-wizard";

export const dynamic = "force-dynamic";

export default function WelcomePage() {
  const settings = getSettings();
  if (settings.onboarded) redirect("/");
  return (
    <div className="min-h-dvh flex items-center justify-center p-4">
      <OnboardingWizard initialHue={Number(settings.brand_hue) || 221} />
    </div>
  );
}
