import "server-only";

import path from "path";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";

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

type EmployeeStatusValue = "PNS" | "P3K" | "LAINNYA";

type ExistingEmployee = Awaited<ReturnType<typeof loadExistingEmployees>>[number];

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeName(value: string) {
  return normalizeWhitespace(value)
    .toLowerCase()
    .replace(/[.,']/g, "");
}

function parseIdentifier(raw: unknown) {
  if (raw == null) {
    return "";
  }

  const text = String(raw).trim();

  if (!text) {
    return "";
  }

  if (/e\+?/i.test(text)) {
    const numeric = Number(text);

    if (Number.isFinite(numeric)) {
      return numeric.toLocaleString("fullwide", {
        useGrouping: false,
        maximumFractionDigits: 0,
      });
    }
  }

  if (text.endsWith(".0")) {
    return text.slice(0, -2);
  }

  return text;
}

function parseDateCell(raw: unknown) {
  if (raw == null || raw === "") {
    return null;
  }

  if (typeof raw === "number") {
    const parsed = XLSX.SSF.parse_date_code(raw);

    if (!parsed) {
      return null;
    }

    return new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d));
  }

  const text = String(raw).trim();

  if (!text) {
    return null;
  }

  const numeric = Number(text);

  if (Number.isFinite(numeric) && text.length >= 4) {
    const parsed = XLSX.SSF.parse_date_code(numeric);

    if (parsed) {
      return new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d));
    }
  }

  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseDecimal(raw: unknown) {
  if (raw == null || raw === "") {
    return null;
  }

  const numeric = Number(String(raw).replace(",", "."));
  return Number.isFinite(numeric) ? numeric : null;
}

function employeeStatusFromKet(raw: unknown): EmployeeStatusValue {
  const value = normalizeWhitespace(String(raw || "")).toUpperCase();

  if (value === "PNS") {
    return "PNS";
  }

  if (value === "P3K" || value === "PPPK") {
    return "P3K";
  }

  return "LAINNYA";
}

function resolveWorkbookPath(customPath?: string) {
  if (customPath) {
    return path.isAbsolute(customPath)
      ? customPath
      : path.resolve(process.cwd(), customPath);
  }

  return path.resolve(process.cwd(), "..", "Data SDM BP2JK Jatim-3.xlsx");
}

function inferYear(rawDate: unknown) {
  const date = parseDateCell(rawDate);

  if (date) {
    return date.getUTCFullYear();
  }

  const text = normalizeWhitespace(String(rawDate || ""));
  const match = text.match(/20\d{2}/);
  return match ? Number(match[0]) : 2025;
}

function inferTrainingFlags(proposedTraining: string, trainingName: string) {
  const haystack = `${proposedTraining} ${trainingName}`.toLowerCase();

  const isPbj = /pbj|pengadaan|tender|pokja|pisk|ppk|katalog|mini-kompetisi/.test(haystack);
  const isIntegritas = /integritas|gratifikasi|korupsi|wbs|smap|kepatuhan|antikorupsi/.test(haystack);
  const isJabatan = /jabatan|manajemen|kepegawaian|pengembangan sdm|rantai pasok|pranata|arsip|keuangan|komputer/.test(haystack);

  return {
    isPbj,
    isIntegritas,
    isJabatan,
  };
}

async function loadExistingEmployees() {
  return prisma.employee.findMany({
    include: {
      user: {
        select: {
          id: true,
        },
      },
      _count: {
        select: {
          trainings: true,
        },
      },
    },
  });
}

function selectPreferredEmployee(group: ExistingEmployee[]) {
  return [...group].sort((left, right) => {
    const leftScore = (left.user ? 10 : 0) + (left._count.trainings > 0 ? 5 : 0);
    const rightScore = (right.user ? 10 : 0) + (right._count.trainings > 0 ? 5 : 0);

    if (leftScore !== rightScore) {
      return rightScore - leftScore;
    }

    return left.id - right.id;
  })[0];
}

function buildEmployeeLookups(existingEmployees: ExistingEmployee[]) {
  const employeeByNip = new Map(existingEmployees.map((employee) => [employee.nip, employee]));
  const employeeGroupsByName = new Map<string, ExistingEmployee[]>();

  for (const employee of existingEmployees) {
    const key = normalizeName(employee.name);
    const current = employeeGroupsByName.get(key) || [];
    current.push(employee);
    employeeGroupsByName.set(key, current);
  }

  return {
    employeeByNip,
    employeeGroupsByName,
  };
}

