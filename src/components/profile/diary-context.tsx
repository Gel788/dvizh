"use client";

import {
  createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode,
} from "react";
import { toast } from "sonner";
import {
  PERIODS, TASK_ACHIEVEMENTS, levelInfo, rankName,
  type DiaryPeriod, type DiaryTask, type TaskVisibility, type AchievementPop,
} from "./profile-data";
import { parseDayKey, todayKey } from "@/lib/diary-day-utils";
import {
  completeDiaryTaskAction,
  createDiaryTaskAction,
  reorderTasksAction,
  fetchCalendarAction,
  type DiaryBundle,
} from "@/lib/diary-actions";
import { rankName as rankFromLib } from "@/lib/gamification";

type TasksState = Record<DiaryPeriod, DiaryTask[]>;

type DiaryContextValue = DiaryBundle & {
  period: DiaryPeriod;
  setPeriod: (p: DiaryPeriod) => void;
  tasks: TasksState;
  diaryView: "list" | "calendar";
  setDiaryView: (v: "list" | "calendar") => void;
  sheetOpen: boolean;
  openSheet: () => void;
  closeSheet: () => void;
  toggleTask: (id: string) => void;
  addTask: (input: {
    text: string; note?: string; period: DiaryPeriod; visibility: TaskVisibility;
    hashtag?: string; dueDate?: string; isRecurring?: boolean; recurrence?: string;
    trackStreak?: boolean; reminderAt?: string; checklist?: string[]; multiLine?: boolean;
    hashtagColor?: string; priority?: boolean; askProof?: boolean;
    hasTime?: boolean; scheduledAt?: string;
  }) => void;
  reorderTasks: (period: DiaryPeriod, ids: string[]) => void;
  loadCalendar: (year: number, month: number) => Promise<void>;
  achievementQueue: AchievementPop[];
  dismissAchievement: () => void;
  plannerDayKey: string;
  effectivePlannerDayKey: string;
  plannerDay: Date;
  plannerIsToday: boolean;
  selectPlannerDay: (dayKey: string) => Promise<void>;
};

const DiaryContext = createContext<DiaryContextValue | null>(null);

export function useDiary() {
  const ctx = useContext(DiaryContext);
  if (!ctx) throw new Error("useDiary вне DiaryProvider");
  return ctx;
}

const ACH_MAP: Record<string, AchievementPop> = {
  "tasks-1": { emoji: "👣", title: "Первый шаг", description: "Первая задача выполнена", color: "#C8FF57" },
  "streak-7": { emoji: "🔥", title: "Неделя в движе", description: "Стрик 7 дней", color: "#FF2D55" },
};

