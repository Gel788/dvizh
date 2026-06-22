"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import {
  BadgeCheck, Heart, MapPin, MessageCircle, Repeat2,
  Target, UserCheck, Megaphone, Zap,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { parseTags } from "@/lib/geo";
import {
  toggleLikeAction, toggleGoingAction, repostAction, joinChallengeAction,
} from "@/lib/actions";
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
    participants: { id: string }[];
    _count: { reports: number };
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

/* spring tokens from MOTION.md */
const spring = {
  snappy:  { type: "spring" as const, stiffness: 520, damping: 34 },
  default: { type: "spring" as const, stiffness: 360, damping: 30 },
  bouncy:  { type: "spring" as const, stiffness: 420, damping: 18 },
};

export function PostCard({ post, index = 0 }: { post: PostData; index?: number }) {
  const config = typeConfig[post.type];
  const TypeIcon = config.icon;
  const [liked, setLiked] = useState((post.likes?.length ?? 0) > 0);
  const [likeCount, setLikeCount] = useState(post._count.likes);
  const [likePop, setLikePop] = useState(false);
  const [going, setGoing] = useState((post.going?.length ?? 0) > 0);
  const [goingCount, setGoingCount] = useState(post._count.going);
  const tags = parseTags(post.tags);

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
      className="card-surface group"
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
              <span>{post.challenge.participants.length} участников</span>
              <span>{post.challenge._count.reports} / {post.challenge.goalCount} отчётов</span>
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
            <form action={joinChallengeAction.bind(null, post.challenge.id)}>
              <button
                type="submit"
                className="btn-action btn-action-heat py-2 px-4 text-xs w-full"
              >
                Принять челлендж
              </button>
            </form>
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
                "ml-auto flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors duration-200 cursor-pointer",
                going
                  ? "text-lime bg-lime/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
              )}
            >
              <UserCheck className="h-4 w-4" />
              {going ? "Иду" : "Пойду"}
              {goingCount > 0 && ` · ${goingCount}`}
            </motion.button>
          )}
        </div>
      </div>
    </motion.article>
  );
}
