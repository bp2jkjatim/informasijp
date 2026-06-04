"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { Button, Callout, Card, NumberInput, Select, SelectItem, TextInput, Title } from "@tremor/react";
import { appPath } from "@/lib/paths";

type EmployeeOption = {
  id: number;
  name: string;
  nip: string;
};

type TrainingFormProps = {
  mode: "admin" | "employee";
  employeeOptions: EmployeeOption[];
  defaultEmployeeId?: number;
  initialValues?: {
    trainingName: string;
    trainingProvider: string;
    trainingDateText: string;
    certificateNumber: string;
    certificateLink: string;
    jumlahJp: number;
    year: number;
    proposedTraining: string;
    certificateFilePath?: string | null;
    isPbj: boolean;
    isJabatan: boolean;
    isIntegritas: boolean;
  };
  submitUrl?: string;
  submitMethod?: "POST" | "PATCH";
  submitLabel?: string;
};

type SubmitState = {
  type: "success" | "error";
  message: string;
} | null;

export function TrainingForm({
  mode,
  employeeOptions,
  defaultEmployeeId,
  initialValues,
  submitUrl = "/api/trainings",
  submitMethod = "POST",
  submitLabel = "Simpan diklat",
}: TrainingFormProps) {
  const [employeeId, setEmployeeId] = useState(
    defaultEmployeeId ? String(defaultEmployeeId) : employeeOptions[0] ? String(employeeOptions[0].id) : "",
  );
  const [trainingName, setTrainingName] = useState(initialValues?.trainingName || "");
  const [trainingProvider, setTrainingProvider] = useState(initialValues?.trainingProvider || "");
  const [trainingDateText, setTrainingDateText] = useState(initialValues?.trainingDateText || "");
  const [certificateNumber, setCertificateNumber] = useState(initialValues?.certificateNumber || "");
  const [certificateLink, setCertificateLink] = useState(initialValues?.certificateLink || "");
  const [jumlahJp, setJumlahJp] = useState(initialValues ? String(initialValues.jumlahJp) : "");
  const [year, setYear] = useState(initialValues ? String(initialValues.year) : String(new Date().getFullYear()));
  const [proposedTraining, setProposedTraining] = useState(initialValues?.proposedTraining || "");
  const [isPbj, setIsPbj] = useState(initialValues?.isPbj || false);
  const [isJabatan, setIsJabatan] = useState(initialValues?.isJabatan || false);
  const [isIntegritas, setIsIntegritas] = useState(initialValues?.isIntegritas || false);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>(null);

  const selectedEmployee = useMemo(
    () => employeeOptions.find((item) => String(item.id) === employeeId),
    [employeeId, employeeOptions],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setSubmitState(null);

    try {
      const formData = new FormData();

      if (employeeId) {
        formData.set("employeeId", employeeId);
      }

      formData.set("trainingName", trainingName);
      formData.set("trainingProvider", trainingProvider);
      formData.set("trainingDateText", trainingDateText);
      formData.set("certificateNumber", certificateNumber);
      formData.set("certificateLink", certificateLink);
      formData.set("jumlahJp", jumlahJp);
      formData.set("year", year);
      formData.set("proposedTraining", proposedTraining);
      formData.set("isPbj", String(isPbj));
      formData.set("isJabatan", String(isJabatan));
      formData.set("isIntegritas", String(isIntegritas));

      if (certificateFile) {
        formData.set("certificateFile", certificateFile);
      }

      const response = await fetch(appPath(submitUrl), {
        method: submitMethod,
        body: formData,
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
      };

      if (!response.ok || !payload.ok) {
        setSubmitState({
          type: "error",
          message: payload.message || "Penyimpanan diklat gagal.",
        });
        return;
      }

      setSubmitState({
        type: "success",
        message: payload.message || "Data diklat berhasil disimpan.",
      });

      if (submitMethod === "POST") {
        setTrainingName("");
        setTrainingProvider("");
        setTrainingDateText("");
        setCertificateNumber("");
        setCertificateLink("");
        setJumlahJp("");
        setProposedTraining("");
        setIsPbj(false);
        setIsJabatan(false);
        setIsIntegritas(false);
        setCertificateFile(null);
      }
    } catch {
      setSubmitState({
        type: "error",
        message: "Terjadi gangguan koneksi saat menyimpan diklat.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="planner-card rounded-[28px] p-6">
      <div className="mb-6">
        <div className="text-xs font-medium uppercase tracking-[0.22em] text-slate-400">
          Input Diklat
        </div>
        <Title className="!mt-3 !text-2xl !font-semibold !tracking-tight !text-slate-950">
          Form input diklat dan upload sertifikat
        </Title>
        <p className="mt-3 text-sm leading-7 text-slate-500">
          {mode === "admin"
            ? "Admin dapat memilih pegawai tujuan lalu menyimpan data diklat ke database."
            : "Pegawai hanya dapat menginput data diklat miliknya sendiri."}
        </p>
      </div>

      <form className="grid gap-5 md:grid-cols-2" onSubmit={handleSubmit}>
        {mode === "admin" ? (
          <div className="md:col-span-2 border-b border-slate-300 pb-5">
            <label className="mb-2 block text-sm font-medium text-slate-900">
              Pegawai
            </label>
            <Select value={employeeId} onValueChange={setEmployeeId}>
              {employeeOptions.map((option) => (
                <SelectItem key={option.id} value={String(option.id)}>
                  {option.nip} - {option.name}
                </SelectItem>
              ))}
            </Select>
          </div>
        ) : selectedEmployee ? (
          <div className="md:col-span-2 border-b border-slate-300 pb-5 text-sm text-slate-800">
            Pegawai aktif: {selectedEmployee.nip} - {selectedEmployee.name}
          </div>
        ) : null}

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-900">
            Nama diklat
          </label>
          <TextInput
            value={trainingName}
            onChange={(event) => setTrainingName(event.target.value)}
            placeholder="Masukkan nama diklat"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-900">
            Pelaksana diklat
          </label>
          <TextInput
            value={trainingProvider}
            onChange={(event) => setTrainingProvider(event.target.value)}
            placeholder="Instansi atau penyelenggara"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-900">
            Tanggal pelaksanaan
          </label>
          <TextInput
            value={trainingDateText}
            onChange={(event) => setTrainingDateText(event.target.value)}
            placeholder="Contoh: 24 Mei 2026"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-900">
            Nomor sertifikat
          </label>
          <TextInput
            value={certificateNumber}
            onChange={(event) => setCertificateNumber(event.target.value)}
            placeholder="Nomor sertifikat"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-900">
            Link sertifikat
          </label>
          <TextInput
            value={certificateLink}
            onChange={(event) => setCertificateLink(event.target.value)}
            placeholder="https://..."
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-900">
            Jumlah JP
          </label>
          <NumberInput
            value={jumlahJp}
            onValueChange={(value) => setJumlahJp(String(value ?? ""))}
            placeholder="Contoh: 20"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-900">
            Tahun
          </label>
          <NumberInput
            value={year}
            onValueChange={(value) => setYear(String(value ?? ""))}
            placeholder="2026"
          />
        </div>

        <div className="md:col-span-2 border-t border-slate-300 pt-5">
          <label className="mb-2 block text-sm font-medium text-slate-900">
            Rencana / usulan diklat
          </label>
          <TextInput
            value={proposedTraining}
            onChange={(event) => setProposedTraining(event.target.value)}
            placeholder="Opsional"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-900">
            File sertifikat
          </label>
          {initialValues?.certificateFilePath ? (
            <div className="mb-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-950">
              <div className="font-medium">File tersimpan</div>
              <div className="mt-1 break-all text-blue-800">
                {initialValues.certificateFilePath.split("/").pop()?.replace(/^\d+-[a-f0-9-]+-/i, "")}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  href={appPath(`${submitUrl.replace("/api/trainings", "/api/trainings/files")}?mode=preview`)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-medium text-blue-800 transition hover:bg-blue-100"
                >
                  Preview
                </a>
                <a
                  href={appPath(`${submitUrl.replace("/api/trainings", "/api/trainings/files")}?mode=download`)}
                  className="inline-flex rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-medium text-blue-800 transition hover:bg-blue-100"
                >
                  Download
                </a>
              </div>
            </div>
          ) : null}
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setCertificateFile(event.target.files?.[0] || null)
            }
            className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
          />
        </div>

        <div className="md:col-span-2 border-t border-slate-300 pt-5">
          <div className="mb-3 text-sm font-medium text-slate-900">
            Kategori diklat
          </div>
          <div className="grid gap-3 md:grid-cols-3">
          <label className="flex items-center gap-3 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800">
            <input type="checkbox" checked={isPbj} onChange={() => setIsPbj((value) => !value)} />
            Berkaitan dengan PBJ
          </label>
          <label className="flex items-center gap-3 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800">
            <input type="checkbox" checked={isJabatan} onChange={() => setIsJabatan((value) => !value)} />
            Berkaitan dengan jabatan
          </label>
          <label className="flex items-center gap-3 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800">
            <input type="checkbox" checked={isIntegritas} onChange={() => setIsIntegritas((value) => !value)} />
            Berkaitan dengan integritas
          </label>
          </div>
        </div>

        {submitState ? (
          <div className="md:col-span-2">
            <Callout color={submitState.type === "success" ? "teal" : "rose"} title={submitState.type === "success" ? "Berhasil" : "Gagal"}>
              {submitState.message}
            </Callout>
          </div>
        ) : null}

        <div className="md:col-span-2">
          <Button
            type="submit"
            color="blue"
            className="!rounded-xl !px-5 !py-2.5"
            loading={submitting}
          >
            {submitLabel}
          </Button>
        </div>
      </form>
    </Card>
  );
}
