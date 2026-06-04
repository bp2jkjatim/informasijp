import Link from "next/link";
import { RiDownloadLine, RiExternalLinkLine, RiFileSearchLine } from "@remixicon/react";
import { TrainingReviewForm } from "@/components/training-review-form";
import { appPath } from "@/lib/paths";

type TrainingDetailProps = {
  training: {
    id: number;
    trainingName: string;
    trainingProvider: string | null;
    trainingDateText: string | null;
    proposedTraining: string | null;
    certificateNumber: string | null;
    certificateLink: string | null;
    certificateFilePath: string | null;
    jumlahJp: number | { toString(): string };
    year: number;
    isPbj: boolean;
    isJabatan: boolean;
    isIntegritas: boolean;
    verificationStatus: "need_verification" | "verified" | "rejected";
    verificationNote: string | null;
    verifiedAt: Date | null;
    employee: {
      nip: string;
      name: string;
    };
  };
  mode: "admin" | "employee";
  editPath: string;
};

function displayStatus(status: TrainingDetailProps["training"]["verificationStatus"]) {
  if (status === "verified") {
    return "Verified";
  }

  if (status === "rejected") {
    return "Rejected";
  }

  return "Need verification";
}

function statusClass(status: TrainingDetailProps["training"]["verificationStatus"]) {
  if (status === "verified") {
    return "border-teal-300 bg-teal-50 text-teal-800";
  }

  if (status === "rejected") {
    return "border-rose-300 bg-rose-50 text-rose-800";
  }

  return "border-amber-300 bg-amber-50 text-amber-800";
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 whitespace-pre-wrap break-words text-sm font-medium text-slate-950">{value || "-"}</div>
    </div>
  );
}

export function TrainingDetail({ training, mode, editPath }: TrainingDetailProps) {
  const fileName = training.certificateFilePath?.split("/").pop()?.replace(/^\d+-[a-f0-9-]+-/i, "");

  return (
    <div className="grid gap-4">
      <div className="planner-card rounded-[28px] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-[0.22em] text-slate-400">
              Detail Diklat
            </div>
            <h1 className="mt-3 text-2xl font-semibold text-slate-950">{training.trainingName}</h1>
            <p className="mt-2 text-sm text-slate-600">
              {training.employee.nip} - {training.employee.name}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-lg border px-3 py-2 text-sm font-medium ${statusClass(training.verificationStatus)}`}>
              {displayStatus(training.verificationStatus)}
            </span>
            <Link
              href={editPath}
              className="inline-flex rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
            >
              Edit
            </Link>
          </div>
        </div>

        {training.verificationStatus === "rejected" && training.verificationNote ? (
          <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            <div className="font-medium">Catatan penolakan</div>
            <div className="mt-1 whitespace-pre-wrap">{training.verificationNote}</div>
          </div>
        ) : null}

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <DetailItem label="Provider" value={training.trainingProvider || "-"} />
          <DetailItem label="Tanggal" value={training.trainingDateText || "-"} />
          <DetailItem label="Nomor sertifikat" value={training.certificateNumber || "-"} />
          <DetailItem label="Link sertifikat" value={training.certificateLink || "-"} />
          <DetailItem label="Jumlah JP" value={`${Number(training.jumlahJp)}`} />
          <DetailItem label="Tahun" value={`${training.year}`} />
          <DetailItem label="Rencana / usulan" value={training.proposedTraining || "-"} />
          <DetailItem
            label="Kategori"
            value={[
              training.isPbj ? "PBJ" : null,
              training.isJabatan ? "Jabatan" : null,
              training.isIntegritas ? "Integritas" : null,
            ].filter(Boolean).join(", ") || "-"}
          />
        </div>

        <div className="mt-5 rounded-xl border border-slate-200 bg-white px-4 py-3">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-400">Sertifikat</div>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            {training.certificateLink ? (
              <a
                href={training.certificateLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
              >
                <RiExternalLinkLine size={16} className="mr-2" />
                Buka link
              </a>
            ) : null}
            {training.certificateFilePath ? (
              <>
                <a
                  href={appPath(`/api/trainings/files/${training.id}?mode=preview`)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
                >
                  <RiFileSearchLine size={16} className="mr-2" />
                  Preview file
                </a>
                <a
                  href={appPath(`/api/trainings/files/${training.id}?mode=download`)}
                  className="inline-flex items-center rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
                >
                  <RiDownloadLine size={16} className="mr-2" />
                  Download file
                </a>
                <span className="break-all text-sm text-slate-500">{fileName}</span>
              </>
            ) : null}
            {!training.certificateLink && !training.certificateFilePath ? (
              <span className="text-sm text-slate-500">Belum ada link atau file sertifikat.</span>
            ) : null}
          </div>
        </div>
      </div>

      {mode === "admin" ? <TrainingReviewForm trainingId={training.id} /> : null}
    </div>
  );
}
