import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Shield } from "lucide-react";
import { adminLoginAction } from "@/lib/admin/actions";
import { getSession, isAdmin } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const session = await getSession();
  if (session && isAdmin(session)) redirect("/admin");

  return (
    <div className="admin-login relative flex min-h-screen items-center justify-center bg-background p-4">
      <div className="pointer-events-none absolute inset-0 dvizh-grid opacity-60" />

      <div className="relative w-full max-w-[420px]">
        <Card className="border-white/[0.08] bg-card/80 shadow-[0_24px_80px_rgba(0,0,0,0.45)] ring-1 ring-white/[0.06] backdrop-blur-md">
          <CardHeader className="border-b border-white/[0.05] text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-lime/10 ring-1 ring-lime/25">
              <Shield className="h-6 w-6 text-lime" />
            </div>
            <CardTitle className="font-heading text-3xl text-lime">АДМИН</CardTitle>
            <CardDescription className="text-[11px] uppercase tracking-[0.2em]">
              центр управления · ДВЖ
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            <p className="mb-5 text-center text-sm text-muted-foreground">
              Вход только для аккаунтов с ролью <span className="text-lime font-semibold">ADMIN</span>
            </p>

            {error === "invalid" && (
              <div className="mb-4 rounded-xl border border-heat/30 bg-heat/10 px-4 py-3 text-center text-sm font-medium text-heat">
                Неверный email или пароль
              </div>
            )}
            {error === "not_admin" && (
              <div className="mb-4 rounded-xl border border-heat/30 bg-heat/10 px-4 py-3 text-center text-sm font-medium text-heat">
                У этого аккаунта нет прав администратора
              </div>
            )}

            <form action={adminLoginAction} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="admin@dvizh.app"
                  required
                  autoComplete="username"
                  className="h-11 rounded-xl border-white/[0.08] bg-white/[0.03]"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Пароль
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="h-11 rounded-xl border-white/[0.08] bg-white/[0.03]"
                />
              </div>
              <Button type="submit" className="mt-2 h-11 w-full cursor-pointer font-bold">
                Войти в панель
              </Button>
            </form>

            <div className="mt-5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-center">
              <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">тестовый доступ</p>
              <p className="font-mono text-xs text-muted-foreground">admin@dvizh.app · admin1234</p>
            </div>

            <Link
              href="/login"
              className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground transition-colors hover:text-lime"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Обычный вход в приложение
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
