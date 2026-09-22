// Short order numbers a vendor can shout across a sidewalk: A01…A99, then
// B01…, skipping letters that are easy to mishear or misread (I, O).
const LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ";

/** The nth order of a service (1-based) → "A01". */
export function formatOrderNumber(n: number): string {
  const index = n - 1;
  const letter = LETTERS[Math.floor(index / 99) % LETTERS.length];
  return `${letter}${String((index % 99) + 1).padStart(2, "0")}`;
}
