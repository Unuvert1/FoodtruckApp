import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/platform/auth-shell";
import { Button, buttonVariants } from "@/components/ui/button";
import { getUserId } from "@/lib/dev-auth";
import { isWellFormedToken } from "@/lib/invites";
import { getInviteByToken, getMembership } from "@/lib/tenant";
import { acceptInviteAction } from "./actions";

// The token is a credential: keep it out of search indexes and Referer headers.
export const metadata = { title: "Team invite", robots: { index: false, follow: false }, referrer: "no-referrer" as const };

// Dead links say nothing about which truck they were for.
const DEAD: Record<string, { title: string; body: string }> = {
  unknown: { title: "This invite link isn't valid", body: "Check that you copied the whole link, or ask the truck owner for a new invite." },
  expired: { title: "This invite has expired", body: "Invites work for 7 days. Ask the truck owner to send you a new one." },
  accepted: { title: "This invite was already used", body: "If that was you, sign in to open the dashboard. Otherwise ask the owner for a new invite." },
  revoked: { title: "This invite was cancelled", body: "The truck owner withdrew it. Ask them if you think that's a mistake." },
};

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invite = isWellFormedToken(token) ? await getInviteByToken(token, new Date()) : null;

  const dead = !invite ? DEAD.unknown : invite.state === "valid" ? null : DEAD[invite.state];
  if (dead) {
    return (
      <Card title={dead.title}>
        <p className="mt-2 text-muted-foreground">{dead.body}</p>
        <LinkButton href="/dashboard">Go to the dashboard</LinkButton>
      </Card>
    );
  }
  if (!invite) return null; // unreachable: `dead` covers it; narrows the type

  const userId = await getUserId();
  // Signed out: sign in (or up), then Clerk sends them straight back here.
  if (!userId) redirect(`/sign-in?redirect_url=${encodeURIComponent(`/invite/${token}`)}`);

  if (invite.truckId && (await getMembership(invite.truckId, userId))) {
    return (
      <Card title={`You're already on ${invite.truckName}`}>
        <p className="mt-2 text-muted-foreground">This invite isn&apos;t needed. You can already open the dashboard.</p>
        <LinkButton href="/dashboard">Open the dashboard</LinkButton>
      </Card>
    );
  }

  return (
    <Card title={`Join ${invite.truckName}`}>
      <p className="mt-2 text-muted-foreground">You&apos;ve been invited as {invite.role === "OWNER" ? "an owner" : "staff"}.</p>
      <form action={acceptInviteAction} className="mt-6">
        <input type="hidden" name="token" value={token} />
        <Button type="submit" className="h-12 rounded-xl px-6 text-base font-semibold">
          Accept invite
        </Button>
      </form>
    </Card>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <AuthShell>
      <section className="w-full max-w-md rounded-2xl bg-surface p-6">
        <h1 className="text-[1.75rem] leading-tight font-semibold tracking-[-0.03em]">{title}</h1>
        {children}
      </section>
    </AuthShell>
  );
}

function LinkButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className={`${buttonVariants()} mt-6 h-12 rounded-xl px-6 text-base font-semibold`}>
      {children}
    </Link>
  );
}
