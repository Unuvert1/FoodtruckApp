import { Wordmark } from "@/components/platform/wordmark";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center px-4 py-8">
      <Wordmark className="mb-8 self-start sm:self-center" />
      {children}
    </main>
  );
}
