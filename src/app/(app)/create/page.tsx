import { redirect } from "next/navigation";
import { createPostAction } from "@/lib/actions";
import { getSession } from "@/lib/auth";
import { CITIES, MOSCOW_DISTRICTS } from "@/lib/geo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import { PageShell } from "@/components/layout/page-shell";
import { Zap, Target, Megaphone } from "lucide-react";

const fieldClass = "h-11 rounded-xl border-white/[0.09] bg-white/[0.04] text-sm focus-visible:border-lime/40 focus-visible:bg-white/[0.06]";
const labelClass = "text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground";
const selectTriggerClass = "h-11 rounded-xl border-white/[0.09] bg-white/[0.04] text-sm cursor-pointer";

function PostForm({ type }: { type: "ACTIVITY" | "CHALLENGE" | "ANNOUNCEMENT" }) {
  return (
    <form action={createPostAction} className="space-y-5 mt-6">
      <input type="hidden" name="type" value={type} />

      {(type === "CHALLENGE" || type === "ANNOUNCEMENT") && (
        <div className="space-y-1.5">
          <Label className={labelClass}>Заголовок</Label>
          <Input name="title" required placeholder="Короткое название" className={fieldClass} />
        </div>
      )}

      <div className="space-y-1.5">
        <Label className={labelClass}>Описание</Label>
        <Textarea
          name="content"
          required
          rows={4}
          placeholder="Расскажи подробнее..."
          className="rounded-xl border-white/[0.09] bg-white/[0.04] text-sm focus-visible:border-lime/40 resize-none"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className={labelClass}>Город</Label>
          <Select name="city" defaultValue="Москва">
            <SelectTrigger className={selectTriggerClass}><SelectValue /></SelectTrigger>
            <SelectContent className="border-white/[0.09] bg-popover">
              {CITIES.map((c) => <SelectItem key={c} value={c} className="cursor-pointer">{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className={labelClass}>Район</Label>
          <Select name="district">
            <SelectTrigger className={selectTriggerClass}><SelectValue placeholder="Любой" /></SelectTrigger>
            <SelectContent className="border-white/[0.09] bg-popover">
              {MOSCOW_DISTRICTS.map((d) => <SelectItem key={d} value={d} className="cursor-pointer">{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className={labelClass}>Теги</Label>
          <Input name="tags" placeholder="бег, утро, парк" className={fieldClass} />
        </div>
        <div className="space-y-1.5">
          <Label className={labelClass}>Радиус видимости (км)</Label>
          <Input name="radiusKm" type="number" defaultValue={10} min={1} max={50} className={fieldClass} />
        </div>
      </div>

      {type === "CHALLENGE" && (
        <>
          <div className="h-px bg-white/[0.06]" />
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.12em]">Параметры челленджа</p>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className={labelClass}>Цель (кол-во отчётов)</Label>
              <Input name="goalCount" type="number" defaultValue={10} min={1} className={fieldClass} />
            </div>
            <div className="space-y-1.5">
              <Label className={labelClass}>Дедлайн</Label>
              <Input name="deadline" type="date" className={fieldClass} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>Правила</Label>
            <Textarea name="rules" rows={2} placeholder="Как выполнять..." className="rounded-xl border-white/[0.09] bg-white/[0.04] text-sm focus-visible:border-lime/40 resize-none" />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className={labelClass}>Название бизнеса</Label>
              <Input name="businessName" placeholder="Если от бизнеса" className={fieldClass} />
            </div>
            <div className="space-y-1.5">
              <Label className={labelClass}>Награда</Label>
              <Input name="reward" placeholder="Бесплатный кофе" className={fieldClass} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>Название сезона</Label>
            <Input name="seasonName" placeholder="Июньский вызов" className={fieldClass} />
          </div>
          <div className="flex flex-wrap gap-6 pt-1">
            <div className="flex items-center gap-3">
              <Switch id="isBusiness" name="isBusiness" />
              <Label htmlFor="isBusiness" className="text-sm font-semibold cursor-pointer">Бизнес-челлендж</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch id="isSeasonal" name="isSeasonal" />
              <Label htmlFor="isSeasonal" className="text-sm font-semibold cursor-pointer">Сезонный</Label>
            </div>
          </div>
        </>
      )}

      {type === "ANNOUNCEMENT" && (
        <>
          <div className="h-px bg-white/[0.06]" />
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className={labelClass}>Категория</Label>
              <Select name="category" defaultValue="OTHER">
                <SelectTrigger className={selectTriggerClass}><SelectValue /></SelectTrigger>
                <SelectContent className="border-white/[0.09] bg-popover">
                  <SelectItem value="SPORT" className="cursor-pointer">⚡ Спорт</SelectItem>
                  <SelectItem value="EVENT" className="cursor-pointer">🎉 Ивент</SelectItem>
                  <SelectItem value="HELP" className="cursor-pointer">🤝 Помощь</SelectItem>
                  <SelectItem value="EXCHANGE" className="cursor-pointer">🔄 Обмен</SelectItem>
                  <SelectItem value="MEETUP" className="cursor-pointer">👋 Встреча</SelectItem>
                  <SelectItem value="OTHER" className="cursor-pointer">✦ Другое</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className={labelClass}>Контакт</Label>
              <Input name="contactInfo" placeholder="@username или телефон" className={fieldClass} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>Актуально до</Label>
            <Input name="expiresAt" type="date" className={fieldClass} />
          </div>
        </>
      )}

      <button type="submit" className="btn-action w-full h-12 text-sm mt-2">
        Опубликовать
      </button>
    </form>
  );
}

export default async function CreatePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <PageShell
      title="СОЗДАТЬ"
      description="Поделись активностью, челленджем или объявлением"
      icon={<Zap className="h-6 w-6" />}
      accent="lime"
      className="max-w-2xl mx-auto"
    >
      <div className="max-w-xl">
        <Tabs defaultValue="ACTIVITY">
          <TabsList className="grid w-full grid-cols-3 h-12 bg-white/[0.04] border border-white/[0.07] rounded-2xl p-1">
            <TabsTrigger
              value="ACTIVITY"
              className="cursor-pointer rounded-xl text-xs font-bold uppercase tracking-wider data-[state=active]:bg-lime data-[state=active]:text-lime-foreground data-[state=active]:shadow-none flex items-center gap-1.5"
            >
              <Zap className="h-3.5 w-3.5" />
              Активность
            </TabsTrigger>
            <TabsTrigger
              value="CHALLENGE"
              className="cursor-pointer rounded-xl text-xs font-bold uppercase tracking-wider data-[state=active]:bg-heat data-[state=active]:text-white data-[state=active]:shadow-none flex items-center gap-1.5"
            >
              <Target className="h-3.5 w-3.5" />
              Челлендж
            </TabsTrigger>
            <TabsTrigger
              value="ANNOUNCEMENT"
              className="cursor-pointer rounded-xl text-xs font-bold uppercase tracking-wider data-[state=active]:bg-ice data-[state=active]:text-[#0A0A0F] data-[state=active]:shadow-none flex items-center gap-1.5"
            >
              <Megaphone className="h-3.5 w-3.5" />
              Объявление
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ACTIVITY"><PostForm type="ACTIVITY" /></TabsContent>
          <TabsContent value="CHALLENGE"><PostForm type="CHALLENGE" /></TabsContent>
          <TabsContent value="ANNOUNCEMENT"><PostForm type="ANNOUNCEMENT" /></TabsContent>
        </Tabs>
      </div>
    </PageShell>
  );
}
