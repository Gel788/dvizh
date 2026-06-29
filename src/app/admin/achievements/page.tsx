import { AdminTable, AdminTd, AdminTh } from "@/components/admin/admin-table";
import { DeleteButton } from "@/components/admin/delete-button";
import { createAchievementAction, deleteAchievementAction } from "@/lib/admin/actions";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminAchievementsPage() {
  const achievements = await db.achievementDef.findMany({
    orderBy: { category: "asc" },
    include: { _count: { select: { users: true } } },
  });

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-[1400px]">
      <div className="mb-8">
        <h1 className="font-heading text-4xl text-neon-lime leading-none">Достижения</h1>
        <p className="mt-2 text-sm text-white/45">{achievements.length} определений в каталоге</p>
      </div>

      <Card className="mb-8 border-white/[0.08] bg-white/[0.02]">
        <CardHeader>
          <CardTitle className="font-heading">Добавить достижение</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createAchievementAction} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" name="slug" placeholder="first_run" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Название</Label>
              <Input id="name" name="name" placeholder="Первый забег" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Категория</Label>
              <Input id="category" name="category" placeholder="sport" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="icon">Иконка</Label>
              <Input id="icon" name="icon" defaultValue="🏆" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="threshold">Порог</Label>
              <Input id="threshold" name="threshold" type="number" defaultValue={1} min={1} />
            </div>
            <div className="space-y-2 sm:col-span-2 lg:col-span-3">
              <Label htmlFor="description">Описание</Label>
              <Textarea id="description" name="description" rows={2} required />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <Button type="submit" className="cursor-pointer">Создать</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <AdminTable>
        <thead>
          <tr>
            <AdminTh>Иконка</AdminTh>
            <AdminTh>Название</AdminTh>
            <AdminTh>Категория</AdminTh>
            <AdminTh>Порог</AdminTh>
            <AdminTh>Разблокировали</AdminTh>
            <AdminTh />
          </tr>
        </thead>
        <tbody>
          {achievements.map((a) => (
            <tr key={a.id}>
              <AdminTd className="text-xl">{a.icon}</AdminTd>
              <AdminTd>
                <p className="font-semibold">{a.name}</p>
                <p className="text-xs text-white/35">{a.slug}</p>
                <p className="text-xs text-white/25 line-clamp-1">{a.description}</p>
              </AdminTd>
              <AdminTd>{a.category}</AdminTd>
              <AdminTd>{a.threshold}</AdminTd>
              <AdminTd>{a._count.users}</AdminTd>
              <AdminTd>
                <DeleteButton label={a.name} action={deleteAchievementAction.bind(null, a.id)} />
              </AdminTd>
            </tr>
          ))}
        </tbody>
      </AdminTable>
    </div>
  );
}
