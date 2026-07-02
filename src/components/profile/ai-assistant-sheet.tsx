"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Zap, X, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

type AiAction = { type: string; screen?: string };

const STARTERS = [
  "Добавь задачу: пробежка 5 км",
  "Что у меня на сегодня?",
  "Открой дневник",
];

const SCREEN_PATHS: Record<string, string> = {
  feed: "/",
  dvizh: "/nearby",
  diary: "/profile/demo",
  challenges: "/challenges",
  profile: "/profile/demo",
  map: "/map",
};

function applyAiActions(actions: AiAction[] | undefined, router: ReturnType<typeof useRouter>) {
  if (!actions?.length) return;
  let refresh = false;
  for (const a of actions) {
    if (a.type === "sync_diary") refresh = true;
    if (a.type === "navigate" && a.screen) {
      const path = SCREEN_PATHS[a.screen];
      if (path) router.push(path);
    }
  }
  if (refresh) router.refresh();
}

export function AiAssistantSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(true);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    fetch("/api/v1/ai/chat", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setEnabled(d?.enabled !== false))
      .catch(() => setEnabled(false));
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || pending || !enabled) return;
    setError(null);
    setInput("");
    const nextMessages: Msg[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);

    startTransition(async () => {
      try {
        const res = await fetch("/api/v1/ai/chat", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmed, history: messages }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.error ?? "Не удалось получить ответ");
          return;
        }
        applyAiActions(Array.isArray(data.actions) ? data.actions : undefined, router);
        setMessages([...nextMessages, { role: "assistant", content: data.reply as string }]);
      } catch {
        setError("Нет связи с сервером");
      }
    });
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 32 }}
        className="w-full max-w-lg rounded-t-[28px] bg-popover border-t border-white/[0.08] max-h-[88vh] flex flex-col overflow-hidden shadow-[0_-12px_48px_rgba(200,255,0,0.06)]"
      >
        <div className="px-5 pt-3 pb-4 bg-gradient-to-b from-lime/[0.12] to-transparent">
          <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-white/15" />
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-[14px] bg-lime/20 text-lime border border-lime/30">
                <Zap className="h-5 w-5" />
              </span>
              <div>
                <p className="font-black text-base tracking-tight">Движ ИИ</p>
                <p className="text-[11px] text-muted-foreground font-semibold">
                  {enabled ? "План дня · задачи · мотивация" : "Скоро будет доступен"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="h-9 w-9 rounded-xl border border-white/[0.08] bg-white/[0.04] grid place-items-center text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-2 space-y-3 min-h-[200px]">
          {messages.length === 0 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground font-semibold">Спроси про задачи, план или мотивацию</p>
              <div className="flex flex-wrap gap-2">
                {STARTERS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={!enabled || pending}
                    onClick={() => send(s)}
                    className="text-xs font-bold px-3.5 py-2 rounded-full border border-white/[0.08] bg-white/[0.04] hover:border-lime/35 hover:bg-lime/[0.06] cursor-pointer disabled:opacity-40 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          <AnimatePresence initial={false}>
            {messages.map((m, i) => (
              <motion.div
                key={`${i}-${m.role}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                  m.role === "user"
                    ? "ml-auto bg-lime text-lime-foreground font-semibold shadow-[0_4px_16px_rgba(200,255,0,0.2)] rounded-br-md"
                    : "bg-white/[0.06] text-foreground border border-white/[0.06] rounded-bl-md",
                )}
              >
                {m.content}
              </motion.div>
            ))}
          </AnimatePresence>
          {pending && <p className="text-xs text-muted-foreground animate-pulse font-semibold">Движ думает…</p>}
          {error && <p className="text-xs text-heat">{error}</p>}
          <div ref={bottomRef} />
        </div>

        <div className="p-4 border-t border-white/[0.06] flex gap-2.5 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            rows={1}
            placeholder={enabled ? "Спроси Движ ИИ…" : "ИИ не настроен на сервере"}
            disabled={!enabled || pending}
            className="flex-1 min-h-11 max-h-28 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5 text-sm outline-none focus:border-lime/45 disabled:opacity-50 resize-none"
          />
          <button
            type="button"
            disabled={!enabled || pending || !input.trim()}
            onClick={() => send(input)}
            className="h-11 w-11 shrink-0 rounded-2xl bg-lime text-lime-foreground grid place-items-center disabled:opacity-40 cursor-pointer"
          >
            <ArrowUp className="h-5 w-5" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export function AiAssistantButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 w-full rounded-[18px] border border-lime/30 bg-gradient-to-r from-lime/15 to-transparent px-4 py-3.5 text-left cursor-pointer hover:border-lime/45 transition-colors"
    >
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-lime/20 text-lime">
        <Zap className="h-4 w-4" />
      </span>
      <span className="flex-1">
        <span className="block text-sm font-black tracking-tight text-lime">Движ ИИ</span>
        <span className="block text-[11px] text-muted-foreground font-semibold">План · задачи · мотивация</span>
      </span>
      <span className="text-lime text-lg">›</span>
    </button>
  );
}