async function upsertEmployeesFromAkPbj(
  workbook: XLSX.WorkBook,
  warnings: string[],
) {
  const akSheetName = workbook.SheetNames.find((name) => name === "AK PBJ");

  if (!akSheetName) {
    return {
      employeesCreated: 0,
      employeesUpdated: 0,
      employeeNameMap: new Map<string, number>(),
    };
  }

  const akRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[akSheetName], {
    defval: "",
  });

  let employeesCreated = 0;
  let employeesUpdated = 0;

  const existingEmployees = await loadExistingEmployees();
  const { employeeByNip, employeeGroupsByName } = buildEmployeeLookups(existingEmployees);

  for (const row of akRows) {
    const name = normalizeWhitespace(String(row["Nama Lengkap"] || ""));
    const nip = parseIdentifier(row.NIP);

    if (!name || !nip || name === "Nama Lengkap") {
      continue;
    }

    const normalized = normalizeName(name);
    const matchedByNip = employeeByNip.get(nip);
    const matchedByNameGroup = employeeGroupsByName.get(normalized);
    const matchedByName = matchedByNameGroup?.length
      ? selectPreferredEmployee(matchedByNameGroup)
      : null;

    const updatePayload = {
      name,
      phone: parseIdentifier(row["Nomor HP/ WA"]) || null,
      positionLevel: normalizeWhitespace(String(row.Jenjang || "")) || null,
      rankGroup: normalizeWhitespace(String(row["Pangkat/ Gol"] || "")) || null,
      tmtRank: parseDateCell(row["TMT Pangkat/ Gol"]),
      tmtPosition: parseDateCell(row["TMT Jenjang"]),
      akumulasiAk2025: parseDecimal(row["Hasil Akumulasi AK S.d. 2025"]),
      notes: normalizeWhitespace(String(row.Keterangan || "")) || null,
    };

    if (matchedByNip) {
      await prisma.employee.update({
        where: { id: matchedByNip.id },
        data: updatePayload,
      });
      employeesUpdated += 1;
    } else if (matchedByName) {
      await prisma.employee.update({
        where: { id: matchedByName.id },
        data: updatePayload,
      });
      employeesUpdated += 1;

      if (matchedByName.nip !== nip) {
        warnings.push(`NIP workbook berbeda dengan roster existing untuk ${name}: workbook=${nip}, existing=${matchedByName.nip}`);
      }
    } else {
      await prisma.employee.create({
        data: {
          nip,
          ...updatePayload,
        },
      });
      employeesCreated += 1;
    }

  }

  const duplicateCandidates = await loadExistingEmployees();
  const duplicateGroups = new Map<string, ExistingEmployee[]>();

  for (const employee of duplicateCandidates) {
    const key = normalizeName(employee.name);
    const current = duplicateGroups.get(key) || [];
    current.push(employee);
    duplicateGroups.set(key, current);
  }

  for (const [, group] of Array.from(duplicateGroups.entries())) {
    if (group.length < 2) {
      continue;
    }

    const keeper = selectPreferredEmployee(group);
    const removable = group.filter(
      (employee) =>
        employee.id !== keeper.id &&
        !employee.user &&
        employee._count.trainings === 0,
    );

    for (const employee of removable) {
      await prisma.employee.delete({
        where: { id: employee.id },
      });
      warnings.push(`Duplicate orphan employee dibersihkan: ${employee.name} (${employee.nip})`);
    }
  }

  const refreshedEmployees = await prisma.employee.findMany({
    select: {
      id: true,
      name: true,
    },
  });
  const employeeNameMap = new Map<string, number>();

  for (const employee of refreshedEmployees) {
    employeeNameMap.set(normalizeName(employee.name), employee.id);
  }

  return {
    employeesCreated,
    employeesUpdated,
    employeeNameMap,
  };
}

async function syncSummarySheet(
  workbook: XLSX.WorkBook,
  employeeNameMap: Map<string, number>,
  warnings: string[],
) {
  const summarySheetName = workbook.SheetNames.find((name) => name === "Sheet1");

  if (!summarySheetName) {
    warnings.push('Sheet "Sheet1" tidak ditemukan, sinkron summary JP dilewati.');
    return {
      summaryRowsMatched: 0,
      summaryRowsUnmatched: 0,
    };
  }

  const summaryRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[summarySheetName], {
    defval: "",
  });

  let summaryRowsMatched = 0;
  let summaryRowsUnmatched = 0;

  for (const row of summaryRows) {
    const name = normalizeWhitespace(String(row.Nama || ""));

    if (!name || name === "Nama") {
      continue;
    }

    const employeeId = employeeNameMap.get(normalizeName(name));

    if (!employeeId) {
      summaryRowsUnmatched += 1;
      warnings.push(`Summary tidak cocok dengan master pegawai: ${name}`);
      continue;
    }

    const employeeStatus = employeeStatusFromKet(row.Ket);
    const jpTarget = employeeStatus === "PNS" ? 20 : 0;
    const totalJp = parseDecimal(row["Total JP"]);
    const fulfillment = normalizeWhitespace(String(row["Pemenuhan JP"] || ""));

    await prisma.employee.update({
      where: { id: employeeId },
      data: {
        employeeStatus,
        jpTarget,
        notes: fulfillment
          ? `Imported summary JP: ${totalJp ?? 0} (${fulfillment})`
          : undefined,
      },
    });

    summaryRowsMatched += 1;
  }

  return {
    summaryRowsMatched,
    summaryRowsUnmatched,
  };
}

