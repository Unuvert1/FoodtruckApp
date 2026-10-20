import { getLatestServiceDefaults, getScheduleServices, getVendorLocations, requireTruckAccess } from "@/lib/tenant";
import { addDaysToDateKey, toZonedTimeInput, zonedDateKey } from "@/lib/time";
import type { StopDraft } from "@/lib/types";
import { ScheduleScreen } from "@/components/dashboard/schedule/schedule-screen";

export const dynamic = "force-dynamic";
export const metadata = { title: "Schedule" };

export default async function SchedulePage() {
  const { truck } = await requireTruckAccess();
  const now = new Date();
  const [rows, spots, latest] = await Promise.all([
    getScheduleServices(truck.id, now),
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

  return (
    <main className="mx-auto max-w-3xl px-4 pt-6 pb-16">
      <ScheduleScreen rows={rows} spots={spots} timeZone={truck.timezone} newDraft={newDraft} nowIso={now.toISOString()} />
    </main>
  );
}
