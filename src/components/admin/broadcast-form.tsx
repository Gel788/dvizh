import { Megaphone } from "lucide-react";
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

        <form action={broadcastNotificationAction} className="space-y-4">
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
          <div className="space-y-2">
            <Label htmlFor="broadcast-image">Картинка баннера (опционально)</Label>
            <Input
              id="broadcast-image"
              name="imageUrl"
              placeholder={defaultBanner}
              defaultValue=""
            />
            <p className="text-xs text-white/45">
              По умолчанию брендовый баннер ДВИЖ. HTTPS JPG/PNG, лучше 2:1.
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={defaultBanner}
              alt="Превью баннера push"
              className="mt-2 max-h-28 w-full rounded-xl border border-white/10 object-cover"
            />
          </div>
          <Button type="submit" className="cursor-pointer bg-heat text-white hover:bg-heat/90">
            Отправить всем (в приложении + push)
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
