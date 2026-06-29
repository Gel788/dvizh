"use client";

import {
  createContext, useCallback, useContext, useMemo, useState, type ReactNode,
} from "react";
import { toast } from "sonner";
import {
  PERIODS, TASK_ACHIEVEMENTS, levelInfo, rankName,
  type DiaryPeriod, type DiaryTask, type TaskVisibility, type AchievementPop,
} from "./profile-data";
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
    hashtagColor?: string;
  }) => void;
  reorderTasks: (period: DiaryPeriod, ids: string[]) => void;
  loadCalendar: (year: number, month: number) => Promise<void>;
  achievementQueue: AchievementPop[];
  dismissAchievement: () => void;
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
  const [sheetOpen, setSheetOpen] = useState(false);
  const [achievementQueue, setAchievementQueue] = useState<AchievementPop[]>([]);

  const openSheet = useCallback(() => setSheetOpen(true), []);
  const closeSheet = useCallback(() => setSheetOpen(false), []);

  const dismissAchievement = useCallback(() => {
    setAchievementQueue((q) => q.slice(1));
  }, []);

  const queueAchievement = useCallback((ach: AchievementPop) => {
    setAchievementQueue((q) => [...q, ach]);
  }, []);

  const toggleTask = useCallback((id: string) => {
    const task = tasks[period].find((t) => t.id === id);
    if (!task || task.done) return;

    const gain = PERIODS[period].xp;
    const beforeLevel = levelInfo(xp).level;

    setTasks((prev) => ({
      ...prev,
      [period]: prev[period].map((t) => (t.id === id ? { ...t, done: true } : t)),
    }));

    void completeDiaryTaskAction(id).then((res) => {
      if (!res) {
        setTasks((prev) => ({
          ...prev,
          [period]: prev[period].map((t) => (t.id === id ? { ...t, done: false } : t)),
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
        [period]: prev[period].map((t) => (t.id === id ? { ...t, done: false } : t)),
      }));
      toast.error("Не удалось сохранить задачу");
    });
  }, [xp, period, tasks, queueAchievement]);

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
    const data = await fetchCalendarAction(year, month);
    if (data) setCalendar(data);
  }, []);

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
    sheetOpen, openSheet, closeSheet, toggleTask, addTask, reorderTasks, loadCalendar,
    achievementQueue, dismissAchievement,
  }), [
    initial, calendar, xp, level, period, tasks, diaryView, sheetOpen,
    openSheet, closeSheet, toggleTask, addTask, reorderTasks, loadCalendar,
    achievementQueue, dismissAchievement,
  ]);

  return <DiaryContext.Provider value={value}>{children}</DiaryContext.Provider>;
}
