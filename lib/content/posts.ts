// The writing on the marketing site. A typed array rather than MDX: three posts
// do not justify a content pipeline, and every dependency added here is one
// more row in the security scan.

export type Block = { type: "p"; text: string } | { type: "h2"; text: string } | { type: "list"; items: string[] };

export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  /** ISO date, used for <time> and sorting. */
  date: string;
  readingMinutes: number;
  body: Block[];
};

export const POSTS: Post[] = [
  {
    slug: "why-not-restaurant-software",
    title: "Why a food truck can't use restaurant software",
    excerpt:
      "Every ordering system we tried assumed one address and fixed hours. A truck has neither, and that single assumption breaks everything downstream.",
    date: "2026-10-14",
    readingMinutes: 4,
    body: [
      {
        type: "p",
        text: "Restaurant ordering software is built on an assumption so basic nobody writes it down: the restaurant is in one place, and it opens at the same time every day. Change the address and you are editing a setting. Change the hours and you are editing a setting. Both are rare events.",
      },
      {
        type: "p",
        text: "For a truck, both are the job. You are at the brewery on Tuesday evening and the farmers market on Saturday morning, and the two have nothing in common except the kitchen. Treating that as a settings change means editing your own address four times a week and hoping you remembered before a customer walked to the wrong corner.",
      },
      { type: "h2", text: "What breaks when location is a setting" },
      {
        type: "p",
        text: "Once you accept that the place moves, a surprising amount follows. Ordering can't open at a fixed hour, because \"two hours before\" means something different for a lunch stop and a night market. Pickup times can't run all day, because you are only there for three hours. And sold-out doesn't carry over, because what you ran out of on Tuesday was restocked on Wednesday.",
      },
      {
        type: "p",
        text: "We tried bolting these onto a single-location model and kept finding the same shape of bug: something was scoped to the business when it should have been scoped to the occasion.",
      },
      { type: "h2", text: "The stop as the unit" },
      {
        type: "p",
        text: "So we moved the centre of the system. The thing everything hangs off is not the truck, it is the stop: one truck, at one place, from one time to another. A stop owns its own menu, its own ordering window, its own pickup times, and its own queue of orders.",
      },
      { type: "list", items: [
        "The hours belong to the stop, so Saturday's market doesn't inherit Tuesday's evening times.",
        "Ordering opens relative to that stop, so \"the morning of\" is the morning of that day.",
        "Pickup slots exist only while you're parked, so nobody books a 9pm collection from a lunch stop.",
        "Cancelling the stop cancels its orders, because those customers were coming to that corner.",
      ] },
      {
        type: "p",
        text: "It sounds like a modelling detail. In practice it is the difference between software that fights a truck and software that fits one.",
      },
    ],
  },
  {
    slug: "pickup-times-that-cant-overbook",
    title: "Pickup times that can't overbook",
    excerpt:
      "Letting customers order ahead is easy. Making sure forty of them don't all pick 12:15 is the part worth building carefully.",
    date: "2026-10-22",
    readingMinutes: 5,
    body: [
      {
        type: "p",
        text: "Preordering solves the wrong problem if it just moves the queue online. A crowd at the window at 12:15 is still a crowd at the window at 12:15, and now they are annoyed because the app implied otherwise.",
      },
      { type: "h2", text: "Slots, not timestamps" },
      {
        type: "p",
        text: "A stop is cut into slots: every fifteen minutes, say, with a capacity you set. Six orders per slot is a promise that you can make six burritos in fifteen minutes. The number comes from you, because you are the only one who knows.",
      },
      {
        type: "p",
        text: "A customer picks a slot rather than a time. When it is full it stops appearing, so the only times anyone can choose are times you can actually cook for. The rush arrives spread out because the only way to arrive is spread out.",
      },
      { type: "h2", text: "The race nobody sees" },
      {
        type: "p",
        text: "Two people hitting checkout for the last seat in the same slot is a real thing that happens at lunchtime. The naive version reads the slot, sees one seat left, and writes the booking — and if both do that in the same breath, both succeed and someone is told their food is ready when it isn't.",
      },
      {
        type: "p",
        text: "So the seat is taken with a conditional write: increment the count only if it is still below capacity. One of the two wins, the other is told the time just filled up and offered another, before any money moves. It is a small thing that is only visible when it goes wrong.",
      },
      { type: "h2", text: "What never gets deleted" },
      {
        type: "p",
        text: "The same care applies when you edit a stop. If you shorten a stop that already has an order booked at 6:15, we refuse the whole change and name the time, rather than quietly dropping someone's dinner. Keep the stop open until 6:30, or cancel those orders first — but the system will not make that choice for you.",
      },
    ],
  },
  {
    slug: "set-your-week-once",
    title: "Set your week once",
    excerpt:
      "Repeating a stop by hand every week isn't a schedule, it's a chore. So we replaced it with a switch.",
    date: "2026-11-04",
    readingMinutes: 3,
    body: [
      {
        type: "p",
        text: "The first version of our schedule had a Repeat next week button on every stop. It worked. It was also, we slowly realised, a chore we had designed into the product on purpose: every Sunday, open the app, tap repeat, tap publish, four times.",
      },
      {
        type: "p",
        text: "Most trucks trade the same hours in the same places most weeks. That is a standing arrangement, not four separate decisions.",
      },
      { type: "h2", text: "A rule, with a switch" },
      {
        type: "p",
        text: "Now you set it up once — the spot, the days, the hours — and switch it on. The stops appear on their own, a fortnight ahead, until you switch it off. Nobody taps anything on Sunday.",
      },
      { type: "list", items: [
        "Cancel one Tuesday for a wedding and it stays cancelled; the rule doesn't put it back.",
        "Switch the rule off and future stops nobody has booked disappear. Ones with orders stay, because customers are holding those times.",
        "One-off stops still exist for festivals and specials. Not everything is a pattern.",
      ] },
      { type: "h2", text: "The clocks going back" },
      {
        type: "p",
        text: "One detail took longer than the rest. If you store \"Tuesdays at 11am\" as a timestamp and repeat it every seven days, your 11am becomes 10am the week the clocks change, and your customers get it wrong before you notice.",
      },
      {
        type: "p",
        text: "So a rule stores the wall-clock time and the weekday, not an instant, and works out the real moment per date in your truck's own timezone. Eleven stays eleven. It is the kind of thing nobody thanks you for, which is how you know it is right.",
      },
    ],
  },
];

export const postsNewestFirst = () => [...POSTS].sort((a, b) => b.date.localeCompare(a.date));

export const findPost = (slug: string) => POSTS.find((p) => p.slug === slug);

/** "14 October 2026" — written out, since a date on a post is read, not scanned. */
export function formatPostDate(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
