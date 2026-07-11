import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminTable, AdminTd, AdminTh } from "@/components/admin/admin-table";
import { AdminInspectableRow } from "@/components/admin/preview/admin-inspectable-row";
import { AdminPreviewRoot } from "@/components/admin/preview/admin-preview-root";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteContentReportAction } from "@/lib/admin/actions";
import { buildReportPreviews } from "@/lib/admin/preview-resolve";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";

export default async function AdminReportsPage() {
  const reports = await db.contentReport.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      reporter: { select: { username: true, name: true, avatar: true } },
    },
  });

  const previews = await buildReportPreviews(reports);

  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow="Модерация"
        title="Жалобы"
        description={`${reports.length} репортов на контент — посты, профили, активности`}
      />

      <AdminPreviewRoot previews={previews}>
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
              <AdminInspectableRow key={r.id} inspectId={r.id}>
                <AdminTd className="max-w-[160px]">
                  <p className="text-sm font-medium line-clamp-2">
                    {previews[r.id]?.kind === "report" ? previews[r.id].targetLabel : r.targetId.slice(0, 12)}
                  </p>
                  <p className="font-mono text-[10px] text-white/30 mt-0.5 truncate">{r.targetId}</p>
                </AdminTd>
                <AdminTd>
                  <Badge variant="outline" className="text-[10px]">{r.targetKind}</Badge>
                </AdminTd>
                <AdminTd className="text-sm font-medium">{r.reason}</AdminTd>
                <AdminTd className="text-xs text-white/40 max-w-[200px] line-clamp-2">{r.details ?? "—"}</AdminTd>
                <AdminTd className="text-xs">@{r.reporter.username}</AdminTd>
                <AdminTd className="text-xs text-white/35">
                  {format(r.createdAt, "d MMM HH:mm", { locale: ru })}
                </AdminTd>
                <AdminTd data-no-inspect>
                  <DeleteButton label={`жалоба ${r.id.slice(0, 8)}`} action={deleteContentReportAction.bind(null, r.id)} />
                </AdminTd>
              </AdminInspectableRow>
            ))}
          </tbody>
        </AdminTable>
      </AdminPreviewRoot>
    </AdminPage>
  );
}
