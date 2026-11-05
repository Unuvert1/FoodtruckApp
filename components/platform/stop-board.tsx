// The product's whole idea as one object: a truck's week, each stop with its
// own ordering window. It leads the home page instead of being described,
// which is also what fills the right half of the hero.

const WEEK = [
  { day: "Tue", place: "Riverside Brewing Co.", hours: "5–9 pm", state: "Taking orders", live: true },
  { day: "Wed", place: "Halsted Office Park", hours: "11 am–2 pm", state: "Preorders open" },
  { day: "Fri", place: "Lakeview Night Market", hours: "5–10 pm", state: "Opens Thu 9 am" },
  { day: "Sat", place: "Northfield Farmers Market", hours: "9 am–1 pm", state: "Opens Fri 5 pm" },
];

export function StopBoard() {
  return (
    <div className="overflow-hidden rounded-[1.75rem] bg-foreground text-background shadow-[0_24px_60px_-28px_rgba(29,39,51,0.55)]">
      <div className="flex items-center justify-between gap-4 border-b border-background/15 px-5 py-4 sm:px-6">
        <p className="font-display text-xl leading-none font-bold tracking-tight sm:text-2xl">This week&apos;s stops</p>
        <p className="text-xs text-background/55 sm:text-sm">Ranger Truck</p>
      </div>

      <ul className="divide-y divide-background/12">
        {WEEK.map((stop) => (
          <li key={stop.day} className="flex items-baseline gap-4 px-5 py-3.5 sm:px-6 sm:py-4">
            <span className="w-9 shrink-0 font-display text-xl font-bold text-signal sm:text-2xl">{stop.day}</span>

            <span className="min-w-0 flex-1">
              <span className="block truncate font-display text-[1.375rem] leading-tight font-semibold sm:text-2xl">
                {stop.place}
              </span>
              <span className="mt-0.5 block text-[0.8125rem] text-background/60 tabular-nums sm:text-sm">
                {stop.hours}
              </span>
            </span>

            <span
              className={`shrink-0 text-right text-[0.8125rem] font-semibold sm:text-sm ${
                stop.live ? "text-signal" : "text-background/55"
              }`}
            >
              {stop.live && (
                <span aria-hidden className="relative mr-1.5 inline-flex size-1.5 align-middle">
                  <span className="absolute inset-0 animate-ping rounded-full bg-signal opacity-70 motion-reduce:animate-none" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-signal" />
                </span>
              )}
              {stop.state}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
