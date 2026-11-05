import Link from "next/link";
import { notFound } from "next/navigation";
import { POSTS, findPost, formatPostDate } from "@/lib/content/posts";
import { SiteFooter } from "@/components/platform/site-footer";
import { SiteHeader } from "@/components/platform/site-header";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props) {
  const post = findPost((await params).slug);
  if (!post) return { title: "Not found: FoodtruckApp" };
  return {
    title: `${post.title}: FoodtruckApp`,
    description: post.excerpt,
    openGraph: { title: post.title, description: post.excerpt, type: "article", publishedTime: post.date },
  };
}

export default async function PostPage({ params }: Props) {
  const post = findPost((await params).slug);
  if (!post) notFound();

  const others = POSTS.filter((p) => p.slug !== post.slug);

  return (
    <div className="min-h-dvh">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-5">
        <article>
          <header className="pt-10 pb-8 sm:pt-16">
            <p className="text-sm text-muted-foreground">
              <time dateTime={post.date}>{formatPostDate(post.date)}</time>
              <span className="mx-1.5" aria-hidden>
                ·
              </span>
              {post.readingMinutes} min read
            </p>
            <h1 className="mt-3 max-w-[18ch] font-display text-[clamp(2.5rem,8vw,4.75rem)] leading-[0.94] font-extrabold tracking-[-0.01em]">
              {post.title}
            </h1>
            <p className="mt-5 max-w-[38rem] text-lg leading-relaxed text-muted-foreground">{post.excerpt}</p>
          </header>

          {/* A single measured column: body text is for reading, not scanning. */}
          <div className="max-w-[38rem] border-t border-border pt-8 pb-4">
            {post.body.map((block, i) =>
              block.type === "h2" ? (
                <h2 key={i} className="mt-10 font-display text-[1.75rem] leading-tight font-bold first:mt-0 sm:text-[2rem]">
                  {block.text}
                </h2>
              ) : block.type === "list" ? (
                <ul key={i} className="mt-5 space-y-2.5 border-l-2 border-border pl-5">
                  {block.items.map((item) => (
                    <li key={item} className="text-[1.0625rem] leading-relaxed text-muted-foreground">
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p key={i} className="mt-5 text-[1.0625rem] leading-[1.7] first:mt-0">
                  {block.text}
                </p>
              )
            )}
          </div>
        </article>

        <section aria-labelledby="more-heading" className="pt-14">
          <h2 id="more-heading" className="font-display text-2xl font-bold">
            Read next
          </h2>
          <ul className="mt-3 divide-y divide-border border-y border-border">
            {others.map((other) => (
              <li key={other.slug}>
                <Link href={`/blog/${other.slug}`} className="block py-4 outline-none focus-visible:bg-muted/70">
                  <span className="font-display text-xl leading-tight font-bold">{other.title}</span>
                  <span className="mt-1 block max-w-[38rem] text-sm leading-relaxed text-muted-foreground">
                    {other.excerpt}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-[0.9375rem]">
            <Link href="/blog" className="font-semibold underline underline-offset-4">
              All posts
            </Link>
          </p>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
