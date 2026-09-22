import { SignIn } from "@clerk/nextjs";
import { AuthShell } from "@/components/platform/auth-shell";

export const metadata = { title: "Log in to FoodtruckApp" };

export default function SignInPage() {
  return (
    <AuthShell>
      <SignIn forceRedirectUrl="/dashboard" signUpUrl="/sign-up" />
    </AuthShell>
  );
}