async function importTrainingSheet(
  workbook: XLSX.WorkBook,
  employeeNameMap: Map<string, number>,
  warnings: string[],
) {
  const trainingSheetName = workbook.SheetNames.find((name) => name === "Diklat 2025 dan evaluasi");

  if (!trainingSheetName) {
    warnings.push('Sheet "Diklat 2025 dan evaluasi" tidak ditemukan, import trainings dilewati.');
    return {
      trainingsCreated: 0,
      trainingsUpdated: 0,
    };
  }

  const trainingRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[trainingSheetName], {
    defval: "",
    header: "A",
    range: 4,
  });

  let currentEmployeeId: number | null = null;
  let trainingsCreated = 0;
  let trainingsUpdated = 0;

  for (const row of trainingRows) {
    const rowName = normalizeWhitespace(String(row.B || ""));
    const proposedTraining = normalizeWhitespace(String(row.C || ""));
    const trainingName = normalizeWhitespace(String(row.D || ""));

    if (rowName) {
      currentEmployeeId = employeeNameMap.get(normalizeName(rowName)) ?? null;

      if (!currentEmployeeId) {
        warnings.push(`Baris diklat tidak bisa dicocokkan ke employee: ${rowName}`);
      }
    }

    if (!currentEmployeeId || !trainingName) {
      continue;
    }

    const trainingProvider = normalizeWhitespace(String(row.F || ""));
    const certificateNumber = normalizeWhitespace(String(row.G || ""));
    const certificateLink = normalizeWhitespace(String(row.N || ""));
    const jumlahJp = parseDecimal(row.H);

    if (!jumlahJp) {
      continue;
    }

    const year = inferYear(row.E);
    const flags = inferTrainingFlags(proposedTraining, trainingName);

    const existing = await prisma.training.findFirst({
      where: {
        employeeId: currentEmployeeId,
        trainingName,
        year,
        certificateNumber: certificateNumber || null,
      },
      select: {
        id: true,
      },
    });

    const payload = {
      employeeId: currentEmployeeId,
      proposedTraining: proposedTraining || null,
      trainingName,
      trainingDateText: normalizeWhitespace(String(row.E || "")) || null,
      trainingProvider: trainingProvider || null,
      certificateNumber: certificateNumber || null,
      certificateLink: certificateLink || null,
      jumlahJp,
      year,
      isPbj: flags.isPbj,
      isJabatan: flags.isJabatan,
      isIntegritas: flags.isIntegritas,
    };

    if (existing) {
      await prisma.training.update({
        where: { id: existing.id },
        data: payload,
      });
      trainingsUpdated += 1;
    } else {
      await prisma.training.create({
        data: payload,
      });
      trainingsCreated += 1;
    }
  }

  return {
    trainingsCreated,
    trainingsUpdated,
  };
}

export async function importExcelWorkbook(customPath?: string): Promise<ImportResult> {
  const workbookPath = resolveWorkbookPath(customPath);
  const workbook = XLSX.readFile(workbookPath, {
    cellDates: false,
    raw: true,
  });

  const warnings: string[] = [];
  const employeeImport = await upsertEmployeesFromAkPbj(workbook, warnings);
  const summaryImport = await syncSummarySheet(workbook, employeeImport.employeeNameMap, warnings);
  const trainingImport = await importTrainingSheet(workbook, employeeImport.employeeNameMap, warnings);

  await prisma.systemSetting.upsert({
    where: { key: "excel_import_source" },
    update: {
      value: path.basename(workbookPath),
    },
    create: {
      key: "excel_import_source",
      value: path.basename(workbookPath),
    },
  });

  return {
    sourceFile: path.basename(workbookPath),
    sheets: workbook.SheetNames,
    employeesCreated: employeeImport.employeesCreated,
    employeesUpdated: employeeImport.employeesUpdated,
    trainingsCreated: trainingImport.trainingsCreated,
    trainingsUpdated: trainingImport.trainingsUpdated,
    summaryRowsMatched: summaryImport.summaryRowsMatched,
    summaryRowsUnmatched: summaryImport.summaryRowsUnmatched,
    warnings,
  };
}
