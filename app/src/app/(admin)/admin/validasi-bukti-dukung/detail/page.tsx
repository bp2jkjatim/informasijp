import Link from "next/link";
import { redirect } from "next/navigation";
import { RiArrowLeftLine } from "@remixicon/react";
import { requireAdminUser } from "@/lib/auth";
import { ShellFrame } from "@/components/shell-frame";
import { SupportingDocumentReviewForm } from "@/components/supporting-document-review-form";
import { SupportingDocumentTable } from "@/components/supporting-document-table";
import { getPeriodLabel, getSupportingDocumentsByPeriod } from "@/lib/supporting-documents";
import { prisma } from "@/lib/prisma";

type AdminSupportingDocumentsValidationDetailPageProps = {
  searchParams?: {
    employeeId?: string;
    periodMonth?: string;
    periodYear?: string;
  };
};

export default async function AdminSupportingDocumentsValidationDetailPage({
  searchParams,
}: AdminSupportingDocumentsValidationDetailPageProps) {
  const user = await requireAdminUser();

  const employeeId = Number(searchParams?.employeeId || 0);
  const periodMonth = Number(searchParams?.periodMonth || 0);
  const periodYear = Number(searchParams?.periodYear || 0);

  if (!employeeId || !periodMonth || !periodYear) {
    redirect("/admin/validasi-bukti-dukung");
  }

  const selectedEmployee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: {
      id: true,
      name: true,
      nip: true,
    },
  });

  if (!selectedEmployee) {
    redirect("/admin/validasi-bukti-dukung");
  }

  const periodData = await getSupportingDocumentsByPeriod(employeeId, periodMonth, periodYear);

  return (
    <ShellFrame
      eyebrow="Admin Workspace"
      title={`Validasi ${selectedEmployee.name}`}
      description={`Tinjau seluruh bukti dukung periode ${getPeriodLabel(periodMonth, periodYear)} lalu berikan masukan atasan untuk periode tersebut.`}
      currentUser={{
        username: user.username,
        role: user.role,
        name: user.employee?.name || user.username,
        jobTitle: user.employee?.jobTitle || "-",
      }}
    >
      <div className="grid gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/admin/validasi-bukti-dukung?employeeId=${employeeId}`}
            className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
          >
            <RiArrowLeftLine size={16} className="mr-2" />
            Kembali ke daftar periode
          </Link>
        </div>

        <SupportingDocumentTable
          title={`Bukti Dukung ${selectedEmployee.name} - ${getPeriodLabel(periodMonth, periodYear)}`}
          description="Preview tersedia untuk image dan PDF. File Excel dan Word tetap tersedia untuk download."
          records={periodData.documents}
          showEmployee={false}
          canManage
        />

        <SupportingDocumentReviewForm
          employeeId={employeeId}
          periodMonth={periodMonth}
          periodYear={periodYear}
          periodLabel={getPeriodLabel(periodMonth, periodYear)}
          initialComment={periodData.review?.comment}
          reviewStatus={periodData.review ? "reviewed" : "pending"}
          reviewedByLabel={
            periodData.review?.reviewedByUser
              ? periodData.review.reviewedByUser.employee?.name
                ? `${periodData.review.reviewedByUser.employee.name} (${periodData.review.reviewedByUser.username})`
                : periodData.review.reviewedByUser.username
              : undefined
          }
          reviewedAt={periodData.review?.reviewedAt}
        />
      </div>
    </ShellFrame>
  );
}
