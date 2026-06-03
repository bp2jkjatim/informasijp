import { Badge, Card, Text, Title } from "@tremor/react";

type SupportingDocumentPeriodFeedbackProps = {
  periodLabel: string;
  reviewStatus: "reviewed" | "pending";
  reviewComment?: string | null;
  reviewedByLabel?: string | null;
  reviewedAt?: Date | null;
};

function formatReviewedAt(reviewedAt?: Date | null) {
  if (!reviewedAt) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(reviewedAt);
}

export function SupportingDocumentPeriodFeedback({
  periodLabel,
  reviewStatus,
  reviewComment,
  reviewedByLabel,
  reviewedAt,
}: SupportingDocumentPeriodFeedbackProps) {
  const reviewed = reviewStatus === "reviewed";

  return (
    <Card className="planner-card rounded-[28px] p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Text className="!text-xs !font-medium !uppercase !tracking-[0.2em] !text-slate-400">
            Status Periode
          </Text>
          <Title className="!mt-3 !text-2xl !font-semibold !tracking-tight !text-slate-950">
            {periodLabel}
          </Title>
        </div>
        <Badge color={reviewed ? "emerald" : "amber"}>
          {reviewed ? "Sudah direview" : "Belum direview"}
        </Badge>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 p-4">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
            Reviewer
          </div>
          <div className="mt-2 text-sm font-medium text-slate-950">
            {reviewedByLabel || "-"}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 p-4">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
            Waktu Review
          </div>
          <div className="mt-2 text-sm font-medium text-slate-950">
            {formatReviewedAt(reviewedAt)}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-3xl border border-slate-200 p-4">
        <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
          Masukan Atasan
        </div>
        <p className="mt-2 text-sm leading-7 text-slate-600">
          {reviewComment?.trim()
            ? reviewComment
            : "Belum ada masukan atasan untuk periode ini."}
        </p>
      </div>
    </Card>
  );
}
