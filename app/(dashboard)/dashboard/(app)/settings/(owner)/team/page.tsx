import { Section } from "@/components/dashboard/settings/section";
import { TeamList } from "@/components/dashboard/settings/team-list";
import { getPendingInvites, getTeam, requireTruckAccess } from "@/lib/tenant";

export const metadata = { title: "Team · Settings" };

export default async function TeamPage() {
  const { truck, role, userId } = await requireTruckAccess();

  if (role !== "OWNER") {
    return (
      <Section title="Team">
        <p className="px-5 py-6 text-sm text-muted-foreground">Only owners can manage the team.</p>
      </Section>
    );
  }

  const [members, invites] = await Promise.all([getTeam(truck.id), getPendingInvites(truck.id, new Date())]);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return <TeamList members={members} invites={invites} currentUserId={userId} timezone={truck.timezone} appUrl={appUrl} />;
}
