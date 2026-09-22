import { PlatformClerkProvider } from "@/components/clerk-provider";

export const metadata = { title: "Dashboard", robots: { index: false } };

export default function DashboardRootLayout({ children }: { children: React.ReactNode }) {
  return <PlatformClerkProvider>{children}</PlatformClerkProvider>;
}
