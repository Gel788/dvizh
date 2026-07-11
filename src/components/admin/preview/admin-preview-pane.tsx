"use client";

import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  ExternalLink,
  Eye,
  Heart,
  MessageCircle,
  Star,
  User,
  Users,
} from "lucide-react";
import type { AdminPreviewAuthor, AdminPreviewPayload } from "@/lib/admin/preview-types";
import { useAdminPreview } from "@/components/admin/preview/admin-preview-provider";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function PreviewImage({
  src,
  alt,
  className,
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
}) {
  if (!src) {
    return (
      <div className={cn("flex items-center justify-center bg-white/[0.04] text-muted-foreground", className)}>
        <Eye className="h-8 w-8 opacity-30" />
      </div>
    );
  }
  const isExternal = src.startsWith("http") || src.startsWith("/");
  if (!isExternal) return null;
  return (
    <div className={cn("relative overflow-hidden bg-black/40", className)}>
      <Image src={src} alt={alt} fill className="object-cover" sizes="400px" unoptimized />
    </div>
  );
}

function AuthorChip({ author }: { author: AdminPreviewAuthor }) {
  return (
    <Link
      href={`/profile/${author.username}`}
      target="_blank"
      className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 hover:border-lime/25 transition-colors"
    >
      {author.avatar ? (
        <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full ring-1 ring-white/10">
          <Image src={author.avatar} alt="" fill className="object-cover" sizes="32px" unoptimized />
        </span>
      ) : (
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-lime/10 text-lime">
          <User className="h-4 w-4" />
        </span>
      )}
      <span className="min-w-0">
        <span className="block text-sm font-semibold truncate">{author.name}</span>
        <span className="block text-[11px] text-muted-foreground">@{author.username}</span>
      </span>
    </Link>
  );
}

function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-white/[0.05] text-sm last:border-0">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function ExternalOpen({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      target="_blank"
      className="inline-flex items-center gap-1.5 rounded-lg border border-lime/25 bg-lime/10 px-3 py-2 text-xs font-bold uppercase tracking-wide text-lime hover:bg-lime/15 transition-colors"
    >
      {label}
      <ExternalLink className="h-3.5 w-3.5" />
    </Link>
  );
}

function PostPreview({ data }: { data: Extract<AdminPreviewPayload, { kind: "post" }> }) {
  return (
    <>
      {data.images.length > 0 ? (
        <div className="grid gap-2 mb-4">
          <PreviewImage src={data.images[0]} alt="" className="aspect-[16/10] w-full rounded-xl" />
          {data.images.length > 1 && (
            <div className="grid grid-cols-3 gap-2">
              {data.images.slice(1, 4).map((img) => (
                <PreviewImage key={img} src={img} alt="" className="aspect-square rounded-lg" />
              ))}
            </div>
          )}
        </div>
      ) : (
        <PreviewImage src={null} alt="" className="aspect-[16/8] w-full rounded-xl mb-4" />
      )}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <Badge variant="outline">{data.type}</Badge>
        {data.featuredInFeed && <Badge className="bg-lime/15 text-lime">в ленте +{data.featuredBoost}</Badge>}
        {data.hiddenFromFeed && <Badge className="bg-heat/15 text-heat">скрыт</Badge>}
      </div>
      {data.title && <h3 className="font-heading text-xl mb-2">{data.title}</h3>}
      <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">{data.content}</p>
      <div className="mt-4 flex gap-4 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1"><Heart className="h-4 w-4 text-lime" />{data.likes}</span>
        <span className="inline-flex items-center gap-1"><MessageCircle className="h-4 w-4 text-ice" />{data.comments}</span>
        <span>→ {data.going} going</span>
      </div>
      <div className="mt-4 space-y-0">
        <MetaRow label="Город" value={`${data.city}${data.district ? ` · ${data.district}` : ""}`} />
        {data.tags && <MetaRow label="Теги" value={data.tags} />}
        <MetaRow label="Создан" value={format(new Date(data.createdAt), "d MMM yyyy HH:mm", { locale: ru })} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <ExternalOpen href={`/post/${data.id}`} label="Открыть пост" />
      </div>
    </>
  );
}

