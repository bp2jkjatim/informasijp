"use client";

import { useState } from "react";
import { Button, Callout, Card, Text, Title } from "@tremor/react";

type ImportResult = {
  sourceFile: string;
  sheets: string[];
  employeesCreated: number;
  employeesUpdated: number;
  trainingsCreated: number;
  trainingsUpdated: number;
  summaryRowsMatched: number;
  summaryRowsUnmatched: number;
  warnings: string[];
};

export function ExcelImportCard() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);

  async function handleImport() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/import/excel", {
        method: "POST",
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
        result?: ImportResult;
      };

      if (!response.ok || !payload.ok || !payload.result) {
        setError(payload.message || "Import Excel gagal.");
        return;
      }

      setResult(payload.result);
    } catch {
      setError("Terjadi gangguan koneksi saat menjalankan import Excel.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="planner-card rounded-[28px] p-6">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
            Excel Import
          </div>
          <Title className="!mt-2 !text-2xl !font-semibold !tracking-tight !text-slate-950">
            Import workbook operasional
          </Title>
          <Text className="!mt-2 !text-sm !leading-6 !text-slate-500">
            Importer ini membaca file Excel default di root repo, menyinkronkan
            master pegawai dari sheet `AK PBJ`, transaksi diklat dari `Diklat 2025 dan evaluasi`,
            serta status dasar JP dari `Sheet1`.
          </Text>
        </div>

        <Button
          color="blue"
          className="!rounded-xl !px-5 !py-2.5"
          loading={loading}
          onClick={handleImport}
        >
          Jalankan import
        </Button>
      </div>

      {error ? (
        <Callout className="mt-4" color="rose" title="Import gagal">
          {error}
        </Callout>
      ) : null}

      {result ? (
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <div className="rounded-3xl border border-slate-200 px-4 py-4">
            <Text className="!text-slate-500">Source file</Text>
            <div className="mt-1 text-base font-semibold text-slate-950">{result.sourceFile}</div>
          </div>
          <div className="rounded-3xl border border-slate-200 px-4 py-4">
            <Text className="!text-slate-500">Employee created</Text>
            <div className="mt-1 text-base font-semibold text-slate-950">{result.employeesCreated}</div>
          </div>
          <div className="rounded-3xl border border-slate-200 px-4 py-4">
            <Text className="!text-slate-500">Employee updated</Text>
            <div className="mt-1 text-base font-semibold text-slate-950">{result.employeesUpdated}</div>
          </div>
          <div className="rounded-3xl border border-slate-200 px-4 py-4">
            <Text className="!text-slate-500">Trainings created</Text>
            <div className="mt-1 text-base font-semibold text-slate-950">{result.trainingsCreated}</div>
          </div>
          <div className="rounded-3xl border border-slate-200 px-4 py-4">
            <Text className="!text-slate-500">Trainings updated</Text>
            <div className="mt-1 text-base font-semibold text-slate-950">{result.trainingsUpdated}</div>
          </div>
          <div className="rounded-3xl border border-slate-200 px-4 py-4">
            <Text className="!text-slate-500">Summary matched</Text>
            <div className="mt-1 text-base font-semibold text-slate-950">{result.summaryRowsMatched}</div>
          </div>
          {result.summaryRowsUnmatched ? (
            <div className="md:col-span-2 xl:col-span-4 rounded-3xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
              Summary rows belum cocok: {result.summaryRowsUnmatched}
            </div>
          ) : null}
          {result.warnings.length ? (
            <div className="md:col-span-2 xl:col-span-4 rounded-3xl border border-slate-200 px-4 py-4">
              <div className="text-sm font-medium text-slate-900">Warnings</div>
              <ul className="mt-2 space-y-2 text-sm text-slate-500">
                {result.warnings.slice(0, 8).map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
