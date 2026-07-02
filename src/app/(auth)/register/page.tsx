import Link from "next/link";
import { registerAction } from "@/lib/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { CITIES } from "@/lib/geo";

export default function RegisterPage() {
  return (
    <div className="dvizh-grid min-h-screen flex items-center justify-center p-4">
      <div className="pointer-events-none fixed top-0 right-0 h-[600px] w-[600px] rounded-full bg-lime/[0.05] blur-[120px] -translate-y-1/2 translate-x-1/2" />
      <div className="pointer-events-none fixed bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-heat/[0.04] blur-[100px] translate-y-1/2 -translate-x-1/2" />

      <div className="relative w-full max-w-md">
        <div className="rounded-2xl border border-white/[0.09] bg-card/90 backdrop-blur-xl p-8">
          <div className="mb-7 text-center">
            <p className="font-heading text-5xl text-neon-lime -skew-x-3 leading-none">ДВЖ</p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              город / движение
            </p>
          </div>

          <h2 className="font-bold text-lg mb-1 text-center">Врывайся в движ</h2>
          <p className="text-sm text-muted-foreground text-center mb-6">Твой район ждёт</p>

          <form action={registerAction} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Имя</Label>
              <Input id="name" name="name" required placeholder="Как тебя зовут" className="h-11 rounded-xl border-white/[0.09] bg-white/[0.04] focus-visible:border-lime/40" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Username</Label>
              <Input id="username" name="username" required placeholder="username" className="h-11 rounded-xl border-white/[0.09] bg-white/[0.04] focus-visible:border-lime/40" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Email</Label>
              <Input id="email" name="email" type="email" required className="h-11 rounded-xl border-white/[0.09] bg-white/[0.04] focus-visible:border-lime/40" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Пароль</Label>
              <Input id="password" name="password" type="password" required minLength={6} placeholder="6+ символов" className="h-11 rounded-xl border-white/[0.09] bg-white/[0.04] focus-visible:border-lime/40" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Город</Label>
              <Select name="city" defaultValue="Москва">
                <SelectTrigger className="cursor-pointer h-11 rounded-xl border-white/[0.09] bg-white/[0.04] focus-visible:border-lime/40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-white/[0.09] bg-popover">
                  {CITIES.map((c) => (
                    <SelectItem key={c} value={c} className="cursor-pointer">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <button type="submit" className="btn-action w-full h-11 mt-2">
              Поехали
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Уже в движе?{" "}
            <Link href="/login" className="text-lime font-bold hover:text-lime/80 transition-colors cursor-pointer">
              Войти
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