function UserPreview({ data }: { data: Extract<AdminPreviewPayload, { kind: "user" }> }) {
  return (
    <>
      <PreviewImage src={data.coverImage} alt="" className="aspect-[2/1] w-full rounded-xl mb-3" />
      <div className="flex items-end gap-3 -mt-10 mb-4 px-2 relative z-10">
        <PreviewImage src={data.avatar} alt="" className="h-16 w-16 rounded-2xl ring-2 ring-[#0a0a10]" />
        <div className="pb-1 min-w-0">
          <h3 className="font-heading text-xl truncate">{data.name}</h3>
          <p className="text-sm text-muted-foreground">@{data.username}</p>
        </div>
      </div>
      {data.bio && <p className="text-sm text-foreground/85 mb-4 whitespace-pre-wrap">{data.bio}</p>}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="rounded-xl bg-white/[0.03] p-3 text-center">
          <p className="font-heading text-xl text-lime">{data.posts}</p>
          <p className="text-[10px] text-muted-foreground uppercase">постов</p>
        </div>
        <div className="rounded-xl bg-white/[0.03] p-3 text-center">
          <p className="font-heading text-xl">{data.followers}</p>
          <p className="text-[10px] text-muted-foreground uppercase">подп.</p>
        </div>
        <div className="rounded-xl bg-white/[0.03] p-3 text-center">
          <p className="font-heading text-xl">{data.following}</p>
          <p className="text-[10px] text-muted-foreground uppercase">подписок</p>
        </div>
      </div>
      <div className="space-y-0">
        <MetaRow label="Email" value={<span className="font-mono text-xs">{data.email}</span>} />
        <MetaRow label="Город" value={data.city} />
        <MetaRow label="XP / Level" value={data.xp != null ? `${data.xp} · L${data.level}` : "—"} />
        <MetaRow label="Репутация" value={data.reputation} />
        <MetaRow label="Роль" value={data.role} />
      </div>
      <div className="mt-4">
        <ExternalOpen href={`/profile/${data.username}`} label="Профиль" />
      </div>
    </>
  );
}

function MediaPreview({ data }: { data: Extract<AdminPreviewPayload, { kind: "media" }> }) {
  return (
    <>
      <PreviewImage src={data.coverUrl} alt={data.title} className="aspect-[2/3] max-h-[280px] w-full rounded-xl mb-4" />
      <div className="flex flex-wrap gap-1.5 mb-2">
        <Badge variant="outline">{data.type}</Badge>
        <Badge variant="outline">{data.status}</Badge>
        {data.pinned && <Badge className="bg-lime/15 text-lime">закреп</Badge>}
      </div>
      <h3 className="font-heading text-xl mb-2">{data.title}</h3>
      {data.rating != null && (
        <p className="inline-flex items-center gap-1 text-sm text-amber-400 mb-3">
          <Star className="h-4 w-4 fill-current" /> {data.rating}/10
        </p>
      )}
      {data.review ? (
        <p className="text-sm leading-relaxed text-foreground/85 whitespace-pre-wrap">{data.review}</p>
      ) : (
        <p className="text-sm text-muted-foreground italic">Без рецензии</p>
      )}
    </>
  );
}

