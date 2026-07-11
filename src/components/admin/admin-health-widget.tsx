"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "motion/react";
import { Activity, CheckCircle2, Loader2, Server, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type HealthState = "loading" | "ok" | "error";

export function AdminHealthWidget() {
  const [state, setState] = useState<HealthState>("loading");
  const [time, setTime] = useState<string | null>(null);
  const [latency, setLatency] = useState<number | null>(null);

  const ping = useCallback(async () => {
    setState("loading");
    const t0 = performance.now();
    try {
      const res = await fetch("/api/v1/health", { cache: "no-store" });
      const ms = Math.round(performance.now() - t0);
      setLatency(ms);
      if (!res.ok) {
        setState("error");
        return;
      }
      const json = (await res.json()) as { time?: string };
      setTime(json.time ?? null);
      setState("ok");
    } catch {
      setState("error");
      setLatency(null);
    }
  }, []);

  useEffect(() => {
    void ping();
    const id = window.setInterval(() => void ping(), 60_000);
    return () => window.clearInterval(id);
  }, [ping]);

  const Icon = state === "ok" ? CheckCircle2 : state === "error" ? XCircle : Loader2;

  return (
    <div className="admin-glass rounded-2xl p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Server className="h-4 w-4 text-ice" />
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">API v38</span>
        </div>
        <button
          type="button"
          onClick={() => void ping()}
          className="text-[10px] font-bold uppercase text-lime hover:underline cursor-pointer"
        >
          Ping
        </button>
      </div>

      <div className="flex items-center gap-3">
        <motion.div
          animate={state === "ok" ? { scale: [1, 1.08, 1] } : {}}
          transition={{ duration: 0.4 }}
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-xl ring-1",
            state === "ok" && "bg-good/15 text-good ring-good/30",
            state === "error" && "bg-heat/15 text-heat ring-heat/30",
            state === "loading" && "bg-white/5 text-muted-foreground ring-white/10",
          )}
        >
          <Icon className={cn("h-5 w-5", state === "loading" && "animate-spin")} />
        </motion.div>
        <div className="min-w-0">
          <p className="text-sm font-bold">
            {state === "ok" ? "Operational" : state === "error" ? "Unreachable" : "Checking…"}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {latency != null && `${latency} ms`}
            {time && ` · ${new Date(time).toLocaleTimeString("ru-RU")}`}
          </p>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        {["/feed", "/profile", "/move/activities"].map((ep) => (
          <span key={ep} className="rounded-md bg-white/[0.04] px-2 py-1 text-[9px] font-mono text-muted-foreground">
            {ep}
          </span>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <Activity className="h-3 w-3 text-good admin-pulse-dot" />
        Auto-refresh 60s
      </div>
    </div>
  );
}
