import { Megaphone } from "lucide-react";
import { broadcastNotificationAction } from "@/lib/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function BroadcastForm() {
  return (
    <Card className="border-white/[0.08] bg-white/[0.02]">
      <CardHeader>
        <CardTitle className="font-heading flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-heat" />
          Рассылка уведомлений
        </CardTitle>
      </CardHeader>
      <CardContent>
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
          <Button type="submit" className="cursor-pointer bg-heat text-white hover:bg-heat/90">
            Отправить всем (в приложении + push)
          </Button>
          <p className="text-xs text-muted-foreground">
            Push дойдёт на устройства с включёнными уведомлениями. Нужен FIREBASE_SERVICE_ACCOUNT_JSON на сервере.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