function WishlistPreview({ data }: { data: Extract<AdminPreviewPayload, { kind: "wishlist" }> }) {
  return (
    <>
      <div className="flex flex-wrap gap-1.5 mb-3">
        <Badge variant="outline">{data.visibility}</Badge>
        {data.surpriseMode && <Badge className="bg-violet-500/15 text-violet-300">surprise</Badge>}
        {data.occasion && <Badge variant="outline">{data.occasion}</Badge>}
      </div>
      <h3 className="font-heading text-xl mb-4">{data.title}</h3>
      <ul className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
        {data.items.map((item) => (
          <li key={item.id} className="flex gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
            <PreviewImage src={item.imageUrl} alt="" className="h-14 w-14 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm line-clamp-2">{item.title}</p>
              {item.price && <p className="text-xs text-lime mt-0.5">{item.price}</p>}
              {item.reserved && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  забронировано · {item.reservationStatus ?? "reserved"}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

function ReportPreview({ data }: { data: Extract<AdminPreviewPayload, { kind: "report" }> }) {
  return (
    <>
      <Badge className="bg-heat/15 text-heat mb-3">{data.reason}</Badge>
      {data.details && <p className="text-sm mb-4 text-foreground/85">{data.details}</p>}
      <div className="rounded-xl border border-heat/20 bg-heat/[0.04] p-4 mb-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
          Объект · {data.targetKind}
        </p>
        {data.targetImage && (
          <PreviewImage src={data.targetImage} alt="" className="aspect-video w-full rounded-lg mb-3" />
        )}
        <p className="font-semibold">{data.targetLabel}</p>
        {data.targetSnippet && (
          <p className="mt-2 text-sm text-muted-foreground line-clamp-6 whitespace-pre-wrap">{data.targetSnippet}</p>
        )}
        <p className="mt-2 font-mono text-[10px] text-white/30">{data.targetId}</p>
      </div>
      <AuthorChip author={data.reporter} />
      {data.targetHref && (
        <div className="mt-4">
          <ExternalOpen href={data.targetHref} label="Открыть объект" />
        </div>
      )}
    </>
  );
}

function GenericTextPreview({
  title,
  description,
  badges,
  meta,
  href,
  hrefLabel,
}: {
  title: string;
  description?: string | null;
  badges?: React.ReactNode;
  meta?: { label: string; value: React.ReactNode }[];
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <>
      {badges && <div className="flex flex-wrap gap-1.5 mb-3">{badges}</div>}
      <h3 className="font-heading text-xl mb-2">{title}</h3>
      {description && <p className="text-sm leading-relaxed text-foreground/85 whitespace-pre-wrap">{description}</p>}
      {meta && meta.length > 0 && (
        <div className="mt-4 space-y-0">
          {meta.map((m) => (
            <MetaRow key={m.label} label={m.label} value={m.value} />
          ))}
        </div>
      )}
      {href && hrefLabel && (
        <div className="mt-4">
          <ExternalOpen href={href} label={hrefLabel} />
        </div>
      )}
    </>
  );
}

export function AdminPreviewBody({ data }: { data: AdminPreviewPayload }) {
  switch (data.kind) {
    case "post":
      return <PostPreview data={data} />;
    case "user":
      return <UserPreview data={data} />;
    case "media":
      return (
        <>
          <MediaPreview data={data} />
          <div className="mt-4"><AuthorChip author={data.author} /></div>
        </>
      );
    case "wishlist":
      return (
        <>
          <WishlistPreview data={data} />
          <div className="mt-4"><AuthorChip author={data.author} /></div>
        </>
      );
    case "report":
      return <ReportPreview data={data} />;
    case "duel":
      return (
        <>
          <GenericTextPreview
            title={`${data.emoji ?? ""} ${data.title}`.trim()}
            description={data.description}
            badges={<><Badge variant="outline">{data.visibility}</Badge><Badge variant="outline">{data.period}</Badge></>}
            meta={[
              { label: "Участники", value: data.participants },
              { label: "Создан", value: format(new Date(data.createdAt), "d MMM yyyy", { locale: ru }) },
            ]}
          />
          <div className="mt-4"><AuthorChip author={data.author} /></div>
        </>
      );
    case "sharedGoal":
      return (
        <>
          <GenericTextPreview
            title={data.title}
            description={data.description}
            meta={[
              { label: "Участники", value: data.members },
              { label: "Пункты", value: data.items },
              { label: "Событие", value: data.eventAt ? format(new Date(data.eventAt), "d MMM yyyy", { locale: ru }) : "—" },
            ]}
          />
          <div className="mt-4"><AuthorChip author={data.author} /></div>
        </>
      );
    case "friendship":
      return (
        <div className="space-y-4">
          <Badge className={data.status === "PENDING" ? "bg-heat/15 text-heat" : "bg-lime/15 text-lime"}>
            {data.status === "PENDING" ? "ожидает" : "друзья"}
          </Badge>
          <div className="flex items-center justify-center gap-3 py-4">
            <AuthorChip author={data.requester} />
            <Users className="h-5 w-5 text-muted-foreground shrink-0" />
            <AuthorChip author={data.addressee} />
          </div>
        </div>
      );
    case "joinRequest":
      return (
        <>
          <GenericTextPreview
            title={data.activityTitle ?? "Заявка Move"}
            description={`${data.activityKind} · ${data.activityId}`}
            badges={<Badge variant="outline">{data.status}</Badge>}
          />
          <div className="mt-4"><AuthorChip author={data.user} /></div>
        </>
      );
    case "event":
      return (
        <>
          <PreviewImage src={data.coverImage} alt="" className="aspect-video w-full rounded-xl mb-4" />
          <GenericTextPreview
            title={data.title}
            description={data.description}
            meta={[
              { label: "Город", value: `${data.city}${data.district ? ` · ${data.district}` : ""}` },
              { label: "Участники", value: data.attendees },
              { label: "Клуб", value: data.clubName ?? "—" },
              { label: "Начало", value: format(new Date(data.startAt), "d MMM yyyy HH:mm", { locale: ru }) },
            ]}
            href={`/events/${data.id}`}
            hrefLabel="Событие"
          />
          <div className="mt-4"><AuthorChip author={data.author} /></div>
        </>
      );
    case "calendarEvent":
      return (
        <>
          <GenericTextPreview
            title={data.title}
            description={data.note}
            badges={<><Badge variant="outline">{data.eventType}</Badge><Badge variant="outline">{data.visibility}</Badge></>}
            meta={[
              { label: "Источник", value: data.sourceKind ?? "manual" },
              { label: "Дата", value: format(new Date(data.eventDate), "d MMM yyyy HH:mm", { locale: ru }) },
            ]}
          />
          <div className="mt-4"><AuthorChip author={data.author} /></div>
        </>
      );
    case "challenge":
      return (
        <>
          <GenericTextPreview
            title={data.title}
            description={data.content}
            badges={data.flags.map((f) => <Badge key={f} variant="outline">{f}</Badge>)}
            meta={[
              { label: "Цель", value: `${data.goalCount} дней` },
              { label: "Участники", value: data.participants },
              { label: "Отчёты", value: data.reports },
              { label: "Город", value: data.city },
            ]}
            href={`/post/${data.postId}`}
            hrefLabel="Пост челленджа"
          />
          {data.rules && <p className="mt-3 text-xs text-muted-foreground">Правила: {data.rules}</p>}
          <div className="mt-4"><AuthorChip author={data.author} /></div>
        </>
      );
    case "club":
      return (
        <>
          <PreviewImage src={data.coverImage} alt="" className="aspect-[2/1] w-full rounded-xl mb-4" />
          <GenericTextPreview
            title={data.name}
            description={data.description}
            badges={<Badge variant="outline">{data.isPrivate ? "private" : "public"}</Badge>}
            meta={[
              { label: "Город", value: data.city },
              { label: "Участники", value: data.members },
              { label: "События", value: data.events },
            ]}
            href={`/clubs/${data.id}`}
            hrefLabel="Клуб"
          />
          <div className="mt-4"><AuthorChip author={data.author} /></div>
        </>
      );
    default:
      return null;
  }
}

const KIND_LABELS: Record<AdminPreviewPayload["kind"], string> = {
  post: "Пост",
  user: "Пользователь",
  media: "Медиа",
  wishlist: "Вишлист",
  report: "Жалоба",
  duel: "Спор",
  sharedGoal: "Вместе",
  friendship: "Дружба",
  joinRequest: "Move join",
  event: "Событие",
  calendarEvent: "Календарь",
  challenge: "Челлендж",
  club: "Клуб",
};

export function AdminPreviewPane({ className, children }: { className?: string; children?: React.ReactNode }) {
  return (
    <aside
      className={cn(
        "admin-preview-pane admin-glass flex flex-col overflow-hidden rounded-2xl",
        className,
      )}
    >
      {children}
    </aside>
  );
}

export function AdminPreviewPaneContent({ data }: { data: AdminPreviewPayload | null }) {
  if (!data) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
        <Eye className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <p className="text-sm font-semibold text-muted-foreground">Предпросмотр</p>
        <p className="mt-1 text-xs text-muted-foreground/70 max-w-[200px]">
          Кликни по строке в таблице — здесь появится карточка с контентом и медиа
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-5">
      <div className="mb-4 flex items-center gap-2">
        <Badge className="bg-lime/10 text-lime border-lime/20">{KIND_LABELS[data.kind]}</Badge>
        <span className="font-mono text-[10px] text-muted-foreground truncate">{data.id.slice(0, 14)}…</span>
      </div>
      <AdminPreviewBody data={data} />
    </div>
  );
}

export { KIND_LABELS };

export function AdminPreviewPaneConnected({ className }: { className?: string }) {
  const { selected } = useAdminPreview();
  return (
    <AdminPreviewPane className={className}>
      <AdminPreviewPaneContent data={selected} />
    </AdminPreviewPane>
  );
}
