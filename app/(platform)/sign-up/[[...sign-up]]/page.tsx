import { SignUp } from "@clerk/nextjs";
import { AuthShell } from "@/components/platform/auth-shell";

export const metadata = { title: "Get started with FoodtruckApp" };

export default function SignUpPage() {
  return (
    <AuthShell>
      <SignUp forceRedirectUrl="/dashboard" signInUrl="/sign-in" />
    </AuthShell>
  );
}
