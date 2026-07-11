"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";

const WORD = "ДВЖ";
const STORAGE_KEY = "dvizh_splash_v1";

type Phase = "boot" | "typing" | "enterReveal" | "cursorMove" | "click" | "done";

function SplashCursor({ pressing }: { pressing: boolean }) {
  return (
    <motion.svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      animate={{ scale: pressing ? 0.82 : 1 }}
      transition={{ duration: 0.12, ease: [0.34, 1.56, 0.64, 1] }}
      className="drop-shadow-[0_4px_12px_rgba(0,0,0,0.55)]"
      aria-hidden
    >
      <path
        d="M4 3L4 22L9.5 16.5L14 24L17.5 22.5L13 15L20 14L4 3Z"
        fill="#F0EEE8"
        stroke="#08080D"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M4 3L4 22L9.5 16.5L14 24L17.5 22.5L13 15L20 14L4 3Z" fill="#C8FF57" fillOpacity={pressing ? 0.35 : 0} />
    </motion.svg>
  );
}

export function SplashGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>("boot");
  const [visible, setVisible] = useState(false);
  const [typed, setTyped] = useState("");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [cursor, setCursor] = useState({ x: 0, y: 0, show: false });
  const [pressing, setPressing] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const enterRef = useRef<HTMLButtonElement>(null);

  const finish = useCallback(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* private mode */
    }
    setVisible(false);
  }, []);

  useEffect(() => {
    if (pathname.startsWith("/admin")) {
      setPhase("done");
      return;
    }

    let skip = false;
    try {
      skip = sessionStorage.getItem(STORAGE_KEY) === "1" || localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      skip = false;
    }
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReducedMotion(prefersReduced);

    if (skip) {
      setPhase("done");
      return;
    }

    setVisible(true);
    if (prefersReduced) {
      setTyped(WORD);
      setPhase("enterReveal");
      return;
    }

    setPhase("typing");
  }, [pathname]);

  useEffect(() => {
    if (!visible) return;
    const t = window.setTimeout(() => finish(), 3500);
    return () => window.clearTimeout(t);
  }, [visible, finish]);

  useEffect(() => {
    if (phase !== "typing") return;
    if (typed.length >= WORD.length) {
      setPhase("enterReveal");
      return;
    }
    const delay = typed.length === 0 ? 280 : 95 + Math.random() * 40;
    const t = window.setTimeout(() => {
      setTyped(WORD.slice(0, typed.length + 1));
    }, delay);
    return () => window.clearTimeout(t);
  }, [phase, typed]);

  useEffect(() => {
    if (phase !== "enterReveal") return;
    const delay = reducedMotion ? 200 : 520;
    const t = window.setTimeout(() => setPhase("cursorMove"), delay);
    return () => window.clearTimeout(t);
  }, [phase, reducedMotion]);

  useEffect(() => {
    if (phase !== "cursorMove") return;

    const root = rootRef.current;
    const enterEl = enterRef.current;
    if (!root || !enterEl) {
      finish();
      return;
    }

    const rootRect = root.getBoundingClientRect();
    const enterRect = enterEl.getBoundingClientRect();

    const targetX = enterRect.left - rootRect.left + enterRect.width * 0.72;
    const targetY = enterRect.top - rootRect.top + enterRect.height * 0.55;
    const startX = rootRect.width * 0.78;
    const startY = rootRect.height * 0.72;

    setCursor({ x: startX, y: startY, show: true });

    const moveMs = reducedMotion ? 0 : 700;
    const t1 = window.setTimeout(() => {
      setCursor({ x: targetX, y: targetY, show: true });
    }, 40);

    const t2 = window.setTimeout(() => setPhase("click"), moveMs + 80);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [phase, reducedMotion, finish]);

  useEffect(() => {
    if (phase !== "click") return;
    setPressing(true);
    const t = window.setTimeout(() => finish(), reducedMotion ? 120 : 280);
    return () => window.clearTimeout(t);
  }, [phase, reducedMotion, finish]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && visible) {
        e.preventDefault();
        finish();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, finish]);

  const showEnter = phase !== "typing" && phase !== "boot";
  const showCaret = phase === "typing";

  return (
    <>
      {children}

      <AnimatePresence onExitComplete={() => setPhase("done")}>
        {visible && (
          <motion.div
            ref={rootRef}
            key="splash"
            role="dialog"
            aria-label="Загрузка ДВЖ"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: reducedMotion ? 0.08 : 0.38, ease: [0.22, 1, 0.36, 1] }}
            onClick={finish}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") finish(); }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#08080D] cursor-pointer select-none overflow-hidden"
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.035]"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
              }}
            />

            <p className="absolute bottom-8 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">
              Нажми anywhere · Enter
            </p>

            <div className="relative flex flex-col items-center gap-10 pointer-events-none">
              <div className="flex items-baseline font-mono text-[clamp(2rem,8vw,3.25rem)] leading-none tracking-tight">
                <span className="text-muted-foreground/50 font-sans text-[0.55em] mr-1">&gt;</span>
                <span className="font-heading text-neon-lime -skew-x-3">{typed}</span>
                <span
                  className={showCaret ? "animate-splash-blink" : "opacity-0"}
                  style={{
                    display: "inline-block",
                    width: "0.55em",
                    height: "0.9em",
                    marginLeft: "0.125rem",
                    backgroundColor: "#C8FF57",
                    verticalAlign: "middle",
                  }}
                />
              </div>

              <motion.button
                ref={enterRef}
                type="button"
                tabIndex={-1}
                initial={{ opacity: 0, y: 8 }}
                animate={{
                  opacity: showEnter ? 1 : 0,
                  y: showEnter ? 0 : 8,
                  scale: pressing ? 0.94 : 1,
                }}
                transition={{
                  opacity: { duration: 0.25 },
                  y: { duration: 0.25 },
                  scale: { duration: 0.12 },
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-white/[0.12] bg-white/[0.05] px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground pointer-events-none"
              >
                <span
                  className="inline-flex h-6 min-w-[2.25rem] items-center justify-center rounded-md border border-white/[0.14] bg-[#14141c] px-1.5 text-[10px] text-lime shadow-[inset_0_-2px_0_rgba(0,0,0,0.35)]"
                  style={{ transform: pressing ? "translateY(1px)" : undefined }}
                >
                  ↵
                </span>
                enter
              </motion.button>
            </div>

            <motion.div
              className="pointer-events-none absolute left-0 top-0 z-10"
              initial={false}
              animate={{
                x: cursor.x,
                y: cursor.y,
                opacity: cursor.show ? 1 : 0,
              }}
              transition={{
                x: { duration: reducedMotion ? 0 : 0.7, ease: [0.22, 1, 0.36, 1] },
                y: { duration: reducedMotion ? 0 : 0.7, ease: [0.22, 1, 0.36, 1] },
                opacity: { duration: 0.2 },
              }}
            >
              <SplashCursor pressing={pressing} />
            </motion.div>

            {pressing && (
              <motion.div
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1.6 }}
                transition={{ duration: 0.35 }}
                className="pointer-events-none absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-lime/[0.08] blur-3xl"
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