export function DiaryProvider({ initial, children }: { initial: DiaryBundle; children: ReactNode }) {
  const [xp, setXp] = useState(initial.xp);
  const [level, setLevel] = useState(initial.level);
  const [period, setPeriod] = useState<DiaryPeriod>("today");
  const [diaryView, setDiaryView] = useState<"list" | "calendar">("list");
  const [tasks, setTasks] = useState<TasksState>(() => initial.tasks as TasksState);
  const [calendar, setCalendar] = useState(initial.calendar);
  const [periodFrames, setPeriodFrames] = useState(initial.periodFrames ?? {});
  const [diaryDay, setDiaryDay] = useState(initial.diaryDay ?? "");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [achievementQueue, setAchievementQueue] = useState<AchievementPop[]>([]);
  const [plannerDayKey, setPlannerDayKey] = useState("");

  useEffect(() => {
    const tz = -new Date().getTimezoneOffset();
    void fetch(`/api/v1/profile/diary?tzOffset=${tz}`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { diary?: DiaryBundle } | null) => {
        const diary = data?.diary;
        if (!diary?.tasks) return;
        setTasks(diary.tasks as TasksState);
        setXp(diary.xp);
        setLevel(diary.level);
        setPeriodFrames(diary.periodFrames ?? {});
        setDiaryDay(diary.diaryDay ?? "");
      })
      .catch(() => {});
  }, []);

  const openSheet = useCallback(() => setSheetOpen(true), []);
  const closeSheet = useCallback(() => setSheetOpen(false), []);

  const dismissAchievement = useCallback(() => {
    setAchievementQueue((q) => q.slice(1));
  }, []);

  const queueAchievement = useCallback((ach: AchievementPop) => {
    setAchievementQueue((q) => [...q, ach]);
  }, []);

  const toggleTask = useCallback((id: string) => {
    let taskPeriod: DiaryPeriod | null = null;
    let task: DiaryTask | undefined;
    for (const p of Object.keys(tasks) as DiaryPeriod[]) {
      const found = tasks[p].find((t) => t.id === id);
      if (found) {
        task = found;
        taskPeriod = p;
        break;
      }
    }
    if (!task || !taskPeriod || task.done) return;

    const gain = PERIODS[taskPeriod].xp;
    const beforeLevel = levelInfo(xp).level;

    setTasks((prev) => ({
      ...prev,
      [taskPeriod]: prev[taskPeriod].map((t) => (t.id === id ? { ...t, done: true } : t)),
    }));

    void completeDiaryTaskAction(id).then((res) => {
      if (!res) {
        setTasks((prev) => ({
          ...prev,
          [taskPeriod]: prev[taskPeriod].map((t) => (t.id === id ? { ...t, done: false } : t)),
        }));
        toast.error("Не удалось сохранить задачу");
        return;
      }
      const actualGain = res.xpGain || gain;
      setXp((x) => x + actualGain);
      if (res.levelUp && res.newLevel) {
        setLevel(res.newLevel);
        toast.success(`🎉 Новый уровень ${res.newLevel} — «${rankFromLib(res.newLevel)}»`);
      } else if (levelInfo(xp + gain).level > beforeLevel) {
        toast.success(`🎉 Новый уровень — «${rankName(levelInfo(xp + gain).level)}»`);
      }
      if (TASK_ACHIEVEMENTS[id]) queueAchievement(TASK_ACHIEVEMENTS[id]);
      for (const slug of res.achievements ?? []) {
        const pop = ACH_MAP[slug] ?? { emoji: "🏆", title: "Новая ачивка", description: slug, color: "#C8FF57" };
        queueAchievement(pop);
      }
    }).catch(() => {
      setTasks((prev) => ({
        ...prev,
        [taskPeriod]: prev[taskPeriod].map((t) => (t.id === id ? { ...t, done: false } : t)),
      }));
      toast.error("Не удалось сохранить задачу");
    });
  }, [xp, tasks, queueAchievement]);

  const addTask = useCallback((input: Parameters<DiaryContextValue["addTask"]>[0]) => {
    void createDiaryTaskAction({
      ...input,
      period: input.period,
      visibility: input.visibility,
    }).then((created) => {
      if (!created?.length) {
        toast.error("Не удалось добавить задачу");
        return;
      }
      setTasks((prev) => ({
        ...prev,
        [input.period]: [
          ...created.map((t) => ({
            id: t.id,
            text: t.text,
            note: t.note,
            tag: t.tag,
            visibility: t.visibility,
            done: false,
            dueDate: t.dueDate,
            isRecurring: t.isRecurring,
            checklist: t.checklist,
          })),
          ...(prev[input.period] ?? []),
        ],
      }));
      setPeriod(input.period);
      setSheetOpen(false);
      toast.success(created.length > 1 ? `Добавлено задач: ${created.length}` : "Задача добавлена в дневник");
    }).catch(() => toast.error("Не удалось добавить задачу"));
  }, []);

  const loadCalendar = useCallback(async (year: number, month: number) => {
    const tz = -new Date().getTimezoneOffset();
    const data = await fetchCalendarAction(year, month, tz);
    if (data) setCalendar(data);
  }, []);

  const effectivePlannerDayKey = plannerDayKey || todayKey();
  const plannerDay = parseDayKey(effectivePlannerDayKey);
  const plannerIsToday = effectivePlannerDayKey === todayKey();

  const selectPlannerDay = useCallback(async (key: string) => {
    setPlannerDayKey(key);
    const d = parseDayKey(key);
    if (calendar.year !== d.getFullYear() || calendar.month !== d.getMonth()) {
      await loadCalendar(d.getFullYear(), d.getMonth());
    }
  }, [calendar, loadCalendar]);

  const reorderTasks = useCallback((p: DiaryPeriod, ids: string[]) => {
    setTasks((prev) => {
      const map = new Map(prev[p].map((t) => [t.id, t]));
      return { ...prev, [p]: ids.map((id) => map.get(id)).filter(Boolean) as DiaryTask[] };
    });
    void reorderTasksAction(p, ids);
  }, []);

  const value = useMemo(() => ({
    ...initial,
    calendar,
    xp, level, period, setPeriod, tasks, diaryView, setDiaryView,
    periodFrames, diaryDay,
    sheetOpen, openSheet, closeSheet, toggleTask, addTask, reorderTasks, loadCalendar,
    achievementQueue, dismissAchievement,
    plannerDayKey, effectivePlannerDayKey, plannerDay, plannerIsToday, selectPlannerDay,
  }), [
    initial, calendar, xp, level, period, tasks, diaryView, sheetOpen,
    periodFrames, diaryDay,
    openSheet, closeSheet, toggleTask, addTask, reorderTasks, loadCalendar,
    achievementQueue, dismissAchievement,
    plannerDayKey, effectivePlannerDayKey, plannerDay, plannerIsToday, selectPlannerDay,
  ]);

  return <DiaryContext.Provider value={value}>{children}</DiaryContext.Provider>;
}
