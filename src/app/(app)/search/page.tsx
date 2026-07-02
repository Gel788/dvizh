import { searchPlatform } from "@/lib/actions";
import { getSession } from "@/lib/auth";
import { PageShell } from "@/components/layout/page-shell";
import { Search } from "lucide-react";
import Link from "next/link";
import { PostCard } from "@/components/feed/post-card";
import { SearchUserRow } from "@/components/social/search-user-row";

type SearchParams = Promise<{ q?: string; city?: string }>;

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const session = await getSession();
  const city = params.city ?? session?.city;
  const results =
    q.length >= 2
      ? await searchPlatform(q, city, session?.id)
      : { users: [], posts: [], challenges: [], events: [], query: q };

  return (
    <PageShell
      title="Поиск"
      description={q ? `Результаты для «${q}»` : "Введите запрос в строке поиска"}
      icon={<Search className="h-6 w-6" />}
      accent="lime"
    >
      {q.length < 2 ? (
        <p className="text-sm text-muted-foreground text-center py-16">Минимум 2 символа для поиска</p>
      ) : (
        <div className="space-y-8 max-w-2xl mx-auto">
          <section>
            <h2 className="font-heading text-lg mb-3">Люди · {results.users.length}</h2>
            {results.users.length === 0 ? (
              <p className="text-sm text-muted-foreground">Никого не нашли</p>
            ) : (
              <ul className="space-y-2">
                {results.users.map((u) => (
                  <SearchUserRow key={u.id} user={u} sessionId={session?.id} />
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="font-heading text-lg mb-3">Посты · {results.posts.length}</h2>
            {results.posts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Постов не найдено</p>
            ) : (
              <div className="space-y-3">
                {results.posts.map((post) => (
                  <PostCard key={post.id} post={post as Parameters<typeof PostCard>[0]["post"]} />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="font-heading text-lg mb-3">Челленджи · {results.challenges.length}</h2>
            {results.challenges.length === 0 ? (
              <p className="text-sm text-muted-foreground">Челленджей не найдено</p>
            ) : (
              <ul className="space-y-2">
                {results.challenges.map((c) => {
                  const post = c.post;
                  return (
                    <li key={c.id}>
                      <Link
                        href={`/post/${post.id}`}
                        className="block rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 hover:border-lime/30 transition-colors"
                      >
                        <p className="font-bold text-sm">{post.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          @{post.author.username} · {c._count.participants} участников
                        </p>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section>
            <h2 className="font-heading text-lg mb-3">События · {results.events.length}</h2>
            {results.events.length === 0 ? (
              <p className="text-sm text-muted-foreground">Событий не найдено</p>
            ) : (
              <ul className="space-y-2">
                {results.events.map((e) => (
                  <li
                    key={e.id}
                    className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3"
                  >
                    <p className="font-bold text-sm">{e.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {e.city}
                      {e.startAt ? ` · ${new Date(e.startAt).toLocaleDateString("ru-RU")}` : ""}
                      {` · ${e._count.attendees} идут`}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </PageShell>
  );
}
