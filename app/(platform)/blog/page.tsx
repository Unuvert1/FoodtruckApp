import Link from "next/link";
import { formatPostDate, postsNewestFirst } from "@/lib/content/posts";
import { SiteFooter } from "@/components/platform/site-footer";
import { SiteHeader } from "@/components/platform/site-header";

export const metadata = {
  title: "Writing: FoodtruckApp",
  description: "Notes on building preordering for kitchens that move.",
};

export default function BlogPage() {
  const posts = postsNewestFirst();

  return (
    <div className="min-h-dvh">
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-4">
        <section className="pt-10 pb-10 sm:pt-16">
          <h1 className="max-w-[14ch] font-display text-[clamp(2.75rem,9vw,5.5rem)] leading-[0.92] font-extrabold tracking-[-0.01em]">
            Notes from building it.
          </h1>
          <p className="mt-6 max-w-[34rem] text-lg leading-relaxed text-muted-foreground">
            Decisions we had to make, and why we made them that way. Mostly about the awkward parts.
          </p>
        </section>

        <ul className="divide-y divide-border border-y border-border">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link
                href={`/blog/${post.slug}`}
                className="grid gap-2 py-7 outline-none focus-visible:bg-muted/70 sm:grid-cols-[1fr_1.5fr] sm:gap-10"
              >
                <div>
                  <h2 className="font-display text-[1.75rem] leading-[1.05] font-bold tracking-[-0.01em] sm:text-[2rem]">
                    {post.title}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    <time dateTime={post.date}>{formatPostDate(post.date)}</time>
                    <span className="mx-1.5" aria-hidden>
                      ·
                    </span>
                    {post.readingMinutes} min read
                  </p>
                </div>
                <p className="max-w-[36rem] leading-relaxed text-muted-foreground">{post.excerpt}</p>
              </Link>
            </li>
          ))}
        </ul>
      </main>

      <SiteFooter />
    </div>
  );
}
