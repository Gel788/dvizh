import { ImageOff, ImageUp, Megaphone, Sparkles } from "lucide-react";
import { broadcastNotificationAction } from "@/lib/admin/actions";
import { PUSH_BRAND } from "@/lib/push/brand";
import { ensureAbsoluteMediaUrl } from "@/lib/media-url";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isPushConfigured } from "@/lib/push/firebase-admin";

type Props = {
  pushDevices: number;
  pushResult?: {
    sent: number;
    failed: number;
    devices: number;
    configured: boolean;
  } | null;
};

export function BroadcastForm({ pushDevices, pushResult }: Props) {
  const firebaseOk = isPushConfigured();
  const defaultBanner = ensureAbsoluteMediaUrl(PUSH_BRAND.defaultImagePath);

  return (
    <Card className="border-white/[0.08] bg-white/[0.02]">
      <CardHeader>
        <CardTitle className="font-heading flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-heat" />
          Рассылка уведомлений
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pushResult && (
          <div
            className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
              pushResult.failed > 0
                ? "border-amber-500/30 bg-amber-500/10 text-amber-100"
                : "border-lime/30 bg-lime/10 text-lime"
            }`}
          >
            Push: отправлено <strong>{pushResult.sent}</strong> из {pushResult.devices} устройств
            {pushResult.failed > 0 ? `, ошибок: ${pushResult.failed}` : ""}.
            {!pushResult.configured && " Firebase не настроен на сервере."}
          </div>
        )}

        <div className="mb-4 rounded-xl border border-white/[0.08] bg-black/20 px-4 py-3 text-xs text-white/50 space-y-1">
          <p>
            Firebase: {firebaseOk ? "✅ настроен" : "❌ нет FIREBASE_SERVICE_ACCOUNT_JSON"}
          </p>
          <p>Зарегистрировано устройств для push: <strong className="text-white/80">{pushDevices}</strong></p>
          <p>Если 0 — открой приложение на телефоне и разреши уведомления.</p>
        </div>

        <form action={broadcastNotificationAction} encType="multipart/form-data" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="broadcast-title">Заголовок</Label>
            <Input id="broadcast-title" name="title" placeholder="Важное обновление" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="broadcast-body">Текст</Label>
            <Textarea id="broadcast-body" name="body" rows={3} placeholder="Сообщение всем пользователям" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="broadcast-link">Ссылка (опционально)</Label>
            <Input id="broadcast-link" name="link" placeholder="/challenges" />
          </div>
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-white/85">Фото в push</legend>
            <div className="grid gap-2 md:grid-cols-3">
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-lime/30 bg-lime/10 p-3 text-sm text-white/80 transition hover:bg-lime/15 has-[:checked]:border-lime has-[:checked]:bg-lime/15">
                <input type="radio" name="imageMode" value="brand" defaultChecked className="mt-1 accent-lime" />
                <span className="space-y-1">
                  <span className="flex items-center gap-2 font-medium text-white">
                    <Sparkles className="h-4 w-4 text-lime" />
                    Брендовый
                  </span>
                  <span className="block text-xs text-white/50">Автоматически добавить баннер ДВИЖ.</span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/[0.08] bg-black/20 p-3 text-sm text-white/80 transition hover:bg-white/[0.04] has-[:checked]:border-lime has-[:checked]:bg-lime/10">
                <input type="radio" name="imageMode" value="custom" className="mt-1 accent-lime" />
                <span className="space-y-1">
                  <span className="flex items-center gap-2 font-medium text-white">
                    <ImageUp className="h-4 w-4 text-lime" />
                    Своё фото
                  </span>
                  <span className="block text-xs text-white/50">Загрузить файл или вставить HTTPS-ссылку.</span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/[0.08] bg-black/20 p-3 text-sm text-white/80 transition hover:bg-white/[0.04] has-[:checked]:border-lime has-[:checked]:bg-lime/10">
                <input type="radio" name="imageMode" value="none" className="mt-1 accent-lime" />
                <span className="space-y-1">
                  <span className="flex items-center gap-2 font-medium text-white">
                    <ImageOff className="h-4 w-4 text-white/60" />
                    Без фото
                  </span>
                  <span className="block text-xs text-white/50">Только заголовок и текст.</span>
                </span>
              </label>
            </div>
          </fieldset>

          <div className="grid gap-4 rounded-xl border border-white/[0.08] bg-black/20 p-4 md:grid-cols-[1fr_180px]">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="broadcast-image-file">Загрузить своё фото</Label>
                <Input id="broadcast-image-file" name="imageFile" type="file" accept="image/png,image/jpeg,image/webp" />
                <p className="text-xs text-white/45">
                  Работает, если выбран режим «Своё фото». JPG/PNG/WebP до 4 МБ, лучше пропорция 2:1.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="broadcast-image-url">Или HTTPS-ссылка на фото</Label>
                <Input
                  id="broadcast-image-url"
                  name="imageUrl"
                  placeholder="https://example.com/push-image.jpg"
                  defaultValue=""
                />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-white/45">Брендовый баннер</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={defaultBanner}
                alt="Превью брендового баннера push"
                className="h-24 w-full rounded-xl border border-white/10 object-cover md:h-full"
              />
            </div>
          </div>
          <Button type="submit" className="cursor-pointer bg-heat text-white hover:bg-heat/90">
            Отправить всем (в приложении + push)
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
