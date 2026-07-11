import Link from "next/link";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminTable, AdminTd, AdminTh, AdminTr } from "@/components/admin/admin-table";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteContentReportAction } from "@/lib/admin/actions";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";

export default async function AdminReportsPage() {
  const reports = await db.contentReport.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      reporter: { select: { username: true, name: true } },
    },
  });

  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow="Модерация"
        title="Жалобы"
        description={`${reports.length} репортов на контент — посты, профили, активности`}
      />

      <AdminTable>
        <thead>
          <tr>
            <AdminTh>Объект</AdminTh>
            <AdminTh>Тип</AdminTh>
            <AdminTh>Причина</AdminTh>
            <AdminTh>Детали</AdminTh>
            <AdminTh>От кого</AdminTh>
            <AdminTh>Дата</AdminTh>
            <AdminTh />
          </tr>
        </thead>
        <tbody>
          {reports.map((r) => (
            <AdminTr key={r.id}>
              <AdminTd className="font-mono text-xs max-w-[120px] truncate">{r.targetId}</AdminTd>
              <AdminTd>
                <Badge variant="outline" className="text-[10px]">{r.targetKind}</Badge>
              </AdminTd>
              <AdminTd className="text-sm font-medium">{r.reason}</AdminTd>
              <AdminTd className="text-xs text-white/40 max-w-[200px] line-clamp-2">{r.details ?? "—"}</AdminTd>
              <AdminTd>
                <Link href={`/profile/${r.reporter.username}`} className="text-xs hover:text-lime">
                  @{r.reporter.username}
                </Link>
              </AdminTd>
              <AdminTd className="text-xs text-white/35">
                {format(r.createdAt, "d MMM HH:mm", { locale: ru })}
              </AdminTd>
              <AdminTd>
                <DeleteButton label={`жалоба ${r.id.slice(0, 8)}`} action={deleteContentReportAction.bind(null, r.id)} />
              </AdminTd>
            </AdminTr>
          ))}
        </tbody>
      </AdminTable>
    </AdminPage>
  );
}
