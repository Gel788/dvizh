import Link from "next/link";
import { searchPlatform } from "@/lib/actions";
import { getSession } from "@/lib/auth";
import { PageShell } from "@/components/layout/page-shell";
import { Search } from "lucide-react";
import { PostCard } from "@/components/feed/post-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type SearchParams = Promise<{ q?: string; city?: string }>;

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const session = await getSession();
  const city = params.city ?? session?.city;
  const results = q.length >= 2 ? await searchPlatform(q, city) : { users: [], posts: [], query: q };

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
                  <li key={u.id}>
                    <Link
                      href={`/profile/${u.username}`}
                      className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-card/60 p-3 hover:border-lime/25 transition-colors"
                    >
                      <Avatar className="h-11 w-11">
                        <AvatarImage src={u.avatar ?? undefined} />
                        <AvatarFallback className="bg-lime/15 text-lime text-xs font-bold">{u.name.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-bold text-sm">{u.name}{u.verified ? " ✓" : ""}</p>
                        <p className="text-xs text-muted-foreground">@{u.username} · {u.city}{u.district ? ` · ${u.district}` : ""}</p>
                      </div>
                      <span className="ml-auto text-xs text-muted-foreground">{u._count.followers} подп.</span>
                    </Link>
                  </li>
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
        </div>
      )}
    </PageShell>
  );
}
