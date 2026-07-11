import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Award,
  Building2,
  Calendar,
  CalendarDays,
  Flag,
  Gift,
  LayoutDashboard,
  Settings2,
  Sparkles,
  Trophy,
  Users,
  Film,
  AlertTriangle,
} from "lucide-react";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  section?: "main" | "content" | "system";
};

export const adminNav: AdminNavItem[] = [
  { href: "/admin", label: "Обзор", icon: LayoutDashboard, section: "main" },
  { href: "/admin/users", label: "Пользователи", icon: Users, section: "main" },
  { href: "/admin/posts", label: "Посты", icon: Activity, section: "content" },
  { href: "/admin/feed", label: "Лента", icon: Sparkles, section: "content" },
  { href: "/admin/challenges", label: "Челленджи", icon: Trophy, section: "content" },
  { href: "/admin/events", label: "События", icon: Calendar, section: "content" },
  { href: "/admin/social", label: "Спор и соц", icon: Flag, section: "content" },
  { href: "/admin/wishlists", label: "Вишлисты", icon: Gift, section: "content" },
  { href: "/admin/media", label: "Медиа", icon: Film, section: "content" },
  { href: "/admin/calendar", label: "Календарь", icon: CalendarDays, section: "content" },
  { href: "/admin/reports", label: "Жалобы", icon: AlertTriangle, section: "content" },
  { href: "/admin/clubs", label: "Клубы", icon: Building2, section: "content" },
  { href: "/admin/achievements", label: "Достижения", icon: Award, section: "content" },
  { href: "/admin/system", label: "Система", icon: Settings2, section: "system" },
];

export const adminNavSections = [
  { key: "main" as const, label: "Платформа" },
  { key: "content" as const, label: "Контент" },
  { key: "system" as const, label: "Сервис" },
];

export function adminNavLabel(pathname: string) {
  if (pathname === "/admin") return "Обзор";
  const hit = adminNav.find((n) => n.href !== "/admin" && pathname.startsWith(n.href));
  return hit?.label ?? "Админ";
}
