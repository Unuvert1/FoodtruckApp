import { Button } from "@/components/ui/button";

export type SaveState = { ok: true; note?: string } | { ok: false; error: string } | null;

/** Save button plus the result line. Disabled until something changed, so Save never lies. */
export function SaveRow({
  dirty,
  pending,
  result,
  successText = "Saved.",
  label = "Save changes",
}: {
  dirty: boolean;
  pending: boolean;
  result: SaveState;
  successText?: string;
  label?: string;
}) {
  return (
    <div className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-end">
      {result && (
        <p role="status" className={result.ok ? "text-sm text-ok md:mr-auto" : "text-sm font-medium text-destructive md:mr-auto"}>
          {result.ok ? (result.note ?? successText) : result.error}
        </p>
      )}
      <Button type="submit" disabled={!dirty || pending} className="h-12 rounded-xl px-6 text-base font-semibold">
        {pending ? "Saving…" : label}
      </Button>
    </div>
  );
}
