// Short order numbers a vendor can shout across a sidewalk: A01…A99, then
// B01…, skipping letters that are easy to mishear or misread (I, O).
const LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ";

/** The nth order of a service (1-based) → "A01". */
export function formatOrderNumber(n: number): string {
  const index = n - 1;
  const letter = LETTERS[Math.floor(index / 99) % LETTERS.length];
  return `${letter}${String((index % 99) + 1).padStart(2, "0")}`;
}

/**
 * The nth counter sale of a truck (1-based) → "C-1".
 *
 * The hyphen is the point. A counter sale is numbered per truck, a web order
 * per service, so the two sequences run side by side and would collide if they
 * shared a shape: formatOrderNumber reaches "C" at the 199th order of a stop.
 */
export function formatCounterNumber(n: number): string {
  return `C-${n}`;
}
