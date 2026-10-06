// Placeholder. The real screen (saved spots, address autocomplete, publishing a
// stop, "repeat last week") is specced in scratchpad/spec-stops-maps.md.
export const metadata = { title: "Schedule" };

export default function SchedulePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 pt-6 pb-16">
      <h1 className="text-[2rem] leading-none font-semibold tracking-[-0.03em]">Schedule</h1>
      <p className="mt-2 text-[0.9375rem] text-muted-foreground">
        Where the truck will be, and when customers can order ahead.
      </p>
      <p className="mt-8 rounded-2xl bg-surface px-4 py-6 text-center text-sm text-muted-foreground">
        Being built now.
      </p>
    </main>
  );
}
