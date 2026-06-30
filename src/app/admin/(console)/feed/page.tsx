import Link from "next/link";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Sparkles } from "lucide-react";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminSection, AdminTable, AdminTd, AdminTh, AdminTr } from "@/components/admin/admin-table";
import {
  togglePostFeaturedAction,
  updatePostFeaturedBoostAction,
  createSponsoredPostAction,
} from "@/lib/admin/actions";
import { CITIES } from "@/lib/geo";
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
    <AdminPage>
      <AdminPageHeader
        eyebrow="Контент"
        title="Курация ленты"
        description="Закрепи посты в «Для тебя». Boost 0–100 — чем выше, тем раньше в ленте. Кэш ~60 сек."
      />

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard label="В ленте сейчас" value={featured.length} accent="lime" icon={Sparkles} />
        <StatCard label="Кандидаты" value={candidates.length} accent="ice" />
        <StatCard
          label="Средний boost"
          value={featured.length ? Math.round(featured.reduce((s, p) => s + p.featuredBoost, 0) / featured.length) : 0}
          accent="muted"
        />
      </div>

      <AdminSection title="Спонсорская публикация" icon={<Sparkles className="h-4 w-4 text-lime" />}>
        <form action={createSponsoredPostAction} className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4 lg:grid-cols-2">
          <div className="space-y-2 lg:col-span-2">
            <label className="text-xs text-white/50">Заголовок</label>
            <Input name="title" placeholder="Название спонсора" className="h-9" />
          </div>
          <div className="space-y-2 lg:col-span-2">
            <label className="text-xs text-white/50">Текст</label>
            <Input name="content" required placeholder="Текст публикации" className="h-9" />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-white/50">Город</label>
            <select name="city" defaultValue="Москва" className="h-9 w-full rounded-md border border-white/10 bg-transparent px-3 text-sm">
              {CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs text-white/50">Boost (0–100)</label>
            <Input name="boost" type="number" defaultValue={85} min={0} max={100} className="h-9" />
          </div>
          <div className="space-y-2 lg:col-span-2">
            <label className="text-xs text-white/50">Автор (username, опционально)</label>
            <Input name="authorUsername" placeholder="sponsor_brand" className="h-9" />
          </div>
          <div className="lg:col-span-2">
            <Button type="submit" className="cursor-pointer">Опубликовать в ленту</Button>
          </div>
        </form>
      </AdminSection>

      <AdminSection title="Закреплённые" icon={<Sparkles className="h-4 w-4 text-lime" />}>
        {featured.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/10 py-10 text-center text-sm text-muted-foreground">
            Пока ничего не закреплено — выбери из кандидатов ниже
          </p>
        ) : (
          <FeedTable posts={featured} featured />
        )}
      </AdminSection>

      <div className="mt-10">
        <AdminSection title="Недавние кандидаты">
          <FeedTable posts={candidates} />
        </AdminSection>
      </div>
    </AdminPage>
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
          <AdminTr key={p.id}>
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
          </AdminTr>
        ))}
      </tbody>
    </AdminTable>
  );
}
