import Link from "next/link";
import { Megaphone, Plus } from "lucide-react";
import { PostCard } from "@/components/feed/post-card";
import { PageShell } from "@/components/layout/page-shell";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { AnnouncementCategory } from "@prisma/client";

const categories: { value: AnnouncementCategory | "ALL"; label: string; emoji: string }[] = [
  { value: "ALL",      label: "Все",      emoji: "🔥" },
  { value: "SPORT",    label: "Спорт",    emoji: "⚡" },
  { value: "EVENT",    label: "Ивенты",   emoji: "🎉" },
  { value: "HELP",     label: "Помощь",   emoji: "🤝" },
  { value: "EXCHANGE", label: "Обмен",    emoji: "🔄" },
  { value: "MEETUP",   label: "Встречи",  emoji: "👋" },
  { value: "OTHER",    label: "Другое",   emoji: "✦" },
];

export default async function AnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const session = await getSession();
  const city = session?.city ?? "Москва";
  const activeCategory = category ?? "ALL";

  const posts = await db.post.findMany({
    where: {
      type: "ANNOUNCEMENT",
      city,
      ...(activeCategory !== "ALL" ? { category: activeCategory as AnnouncementCategory } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      author: {
        select: { id: true, name: true, username: true, avatar: true, verified: true, city: true, district: true },
      },
      _count: { select: { likes: true, comments: true, going: true, reposts: true } },
      likes: session ? { where: { userId: session.id }, select: { id: true } } : false,
      going: session ? { where: { userId: session.id }, select: { id: true } } : false,
    },
  });

  return (
    <PageShell
      title="ОБЪЯВЛЕНИЯ"
      description="Спорт, ивенты, помощь и встречи в твоём городе"
      icon={<Megaphone className="h-6 w-6" />}
      accent="ice"
      action={
        session ? (
          <Link href="/create" className="btn-action py-2 px-4 text-xs gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Добавить
          </Link>
        ) : undefined
      }
    >
      {/* Category filter chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((c) => (
          <a
            key={c.value}
            href={`/announcements?category=${c.value}`}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold uppercase tracking-wide transition-all duration-200 cursor-pointer ${
              activeCategory === c.value
                ? "bg-ice/15 text-ice border border-ice/25"
                : "border border-white/[0.07] bg-white/[0.03] text-muted-foreground hover:text-foreground hover:bg-white/[0.07]"
            }`}
          >
            <span>{c.emoji}</span>
            {c.label}
          </a>
        ))}
      </div>

      {/* Feed */}
      <div className="space-y-3">
        {posts.length === 0 ? (
          <div className="text-center py-16">
            <p className="font-heading text-3xl text-ice/40">ТИШИНА</p>
            <p className="text-muted-foreground text-sm mt-3">Нет объявлений в этой категории</p>
          </div>
        ) : (
          posts.map((post, i) => <PostCard key={post.id} post={post} index={i} />)
        )}
      </div>
    </PageShell>
  );
}
