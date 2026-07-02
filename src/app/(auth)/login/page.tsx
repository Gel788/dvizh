import Link from "next/link";
import { redirect } from "next/navigation";
import { loginAction } from "@/lib/actions";
import { getSession } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;
  const session = await getSession();
  const returnTo = next?.startsWith("/") && !next.startsWith("//") ? next : "/";

  if (session) redirect(returnTo);

  return (
    <div className="dvizh-grid min-h-screen flex items-center justify-center p-4">
      {/* Glow orbs */}
      <div className="pointer-events-none fixed top-0 right-0 h-[600px] w-[600px] rounded-full bg-lime/[0.06] blur-[120px] -translate-y-1/2 translate-x-1/2" />
      <div className="pointer-events-none fixed bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-heat/[0.05] blur-[100px] translate-y-1/2 -translate-x-1/2" />

      <div className="relative w-full max-w-md">
        <div className="rounded-2xl border border-white/[0.09] bg-card/90 backdrop-blur-xl p-8">
          {/* Logo */}
          <div className="mb-8 text-center">
            <p className="font-heading text-5xl text-neon-lime -skew-x-3 leading-none">ДВЖ</p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              город / движение
            </p>
          </div>

          <h2 className="font-bold text-lg mb-1 text-center">Снова в движе?</h2>
          <p className="text-sm text-muted-foreground text-center mb-6">Заходи, тут ждут</p>

          {error === "invalid" && (
            <div className="mb-4 rounded-xl border border-heat/20 bg-heat/[0.08] px-4 py-3 text-sm text-heat font-semibold text-center">
              Неверный логин или пароль
            </div>
          )}

          <form action={loginAction} className="space-y-4">
            <input type="hidden" name="next" value={returnTo} />
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="demo@dvizh.app"
                required
                className="h-11 rounded-xl border-white/[0.09] bg-white/[0.04] text-sm focus-visible:border-lime/40 focus-visible:bg-white/[0.06]"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                Пароль
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                className="h-11 rounded-xl border-white/[0.09] bg-white/[0.04] text-sm focus-visible:border-lime/40 focus-visible:bg-white/[0.06]"
              />
            </div>
            <button type="submit" className="btn-action w-full h-11 mt-2">
              Войти
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Нет аккаунта?{" "}
            <Link href="/register" className="text-lime font-bold hover:text-lime/80 transition-colors cursor-pointer">
              Врывайся
            </Link>
          </p>

          {/* Demo hint */}
          <div className="mt-5 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-center">
            <p className="text-xs text-muted-foreground font-mono">demo@dvizh.app · demo1234</p>
          </div>
        </div>
      </div>
    </div>
  );
}
