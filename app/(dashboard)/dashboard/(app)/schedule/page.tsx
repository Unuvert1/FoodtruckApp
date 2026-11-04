import { materializeScheduleRules } from "@/lib/schedule/materialize";
import { getLatestServiceDefaults, getScheduleRules, getScheduleServices, getVendorLocations, requireTruckAccess } from "@/lib/tenant";
import { addDaysToDateKey, toZonedTimeInput, zonedDateKey } from "@/lib/time";
import type { RuleDraft, StopDraft } from "@/lib/types";
import { ScheduleScreen } from "@/components/dashboard/schedule/schedule-screen";

export const dynamic = "force-dynamic";
export const metadata = { title: "Schedule" };

export default async function SchedulePage() {
  const { truck } = await requireTruckAccess();
  const now = new Date();

  // Fill in any repeating stops that have come due. The daily cron does this
  // too; doing it here as well means a vendor never opens Schedule and finds a
  // gap because a scheduled run was missed. Safe to repeat: see materialize.ts.
  await materializeScheduleRules(truck.id, truck.timezone, now);

  const [rows, rules, spots, latest] = await Promise.all([
    getScheduleServices(truck.id, now),
    getScheduleRules(truck.id),
    getVendorLocations(truck.id),
    getLatestServiceDefaults(truck.id),
  ]);

  // A new stop starts from the last one: same spot, hours and slots, tomorrow.
  const newDraft: StopDraft = {
    locationId: latest?.locationId ?? null,
    date: addDaysToDateKey(zonedDateKey(now, truck.timezone), 1),
    startTime: latest ? toZonedTimeInput(latest.startsAt, truck.timezone) : "11:00",
    endTime: latest ? toZonedTimeInput(latest.endsAt, truck.timezone) : "14:00",
    opensHoursBefore: latest?.opensHoursBefore ?? 0,
    closesMinutesBefore: latest?.closesMinutesBefore ?? 30,
    slotMinutes: latest?.slotMinutes ?? 15,
    ordersPerSlot: latest?.ordersPerSlot ?? 6,
    publicNote: "",
  };

  // And a new rule starts from the same place, on the weekday the last stop ran.
  const newRuleDraft: RuleDraft = {
    locationId: latest?.locationId ?? "",
    weekdays: [],
    startTime: newDraft.startTime,
    endTime: newDraft.endTime,
    opensHoursBefore: newDraft.opensHoursBefore,
    closesMinutesBefore: newDraft.closesMinutesBefore,
    slotMinutes: newDraft.slotMinutes,
    ordersPerSlot: newDraft.ordersPerSlot,
    publicNote: "",
  };

  return (
    <main className="mx-auto max-w-3xl px-4 pt-6 pb-16">
      <ScheduleScreen
        rows={rows}
        rules={rules}
        spots={spots}
        timeZone={truck.timezone}
        newDraft={newDraft}
        newRuleDraft={newRuleDraft}
        nowIso={now.toISOString()}
      />
    </main>
  );
}
