import { db } from "@/lib/db";
import { parsePostImages } from "@/lib/admin/preview-serialize";
import type { AdminPreviewReport } from "@/lib/admin/preview-types";

type ReportRow = {
  id: string;
  targetKind: string;
  targetId: string;
  reason: string;
  details: string | null;
  createdAt: Date;
  reporter: { name: string; username: string; avatar?: string | null };
};

type TargetMeta = {
  label: string;
  snippet: string | null;
  image: string | null;
  href: string | null;
};

async function loadTargetMeta(kind: string, id: string): Promise<TargetMeta> {
  switch (kind) {
    case "post": {
      const post = await db.post.findUnique({
        where: { id },
        select: { id: true, title: true, content: true, images: true, author: { select: { username: true } } },
      });
      if (!post) return { label: "Пост (удалён)", snippet: id, image: null, href: null };
      const imgs = parsePostImages(post.images);
      return {
        label: post.title ?? "Пост",
        snippet: post.content,
        image: imgs[0] ?? null,
        href: `/post/${post.id}`,
      };
    }
    case "user":
    case "profile": {
      const user = await db.user.findUnique({
        where: { id },
        select: { username: true, name: true, bio: true, avatar: true },
      });
      if (!user) return { label: "Профиль (удалён)", snippet: id, image: null, href: null };
      return {
        label: user.name,
        snippet: user.bio,
        image: user.avatar,
        href: `/profile/${user.username}`,
      };
    }
    case "move":
    case "event": {
      const event = await db.event.findUnique({
        where: { id },
        select: { title: true, description: true, coverImage: true },
      });
      if (!event) {
        const post = await db.post.findUnique({
          where: { id },
          select: { title: true, content: true, images: true },
        });
        if (post) {
          const imgs = parsePostImages(post.images);
          return { label: post.title ?? "Активность", snippet: post.content, image: imgs[0] ?? null, href: `/post/${id}` };
        }
        return { label: "Активность", snippet: id, image: null, href: null };
      }
      return {
        label: event.title,
        snippet: event.description,
        image: event.coverImage,
        href: `/events/${id}`,
      };
    }
    default:
      return { label: `${kind} · ${id.slice(0, 10)}…`, snippet: null, image: null, href: null };
  }
}

export async function buildReportPreviews(reports: ReportRow[]): Promise<Record<string, AdminPreviewReport>> {
  const map: Record<string, AdminPreviewReport> = {};
  const uniqueTargets = new Map<string, { kind: string; id: string }>();
  for (const r of reports) {
    uniqueTargets.set(`${r.targetKind}:${r.targetId}`, { kind: r.targetKind, id: r.targetId });
  }

  const metaCache = new Map<string, TargetMeta>();
  await Promise.all(
    [...uniqueTargets.entries()].map(async ([key, { kind, id }]) => {
      metaCache.set(key, await loadTargetMeta(kind, id));
    }),
  );

  for (const r of reports) {
    const meta = metaCache.get(`${r.targetKind}:${r.targetId}`) ?? {
      label: r.targetId,
      snippet: null,
      image: null,
      href: null,
    };
    map[r.id] = {
      kind: "report",
      id: r.id,
      targetKind: r.targetKind,
      targetId: r.targetId,
      reason: r.reason,
      details: r.details,
      createdAt: r.createdAt.toISOString(),
      reporter: { name: r.reporter.name, username: r.reporter.username, avatar: r.reporter.avatar ?? null },
      targetLabel: meta.label,
      targetSnippet: meta.snippet,
      targetImage: meta.image,
      targetHref: meta.href,
    };
  }
  return map;
}

export async function resolveActivityTitles(ids: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (ids.length === 0) return map;
  const events = await db.event.findMany({
    where: { id: { in: ids } },
    select: { id: true, title: true },
  });
  for (const e of events) map.set(e.id, e.title);
  const posts = await db.post.findMany({
    where: { id: { in: ids.filter((id) => !map.has(id)) } },
    select: { id: true, title: true, content: true },
  });
  for (const p of posts) map.set(p.id, p.title ?? p.content.slice(0, 60));
  return map;
}
