"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { Button, Callout, Card, NumberInput, Select, SelectItem, TextInput, Title } from "@tremor/react";
import { appPath } from "@/lib/paths";
import { getUploadSizeLimitMessage, MAX_UPLOAD_SIZE_MB, isUploadSizeAllowed } from "@/lib/upload-limits";

type EmployeeOption = {
  id: number;
  name: string;
  nip: string;
};

type SupportingDocumentFormProps = {
  employeeOptions: EmployeeOption[];
  defaultEmployeeId?: number;
  mode: "admin" | "employee";
};

const MONTH_OPTIONS = [
  { value: "1", label: "Januari" },
  { value: "2", label: "Februari" },
  { value: "3", label: "Maret" },
  { value: "4", label: "April" },
  { value: "5", label: "Mei" },
  { value: "6", label: "Juni" },
  { value: "7", label: "Juli" },
  { value: "8", label: "Agustus" },
  { value: "9", label: "September" },
  { value: "10", label: "Oktober" },
  { value: "11", label: "November" },
  { value: "12", label: "Desember" },
];

export function SupportingDocumentForm({
  employeeOptions,
  defaultEmployeeId,
  mode,
}: SupportingDocumentFormProps) {
  const [employeeId, setEmployeeId] = useState(defaultEmployeeId ? String(defaultEmployeeId) : "");
  const [periodMonth, setPeriodMonth] = useState(String(new Date().getMonth() + 1));
  const [periodYear, setPeriodYear] = useState(String(new Date().getFullYear()));
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] || null;

    if (nextFile && !isUploadSizeAllowed(nextFile.size)) {
      setFile(null);
      setMessage({ type: "error", text: getUploadSizeLimitMessage("File bukti dukung") });
      event.target.value = "";
      return;
    }

    setFile(nextFile);
    setMessage(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      if (file && !isUploadSizeAllowed(file.size)) {
        setMessage({ type: "error", text: getUploadSizeLimitMessage("File bukti dukung") });
        return;
      }

      const formData = new FormData();
      if (employeeId) formData.set("employeeId", employeeId);
      formData.set("periodMonth", periodMonth);
      formData.set("periodYear", periodYear);
      formData.set("description", description);
      if (file) formData.set("file", file);

      const response = await fetch(appPath("/api/supporting-documents"), {
        method: "POST",
        body: formData,
      });

      let payload: { ok?: boolean; message?: string } = {};
      const contentType = response.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        payload = (await response.json()) as { ok?: boolean; message?: string };
      }

      if (!response.ok || !payload.ok) {
        setMessage({
          type: "error",
          text:
            payload.message ||
            (response.status === 413
              ? getUploadSizeLimitMessage("File bukti dukung")
              : "Gagal menyimpan bukti dukung."),
        });
        return;
      }

      setMessage({ type: "success", text: payload.message || "Bukti dukung berhasil disimpan." });
      setDescription("");
      setFile(null);
    } catch {
      setMessage({ type: "error", text: "Terjadi gangguan koneksi saat menyimpan bukti dukung." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="planner-card rounded-[28px] p-6">
      <div className="mb-6">
        <div className="text-xs font-medium uppercase tracking-[0.22em] text-slate-400">
          Bukti Dukung
        </div>
        <Title className="!mt-3 !text-2xl !font-semibold !tracking-tight !text-slate-950">
          Upload bukti dukung per periode
        </Title>
        <p className="mt-3 text-sm leading-7 text-slate-500">
          Satu periode dapat memiliki lebih dari satu file bukti dukung. Format file yang didukung: Excel, Word, image, dan PDF.
        </p>
      </div>

      <form className="grid gap-5 md:grid-cols-2" onSubmit={handleSubmit}>
        {mode === "admin" ? (
          <div className="md:col-span-2 border-b border-slate-300 pb-5">
            <label className="mb-2 block text-sm font-medium text-slate-900">Pegawai</label>
            <Select value={employeeId} onValueChange={setEmployeeId}>
              {employeeOptions.map((option) => (
                <SelectItem key={option.id} value={String(option.id)}>
                  {option.nip} - {option.name}
                </SelectItem>
              ))}
            </Select>
          </div>
        ) : null}

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-900">Bulan</label>
          <Select value={periodMonth} onValueChange={setPeriodMonth}>
            {MONTH_OPTIONS.map((month) => (
              <SelectItem key={month.value} value={month.value}>
                {month.label}
              </SelectItem>
            ))}
          </Select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-900">Tahun</label>
          <NumberInput value={periodYear} onValueChange={(value) => setPeriodYear(String(value ?? ""))} />
        </div>

        <div className="md:col-span-2 border-t border-slate-300 pt-5">
          <label className="mb-2 block text-sm font-medium text-slate-900">Deskripsi</label>
          <TextInput value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Masukkan deskripsi bukti dukung" />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-900">File</label>
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls,.doc,.docx"
            onChange={handleFileChange}
            className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
          />
          <p className="mt-2 text-xs text-slate-500">Format PDF, image, Excel, atau Word, maksimal {MAX_UPLOAD_SIZE_MB} MB.</p>
        </div>

        {message ? (
          <div className="md:col-span-2">
            <Callout color={message.type === "success" ? "teal" : "rose"} title={message.type === "success" ? "Berhasil" : "Gagal"}>
              {message.text}
            </Callout>
          </div>
        ) : null}

        <div className="md:col-span-2">
          <Button type="submit" color="blue" className="!rounded-xl !px-5 !py-2.5" loading={submitting}>
            Simpan bukti dukung
          </Button>
        </div>
      </form>
    </Card>
  );
}
