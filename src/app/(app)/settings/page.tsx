import { redirect } from "next/navigation";
import { updateProfileAction } from "@/lib/actions";
import { getSession } from "@/lib/auth";
import { CITIES, MOSCOW_DISTRICTS } from "@/lib/geo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="p-4 lg:p-8 max-w-lg mx-auto space-y-6">
      <h1 className="font-heading text-3xl font-bold">Настройки</h1>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Профиль</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateProfileAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Имя</Label>
              <Input id="name" name="name" defaultValue={session.name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">О себе</Label>
              <Textarea id="bio" name="bio" rows={3} placeholder="Расскажи о себе" />
            </div>
            <div className="space-y-2">
              <Label>Город</Label>
              <Select name="city" defaultValue={session.city}>
                <SelectTrigger className="cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CITIES.map((c) => (
                    <SelectItem key={c} value={c} className="cursor-pointer">
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Район</Label>
              <Select name="district" defaultValue={session.district ?? ""}>
                <SelectTrigger className="cursor-pointer">
                  <SelectValue placeholder="Выберите район" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="" className="cursor-pointer">
                    Не указан
                  </SelectItem>
                  {MOSCOW_DISTRICTS.map((d) => (
                    <SelectItem key={d} value={d} className="cursor-pointer">
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="cursor-pointer">
              Сохранить
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
