import { ClerkProvider } from "@clerk/nextjs";

/**
 * Clerk, styled to match the platform. Only the platform pages and the
 * dashboard are wrapped, so customer storefronts don't load Clerk at all.
 */
export function PlatformClerkProvider({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#1D2733",
          colorBackground: "#FFFFFF",
          fontFamily: "var(--font-body)",
          borderRadius: "0.75rem",
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}
