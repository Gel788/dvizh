import Link from "next/link";
import { redirect } from "next/navigation";
import { Shield, ArrowLeft } from "lucide-react";
import { adminLoginAction } from "@/lib/admin/actions";
import { getSession, isAdmin } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const session = await getSession();
  if (session && isAdmin(session)) redirect("/admin");

  return (
    <div className="min-h-screen bg-[#050508] flex items-center justify-center p-4">
      <div className="pointer-events-none fixed top-0 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-heat/[0.08] blur-[120px]" />
      <div className="pointer-events-none fixed bottom-0 right-0 h-[300px] w-[300px] rounded-full bg-lime/[0.04] blur-[100px]" />

      <div className="relative w-full max-w-md">
        <div className="rounded-2xl border border-heat/20 bg-[#0A0A10]/95 backdrop-blur-xl p-8 shadow-[0_0_60px_rgba(217,79,43,0.08)]">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-heat/30 bg-heat/10">
              <Shield className="h-7 w-7 text-heat" />
            </div>
            <p className="font-heading text-3xl text-neon-lime leading-none">АДМИН</p>
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/35">
              центр управления · ДВИЖ
            </p>
          </div>

          <h2 className="font-bold text-base mb-1 text-center text-white/90">Вход для администраторов</h2>
          <p className="text-sm text-white/40 text-center mb-6">Доступ только с ролью ADMIN</p>

          {error === "invalid" && (
            <div className="mb-4 rounded-xl border border-heat/30 bg-heat/10 px-4 py-3 text-sm text-heat font-semibold text-center">
              Неверный email или пароль
            </div>
          )}
          {error === "not_admin" && (
            <div className="mb-4 rounded-xl border border-heat/30 bg-heat/10 px-4 py-3 text-sm text-heat font-semibold text-center">
              У этого аккаунта нет прав администратора
            </div>
          )}

          <form action={adminLoginAction} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-[0.12em] text-white/35">
                Email администратора
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="admin@dvizh.app"
                required
                autoComplete="username"
                className="h-11 rounded-xl border-white/[0.08] bg-white/[0.03] text-sm focus-visible:border-heat/40"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-bold uppercase tracking-[0.12em] text-white/35">
                Пароль
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="h-11 rounded-xl border-white/[0.08] bg-white/[0.03] text-sm focus-visible:border-heat/40"
              />
            </div>
            <button
              type="submit"
              className="w-full h-11 mt-2 rounded-xl bg-heat text-white font-bold text-sm hover:bg-heat/90 transition-colors cursor-pointer"
            >
              Войти в панель
            </button>
          </form>

          <div className="mt-5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-center">
            <p className="text-[10px] uppercase tracking-wider text-white/25 mb-1">тестовый доступ</p>
            <p className="text-xs text-white/45 font-mono">admin@dvizh.app · admin1234</p>
          </div>

          <Link
            href="/login"
            className="mt-6 flex items-center justify-center gap-2 text-sm text-white/35 hover:text-lime transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Обычный вход в приложение
          </Link>
        </div>
      </div>
    </div>
  );
}
