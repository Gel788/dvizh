import Link from "next/link";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Sparkles } from "lucide-react";
import { AdminTable, AdminTd, AdminTh } from "@/components/admin/admin-table";
import {
  togglePostFeaturedAction,
  updatePostFeaturedBoostAction,
} from "@/lib/admin/actions";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatCard } from "@/components/admin/stat-card";

const postInclude = {
  author: { select: { username: true, name: true } },
  _count: { select: { likes: true, comments: true, going: true } },
} as const;

type FeedPost = Awaited<ReturnType<typeof db.post.findMany<{ include: typeof postInclude }>>>[number];

export default async function AdminFeedPage() {
  const [featured, candidates] = await Promise.all([
    db.post.findMany({
      where: { featuredInFeed: true, hiddenFromFeed: false },
      orderBy: [{ featuredBoost: "desc" }, { createdAt: "desc" }],
      take: 20,
      include: postInclude,
    }),
    db.post.findMany({
      where: { featuredInFeed: false, hiddenFromFeed: false },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: postInclude,
    }),
  ]);

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-[1400px]">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-lime" />
          <h1 className="font-heading text-4xl text-neon-lime leading-none">Курация ленты</h1>
        </div>
        <p className="text-sm text-white/45">
          Закрепи посты в «Для тебя». Boost 0–100 — чем выше, тем раньше в ленте. Кэш ленты ~60 сек.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        <StatCard label="В ленте сейчас" value={featured.length} accent="lime" />
        <StatCard label="Кандидаты" value={candidates.length} accent="ice" />
        <StatCard
          label="Средний boost"
          value={featured.length ? Math.round(featured.reduce((s, p) => s + p.featuredBoost, 0) / featured.length) : 0}
        />
      </div>

      <section className="mb-10">
        <h2 className="font-heading text-xl mb-3 text-lime">Закреплённые</h2>
        {featured.length === 0 ? (
          <p className="text-sm text-white/40 py-8 text-center rounded-2xl border border-dashed border-white/10">
            Пока ничего не закреплено — выбери из кандидатов ниже
          </p>
        ) : (
          <FeedTable posts={featured} featured />
        )}
      </section>

      <section>
        <h2 className="font-heading text-xl mb-3">Недавние кандидаты</h2>
        <FeedTable posts={candidates} />
      </section>
    </div>
  );
}

function FeedTable({ posts, featured = false }: { posts: FeedPost[]; featured?: boolean }) {
  return (
    <AdminTable>
      <thead>
        <tr>
          <AdminTh>Пост</AdminTh>
          <AdminTh>Автор</AdminTh>
          <AdminTh>Реакции</AdminTh>
          <AdminTh>Boost</AdminTh>
          <AdminTh className="text-right">Действия</AdminTh>
        </tr>
      </thead>
      <tbody>
        {posts.map((p) => (
          <tr key={p.id}>
            <AdminTd className="max-w-[280px]">
              <Link href={`/post/${p.id}`} className="line-clamp-2 hover:text-lime">
                {p.title ?? p.content}
              </Link>
              <p className="text-[10px] text-white/30 mt-1">{format(p.createdAt, "d MMM HH:mm", { locale: ru })}</p>
            </AdminTd>
            <AdminTd className="text-xs">@{p.author.username}</AdminTd>
            <AdminTd className="text-xs text-white/40">
              ♥ {p._count.likes} · 💬 {p._count.comments}
            </AdminTd>
            <AdminTd>
              {featured ? (
                <form action={updatePostFeaturedBoostAction} className="flex items-center gap-1">
                  <input type="hidden" name="postId" value={p.id} />
                  <Input name="boost" type="number" defaultValue={p.featuredBoost} className="h-8 w-16 text-xs" min={0} max={100} />
                  <Button type="submit" size="sm" variant="ghost" className="text-xs cursor-pointer">OK</Button>
                </form>
              ) : (
                <span className="text-white/30">—</span>
              )}
            </AdminTd>
            <AdminTd className="text-right">
              <form action={togglePostFeaturedAction.bind(null, p.id)}>
                <Button type="submit" size="sm" variant={featured ? "outline" : "default"} className="cursor-pointer text-xs">
                  {featured ? "Убрать" : "★ В ленту"}
                </Button>
              </form>
            </AdminTd>
          </tr>
        ))}
      </tbody>
    </AdminTable>
  );
}
