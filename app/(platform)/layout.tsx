import { PlatformClerkProvider } from "@/components/clerk-provider";

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return <PlatformClerkProvider>{children}</PlatformClerkProvider>;
}
