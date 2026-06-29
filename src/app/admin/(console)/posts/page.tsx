import Link from "next/link";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { AdminTable, AdminTd, AdminTh } from "@/components/admin/admin-table";
import {
  deletePostAction,
  togglePostFeaturedAction,
  togglePostHiddenAction,
  updatePostFeaturedBoostAction,
} from "@/lib/admin/actions";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default async function AdminPostsPage() {
  const posts = await db.post.findMany({
    orderBy: [{ featuredInFeed: "desc" }, { createdAt: "desc" }],
    take: 100,
    include: {
      author: { select: { name: true, username: true } },
      _count: { select: { likes: true, comments: true, going: true } },
    },
  });

  const featured = posts.filter((p) => p.featuredInFeed);
  const hidden = posts.filter((p) => p.hiddenFromFeed);

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-[1400px]">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-4xl text-neon-lime leading-none">Посты</h1>
          <p className="mt-2 text-sm text-white/45">
            Модерация · в ленте {featured.length} · скрыто {hidden.length}
          </p>
        </div>
        <Link
          href="/admin/feed"
          className="rounded-xl border border-lime/30 bg-lime/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-lime hover:bg-lime/15"
        >
          Курация ленты →
        </Link>
      </div>

      <AdminTable>
        <thead>
          <tr>
            <AdminTh>Контент</AdminTh>
            <AdminTh>Статус</AdminTh>
            <AdminTh>Автор</AdminTh>
            <AdminTh>Реакции</AdminTh>
            <AdminTh>Дата</AdminTh>
            <AdminTh className="text-right">Действия</AdminTh>
          </tr>
        </thead>
        <tbody>
          {posts.map((p) => (
            <tr key={p.id} className={cn(p.hiddenFromFeed && "opacity-50")}>
              <AdminTd className="max-w-[260px]">
                <Link href={`/post/${p.id}`} className="line-clamp-2 hover:text-lime font-medium">
                  {p.title ?? p.content}
                </Link>
                <p className="text-[10px] text-white/30 mt-1">{p.type} · {p.city}</p>
              </AdminTd>
              <AdminTd>
                <div className="flex flex-wrap gap-1">
                  {p.featuredInFeed && (
                    <Badge className="bg-lime/15 text-lime border-lime/20">в ленте +{p.featuredBoost}</Badge>
                  )}
                  {p.hiddenFromFeed && (
                    <Badge className="bg-heat/15 text-heat border-heat/20">скрыт</Badge>
                  )}
                </div>
              </AdminTd>
              <AdminTd>
                <Link href={`/profile/${p.author.username}`} className="hover:text-lime text-xs">
                  @{p.author.username}
                </Link>
              </AdminTd>
              <AdminTd className="text-xs text-white/40">
                ♥ {p._count.likes} · 💬 {p._count.comments}
              </AdminTd>
              <AdminTd className="text-xs text-white/35">
                {format(p.createdAt, "d MMM HH:mm", { locale: ru })}
              </AdminTd>
              <AdminTd>
                <div className="flex flex-wrap items-center justify-end gap-1">
                  <form action={togglePostFeaturedAction.bind(null, p.id)}>
                    <Button type="submit" size="sm" variant="ghost" className="cursor-pointer text-xs">
                      {p.featuredInFeed ? "− лента" : "★ лента"}
                    </Button>
                  </form>
                  <form action={togglePostHiddenAction.bind(null, p.id)}>
                    <Button type="submit" size="sm" variant="ghost" className="cursor-pointer text-xs text-heat">
                      {p.hiddenFromFeed ? "показать" : "скрыть"}
                    </Button>
                  </form>
                  {p.featuredInFeed && (
                    <form action={updatePostFeaturedBoostAction} className="flex items-center gap-1">
                      <input type="hidden" name="postId" value={p.id} />
                      <Input name="boost" type="number" defaultValue={p.featuredBoost} className="h-7 w-14 text-xs" min={0} max={100} />
                      <Button type="submit" size="sm" variant="ghost" className="text-xs cursor-pointer">↑</Button>
                    </form>
                  )}
                  <form action={deletePostAction.bind(null, p.id)}>
                    <Button type="submit" size="sm" variant="ghost" className="cursor-pointer text-xs text-heat">✕</Button>
                  </form>
                </div>
              </AdminTd>
            </tr>
          ))}
        </tbody>
      </AdminTable>
    </div>
  );
}
