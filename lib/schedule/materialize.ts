// Turns standing commitments into real stops.
//
// Orders and pickup slots hang off a Service row, so a rule cannot stay an
// abstraction: something has to write the Tuesdays out. This is that something.
// It runs from the daily cron and again whenever a vendor opens Schedule, which
// is why it has to be cheap and safe to run twice.
//
// Safe to run twice because of the unique pair (Service.ruleId, ruleDateKey):
// a date the rule has already covered is skipped, whatever became of that stop
// afterwards. Cancel one Tuesday and it stays cancelled; edit one and the edit
// stands.

import "server-only";
import { resolveOrderingWindow } from "@/lib/schedule/ordering-window";
import { RULE_HORIZON_DAYS, ruleDates, ruleTimes } from "@/lib/schedule/rules";
import { generateSlots } from "@/lib/schedule/slots";
import {
  createRuleStop,
  getActiveScheduleRules,
  getDefaultMenuIdForTruck,
  getRuleDateKeys,
} from "@/lib/tenant";
import { zonedDateKey } from "@/lib/time";

/** How many stops were created. Zero is the normal, boring answer. */
export async function materializeScheduleRules(truckId: string, timeZone: string, now: Date): Promise<number> {
  const rules = await getActiveScheduleRules(truckId);
  if (rules.length === 0) return 0;

  const menuId = await getDefaultMenuIdForTruck(truckId);
  if (!menuId) return 0; // nothing to sell yet; the vendor is still setting up

  const today = zonedDateKey(now, timeZone);
  let created = 0;

  for (const rule of rules) {
    const covered = new Set(await getRuleDateKeys(truckId, rule.id, today));

    for (const dateKey of ruleDates(rule, timeZone, now, RULE_HORIZON_DAYS)) {
      if (covered.has(dateKey)) continue;

      const { startsAt, endsAt } = ruleTimes(rule, timeZone, dateKey);
      // Today's stop may already be over by the time a rule is switched on.
      if (endsAt <= now) continue;

      const window = resolveOrderingWindow({
        startsAt,
        endsAt,
        opensHoursBefore: rule.opensHoursBefore,
        closesMinutesBefore: rule.closesMinutesBefore,
        now,
      });
      if ("error" in window) continue; // a rule should never produce one, but never crash a page load over it

      const slots = generateSlots(startsAt, endsAt, rule.slotMinutes, rule.ordersPerSlot);
      const ok = await createRuleStop(
        truckId,
        rule.id,
        dateKey,
        {
          locationId: rule.locationId,
          menuId,
          startsAt,
          endsAt,
          orderingOpensAt: window.opensAt,
          orderingClosesAt: window.closesAt,
          slotMinutes: rule.slotMinutes,
          ordersPerSlot: rule.ordersPerSlot,
          publicNote: rule.publicNote,
          // Published, not draft: the whole point of a rule is that nobody has
          // to touch it again. A single day can still be cancelled by hand.
          status: "PUBLISHED",
        },
        slots
      );
      if (ok) created++;
    }
  }

  return created;
}
