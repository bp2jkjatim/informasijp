"use client";

import { FormEvent, useState } from "react";
import { RiCheckboxCircleFill, RiTimeLine } from "@remixicon/react";
import { Button, Callout, Card, Textarea, Text, Title } from "@tremor/react";

type SupportingDocumentReviewFormProps = {
  employeeId: number;
  periodMonth: number;
  periodYear: number;
  periodLabel: string;
  initialComment?: string | null;
  reviewStatus: "reviewed" | "pending";
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

function StatusIcon({ status }: { status: "reviewed" | "pending" }) {
  if (status === "reviewed") {
    return (
      <span className="inline-flex" title="Sudah direview" aria-label="Sudah direview">
        <RiCheckboxCircleFill size={18} className="text-emerald-600" />
      </span>
    );
  }

  return (
    <span className="inline-flex" title="Belum direview" aria-label="Belum direview">
      <RiTimeLine size={18} className="text-amber-600" />
    </span>
  );
}

export function SupportingDocumentReviewForm({
  employeeId,
  periodMonth,
  periodYear,
  periodLabel,
  initialComment,
  reviewStatus,
  reviewedByLabel,
  reviewedAt,
}: SupportingDocumentReviewFormProps) {
  const [comment, setComment] = useState(initialComment || "");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch("/api/supporting-documents/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId,
          periodMonth,
          periodYear,
          comment,
        }),
      });

      const payload = (await response.json()) as { ok?: boolean; message?: string };

      if (!response.ok || !payload.ok) {
        setMessage({ type: "error", text: payload.message || "Gagal menyimpan masukan validasi." });
        return;
      }

      setMessage({ type: "success", text: payload.message || "Masukan validasi berhasil disimpan." });
    } catch {
      setMessage({ type: "error", text: "Terjadi gangguan koneksi saat menyimpan masukan." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="planner-card rounded-[28px] p-6">
      <Text className="!text-xs !font-medium !uppercase !tracking-[0.18em] !text-slate-500">
        Status Periode
      </Text>
      <Title className="!mt-2 !text-2xl !font-semibold !tracking-tight !text-slate-950">
        {periodLabel}
      </Title>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <div className="border border-slate-300 p-4">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
            Status
          </div>
          <div className="mt-2">
            <StatusIcon status={reviewStatus} />
          </div>
        </div>
        <div className="border border-slate-300 p-4">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
            Reviewer
          </div>
          <div className="mt-2 text-sm font-medium text-slate-950">
            {reviewedByLabel || "-"}
          </div>
        </div>
        <div className="border border-slate-300 p-4">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
            Waktu Review
          </div>
          <div className="mt-2 text-sm font-medium text-slate-950">
            {formatReviewedAt(reviewedAt)}
          </div>
        </div>
      </div>

      <div className="mt-4 border border-slate-300 p-4">
        <Title className="!text-xl !font-semibold !tracking-tight !text-slate-950">
        Masukan Atasan Periode
        </Title>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Masukan atasan berlaku untuk keseluruhan periode yang dipilih, bukan per file bukti dukung.
        </p>

        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <Textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Masukkan catatan, arahan, atau masukan atasan untuk periode ini"
            className="min-h-[160px]"
          />

          {message ? (
            <Callout color={message.type === "success" ? "teal" : "rose"} title={message.type === "success" ? "Berhasil" : "Gagal"}>
              {message.text}
            </Callout>
          ) : null}

          <Button type="submit" color="blue" className="!rounded-none !px-5 !py-2.5" loading={submitting}>
            Simpan masukan atasan
          </Button>
        </form>
      </div>
    </Card>
  );
}
