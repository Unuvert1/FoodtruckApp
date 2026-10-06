import { Section } from "@/components/dashboard/settings/section";
import { TeamList } from "@/components/dashboard/settings/team-list";
import { getTeam, requireTruckAccess } from "@/lib/tenant";

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

  const members = await getTeam(truck.id);
  return <TeamList members={members} currentUserId={userId} timezone={truck.timezone} />;
}
