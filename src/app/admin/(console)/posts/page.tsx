import Link from "next/link";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { AdminTable, AdminTd, AdminTh } from "@/components/admin/admin-table";
import { DeleteButton } from "@/components/admin/delete-button";
import { deletePostAction } from "@/lib/admin/actions";
import { db } from "@/lib/db";

export default async function AdminPostsPage() {
  const posts = await db.post.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      author: { select: { name: true, username: true } },
      _count: { select: { likes: true, comments: true, going: true } },
    },
  });

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-[1400px]">
      <div className="mb-8">
        <h1 className="font-heading text-4xl text-neon-lime leading-none">Посты</h1>
        <p className="mt-2 text-sm text-white/45">Модерация ленты и объявлений</p>
      </div>

      <AdminTable>
        <thead>
          <tr>
            <AdminTh>Контент</AdminTh>
            <AdminTh>Тип</AdminTh>
            <AdminTh>Автор</AdminTh>
            <AdminTh>Локация</AdminTh>
            <AdminTh>Реакции</AdminTh>
            <AdminTh>Дата</AdminTh>
            <AdminTh />
          </tr>
        </thead>
        <tbody>
          {posts.map((p) => (
            <tr key={p.id}>
              <AdminTd className="max-w-[280px]">
                <Link href={`/post/${p.id}`} className="line-clamp-2 hover:text-lime">
                  {p.title ?? p.content}
                </Link>
              </AdminTd>
              <AdminTd>{p.type}</AdminTd>
              <AdminTd>
                <Link href={`/profile/${p.author.username}`} className="hover:text-lime">
                  @{p.author.username}
                </Link>
              </AdminTd>
              <AdminTd className="text-xs text-white/40">
                {p.city}{p.district ? ` · ${p.district}` : ""}
              </AdminTd>
              <AdminTd className="text-xs text-white/40">
                ♥ {p._count.likes} · 💬 {p._count.comments} · ✓ {p._count.going}
              </AdminTd>
              <AdminTd className="text-xs text-white/35">
                {format(p.createdAt, "d MMM HH:mm", { locale: ru })}
              </AdminTd>
              <AdminTd>
                <DeleteButton label={p.title ?? p.content.slice(0, 40)} action={deletePostAction.bind(null, p.id)} />
              </AdminTd>
            </tr>
          ))}
        </tbody>
      </AdminTable>
    </div>
  );
}
