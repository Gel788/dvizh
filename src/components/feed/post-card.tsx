"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { motion, AnimatePresence } from "motion/react";
import {
  BadgeCheck, Heart, MapPin, MessageCircle, Repeat2,
  Target, UserCheck, Megaphone, Zap,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { parseTags } from "@/lib/geo";
import {
  toggleLikeAction, toggleGoingAction, repostAction, joinChallengeAction, leaveChallengeAction,
} from "@/lib/actions";
import { copyPostToDiaryAction } from "@/lib/diary-actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { PostType } from "@prisma/client";

type PostData = {
  id: string;
  type: PostType;
  title: string | null;
  content: string;
  city: string;
  district: string | null;
  tags: string;
  images?: string;
  featuredInFeed?: boolean;
  contactInfo?: string | null;
  createdAt: Date;
  author: {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
    verified: boolean;
    city: string;
    district: string | null;
  };
  challenge?: {
    id: string;
    goalCount: number;
    deadline: Date | null;
    isBusiness: boolean;
    businessName: string | null;
    reward: string | null;
    isSeasonal: boolean;
    seasonName: string | null;
    participants?: { id: string }[];
    _count: { reports: number; participants?: number };
  } | null;
  _count: { likes: number; comments: number; going: number; reposts: number };
  likes?: { id: string }[];
  going?: { id: string }[];
};

const typeConfig = {
  ACTIVITY:     { label: "Движ",      icon: Zap,      chipClass: "chip-lime" },
  CHALLENGE:    { label: "Челлендж",  icon: Target,   chipClass: "chip-heat" },
  ANNOUNCEMENT: { label: "Объява",    icon: Megaphone, chipClass: "chip-ice" },
};

import { spring } from "@/lib/motion-spring";

export function PostCard({ post, index = 0, showAddToDiary = false }: { post: PostData; index?: number; showAddToDiary?: boolean }) {
  const config = typeConfig[post.type];
  const TypeIcon = config.icon;
  const [liked, setLiked] = useState((post.likes?.length ?? 0) > 0);
  const [likeCount, setLikeCount] = useState(post._count.likes);
  const [likePop, setLikePop] = useState(false);
  const [going, setGoing] = useState((post.going?.length ?? 0) > 0);
  const [goingCount, setGoingCount] = useState(post._count.going);
  const [challengeJoined, setChallengeJoined] = useState((post.challenge?.participants?.length ?? 0) > 0);
  const [joinBusy, setJoinBusy] = useState(false);
  const tags = parseTags(post.tags ?? "");
  const isSponsored = tags.includes("sponsored") || post.featuredInFeed;
  const images = (post.images ?? "").split(",").map((s) => s.trim()).filter(Boolean);

  async function handleLike() {
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    if (next) {
      setLikePop(true);
      setTimeout(() => setLikePop(false), 400);
    }
    await toggleLikeAction(post.id);
  }

  async function handleChallengeJoin() {
    if (!post.challenge || joinBusy) return;
    setJoinBusy(true);
    const next = !challengeJoined;
    setChallengeJoined(next);
    try {
      if (next) {
        await joinChallengeAction(post.challenge.id);
        toast.success("Ты в челлендже");
      } else {
        await leaveChallengeAction(post.challenge.id);
        toast.message("Участие отменено");
      }
    } catch {
      setChallengeJoined(!next);
      toast.error("Не удалось обновить участие");
    } finally {
      setJoinBusy(false);
    }
  }

  async function handleGoing() {
    const next = !going;
    setGoing(next);
    setGoingCount((c) => c + (next ? 1 : -1));
    await toggleGoingAction(post.id);
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring.default, delay: index * 0.05 }}
      whileHover={{ y: -3 }}
      className={cn(
        "card-surface group t-card-press overflow-hidden",
        post.type === "ACTIVITY" && "border-l-[3px] border-l-lime",
        post.type === "CHALLENGE" && "border-l-[3px] border-l-heat",
        post.type === "ANNOUNCEMENT" && "border-l-[3px] border-l-ice",
        isSponsored && "border-l-[3px] border-l-[#FFB020] ring-1 ring-[#FFB020]/20",
        index === 0 && "xl:border-lime/15 xl:shadow-[0_20px_50px_rgba(0,0,0,0.35),0_0_0_1px_rgba(200,255,87,0.08)]",
      )}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start gap-3">
          <Link href={`/profile/${post.author.username}`} className="shrink-0 cursor-pointer">
            <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.95 }} transition={spring.snappy}>
              <Avatar className="h-11 w-11 ring-1 ring-white/[0.08] transition-all duration-200 group-hover:ring-lime/25">
                <AvatarImage src={post.author.avatar ?? undefined} />
                <AvatarFallback className="bg-muted text-muted-foreground text-xs font-bold">
                  {post.author.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </motion.div>
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <Link
                href={`/profile/${post.author.username}`}
                className="font-bold text-sm hover:text-lime transition-colors cursor-pointer inline-flex items-center gap-1"
              >
                {post.author.name}
                {post.author.verified && (
                  <BadgeCheck className="h-3.5 w-3.5 text-ice" />
                )}
              </Link>
              <span className="text-muted-foreground text-xs">@{post.author.username}</span>
              <span className="text-border text-xs">·</span>
              <time className="text-muted-foreground text-xs">
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: ru })}
              </time>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className={cn("chip text-[10px] font-bold", config.chipClass)}>
                <TypeIcon className="h-3 w-3" />
                {config.label}
              </span>
              {isSponsored && (
                <span className="chip text-[10px] font-bold bg-[#FFB020]/15 text-[#FFB020] border border-[#FFB020]/30">
                  ⭐ Спонсор
                </span>
              )}
              {(post.district || post.city) && (
                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                  <MapPin className="h-2.5 w-2.5" />
                  {[post.district, post.city].filter(Boolean).join(", ")}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <Link href={`/post/${post.id}`} className="block mt-4 cursor-pointer">
          {post.title && (
            <h3 className="font-heading text-xl mb-2 normal-case tracking-normal leading-snug group-hover:text-lime transition-colors duration-200">
              {post.title}
            </h3>
          )}
          <p className="text-sm leading-relaxed text-foreground/75 line-clamp-4 whitespace-pre-wrap">
            {post.content}
          </p>
          {post.contactInfo && (
            <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3 shrink-0" />
              {post.contactInfo}
            </p>
          )}
          {images.length > 0 && (
            <div className="mt-3 grid gap-2">
              {images.slice(0, 3).map((src) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={src} src={src} alt="" className="w-full max-h-64 rounded-xl object-cover" />
              ))}
            </div>
          )}
        </Link>

        {/* Challenge block */}
        {post.challenge && (
          <div className="mt-4 rounded-xl border border-heat/15 bg-heat/[0.04] p-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              {post.challenge.isBusiness && post.challenge.businessName && (
                <span className="chip chip-heat text-[10px]">{post.challenge.businessName}</span>
              )}
              {post.challenge.reward && (
                <span className="chip text-[10px] border-lime/25 bg-lime/8 text-lime">
                  🏆 {post.challenge.reward}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{post.challenge.participants?.length ?? post.challenge._count.participants ?? 0} участников</span>
              <span>{post.challenge._count.reports ?? 0} / {post.challenge.goalCount} отчётов</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${Math.min(100, (post.challenge._count.reports / post.challenge.goalCount) * 100)}%`
                }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="h-full bg-gradient-to-r from-lime to-[#9AFF00] rounded-full"
              />
            </div>
            <button
              type="button"
              disabled={joinBusy}
              onClick={handleChallengeJoin}
              className={cn(
                "btn-action py-2 px-4 text-xs w-full transition-colors",
                challengeJoined
                  ? "border border-white/15 bg-white/[0.04] text-foreground hover:bg-white/[0.08]"
                  : "btn-action-heat",
              )}
            >
              {joinBusy ? "…" : challengeJoined ? "Отменить участие" : "Принять челлендж"}
            </button>
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {tags.map((tag) => (
              <Link
                key={tag}
                href={`/?tag=${tag}`}
                className="chip text-[10px] hover:border-lime/30 hover:bg-lime/8 hover:text-lime transition-colors duration-150 cursor-pointer"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-0.5 mt-5 pt-4 border-t border-white/[0.05]">
          {/* Like — Game Impact */}
          <motion.button
            type="button"
            onClick={handleLike}
            whileTap={{ scale: 0.85 }}
            transition={spring.bouncy}
            className={cn(
              "relative flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors duration-200 cursor-pointer",
              liked
                ? "text-heat bg-heat/10"
                : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
            )}
          >
            <AnimatePresence>
              {likePop && (
                <motion.span
                  key="burst"
                  initial={{ scale: 0, opacity: 1 }}
                  animate={{ scale: 2.2, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="absolute inset-0 rounded-xl bg-heat/20 pointer-events-none"
                />
              )}
            </AnimatePresence>
            <motion.span
              animate={liked ? { scale: [1, 1.4, 0.9, 1.05, 1] } : { scale: 1 }}
              transition={{ duration: 0.4, times: [0, 0.2, 0.5, 0.8, 1] }}
            >
              <Heart className={cn("h-4 w-4", liked && "fill-current")} />
            </motion.span>
            {likeCount > 0 && <span>{likeCount}</span>}
          </motion.button>

          {/* Comments */}
          <Link href={`/post/${post.id}`}>
            <motion.span
              whileTap={{ scale: 0.9 }}
              transition={spring.snappy}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-colors duration-200 cursor-pointer"
            >
              <MessageCircle className="h-4 w-4" />
              {post._count.comments > 0 && post._count.comments}
            </motion.span>
          </Link>

          {/* Repost */}
          <form action={repostAction.bind(null, post.id)}>
            <motion.button
              type="submit"
              whileTap={{ scale: 0.9 }}
              transition={spring.snappy}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-lime hover:bg-lime/[0.06] transition-colors duration-200 cursor-pointer"
            >
              <Repeat2 className="h-4 w-4" />
              {post._count.reposts > 0 && post._count.reposts}
            </motion.button>
          </form>

          {/* Going */}
          {(post.type === "ACTIVITY" || post.type === "ANNOUNCEMENT") && (
            <motion.button
              type="button"
              onClick={handleGoing}
              whileTap={{ scale: 0.9 }}
              transition={spring.snappy}
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors duration-200 cursor-pointer",
                going
                  ? "text-lime bg-lime/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]",
                showAddToDiary ? "" : "ml-auto",
              )}
            >
              <UserCheck className="h-4 w-4" />
              {going ? "Иду" : "Пойду"}
              {goingCount > 0 && ` · ${goingCount}`}
            </motion.button>
          )}
          {showAddToDiary && post.type === "ACTIVITY" && (
            <button
              type="button"
              onClick={() => {
                void copyPostToDiaryAction(post.id).then(() => toast.success("Добавлено в дневник"));
              }}
              className="ml-auto flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-lime bg-lime/10 hover:bg-lime/15 transition-colors cursor-pointer"
            >
              Добавить себе
            </button>
          )}
        </div>
      </div>
    </motion.article>
  );
}
