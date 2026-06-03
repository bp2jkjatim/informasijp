import path from "path";
import XLSX from "xlsx";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function normalizeWhitespace(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeName(value) {
  return normalizeWhitespace(value).toLowerCase().replace(/[.,']/g, "");
}

function parseIdentifier(raw) {
  if (raw == null) return "";
  const text = String(raw).trim();
  if (!text) return "";
  if (/e\+?/i.test(text)) {
    const numeric = Number(text);
    if (Number.isFinite(numeric)) {
      return numeric.toLocaleString("fullwide", {
        useGrouping: false,
        maximumFractionDigits: 0,
      });
    }
  }
  if (text.endsWith(".0")) return text.slice(0, -2);
  return text;
}

function parseDateCell(raw) {
  if (raw == null || raw === "") return null;
  if (typeof raw === "number") {
    const parsed = XLSX.SSF.parse_date_code(raw);
    return parsed ? new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d)) : null;
  }
  const text = String(raw).trim();
  if (!text) return null;
  const numeric = Number(text);
  if (Number.isFinite(numeric) && text.length >= 4) {
    const parsed = XLSX.SSF.parse_date_code(numeric);
    if (parsed) return new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d));
  }
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseDecimal(raw) {
  if (raw == null || raw === "") return null;
  const numeric = Number(String(raw).replace(",", "."));
  return Number.isFinite(numeric) ? numeric : null;
}

function employeeStatusFromKet(raw) {
  const value = normalizeWhitespace(raw).toUpperCase();
  if (value === "PNS") return "PNS";
  if (value === "P3K" || value === "PPPK") return "P3K";
  return "LAINNYA";
}

function resolveWorkbookPath(inputPath) {
  if (inputPath) {
    return path.isAbsolute(inputPath) ? inputPath : path.resolve(process.cwd(), inputPath);
  }
  return path.resolve(process.cwd(), "..", "Data SDM BP2JK Jatim-3.xlsx");
}

function inferYear(rawDate) {
  const date = parseDateCell(rawDate);
  if (date) return date.getUTCFullYear();
  const text = normalizeWhitespace(rawDate);
  const match = text.match(/20\d{2}/);
  return match ? Number(match[0]) : 2025;
}

function inferTrainingFlags(proposedTraining, trainingName) {
  const haystack = `${proposedTraining} ${trainingName}`.toLowerCase();
  return {
    isPbj: /pbj|pengadaan|tender|pokja|pisk|ppk|katalog|mini-kompetisi/.test(haystack),
    isIntegritas: /integritas|gratifikasi|korupsi|wbs|smap|kepatuhan|antikorupsi/.test(haystack),
    isJabatan: /jabatan|manajemen|kepegawaian|pengembangan sdm|rantai pasok|pranata|arsip|keuangan|komputer/.test(haystack),
  };
}

async function loadExistingEmployees() {
  return prisma.employee.findMany({
    include: {
      user: { select: { id: true } },
      _count: { select: { trainings: true } },
    },
  });
}

function selectPreferredEmployee(group) {
  return [...group].sort((left, right) => {
    const leftScore = (left.user ? 10 : 0) + (left._count.trainings > 0 ? 5 : 0);
    const rightScore = (right.user ? 10 : 0) + (right._count.trainings > 0 ? 5 : 0);
    if (leftScore !== rightScore) return rightScore - leftScore;
    return left.id - right.id;
  })[0];
}

function buildEmployeeLookups(existingEmployees) {
  const employeeByNip = new Map(existingEmployees.map((employee) => [employee.nip, employee]));
  const employeeGroupsByName = new Map();

  for (const employee of existingEmployees) {
    const key = normalizeName(employee.name);
    const current = employeeGroupsByName.get(key) || [];
    current.push(employee);
    employeeGroupsByName.set(key, current);
  }

  return { employeeByNip, employeeGroupsByName };
}

async function main() {
  const workbookPath = resolveWorkbookPath(process.argv[2]);
  const workbook = XLSX.readFile(workbookPath, { cellDates: false, raw: true });
  const warnings = [];
  let employeesCreated = 0;
  let employeesUpdated = 0;
  let trainingsCreated = 0;
  let trainingsUpdated = 0;
  let summaryRowsMatched = 0;
  let summaryRowsUnmatched = 0;

  const akRows = workbook.Sheets["AK PBJ"]
    ? XLSX.utils.sheet_to_json(workbook.Sheets["AK PBJ"], { defval: "" })
    : [];

  const existingEmployees = await loadExistingEmployees();
  const { employeeByNip, employeeGroupsByName } = buildEmployeeLookups(existingEmployees);

  for (const row of akRows) {
    const name = normalizeWhitespace(row["Nama Lengkap"]);
    const nip = parseIdentifier(row.NIP);
    if (!name || !nip || name === "Nama Lengkap") continue;

    const normalized = normalizeName(name);
    const matchedByNip = employeeByNip.get(nip);
    const matchedByNameGroup = employeeGroupsByName.get(normalized);
    const matchedByName = matchedByNameGroup?.length ? selectPreferredEmployee(matchedByNameGroup) : null;

    const updatePayload = {
      name,
      phone: parseIdentifier(row["Nomor HP/ WA"]) || null,
      positionLevel: normalizeWhitespace(row.Jenjang) || null,
      rankGroup: normalizeWhitespace(row["Pangkat/ Gol"]) || null,
      tmtRank: parseDateCell(row["TMT Pangkat/ Gol"]),
      tmtPosition: parseDateCell(row["TMT Jenjang"]),
      akumulasiAk2025: parseDecimal(row["Hasil Akumulasi AK S.d. 2025"]),
      notes: normalizeWhitespace(row.Keterangan) || null,
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
        data: { nip, ...updatePayload },
      });
      employeesCreated += 1;
    }
  }

  const duplicateCandidates = await loadExistingEmployees();
  const duplicateGroups = new Map();
  for (const employee of duplicateCandidates) {
    const key = normalizeName(employee.name);
    const current = duplicateGroups.get(key) || [];
    current.push(employee);
    duplicateGroups.set(key, current);
  }
  for (const [, group] of duplicateGroups) {
    if (group.length < 2) continue;
    const keeper = selectPreferredEmployee(group);
    const removable = group.filter((employee) => employee.id !== keeper.id && !employee.user && employee._count.trainings === 0);
    for (const employee of removable) {
      await prisma.employee.delete({ where: { id: employee.id } });
      warnings.push(`Duplicate orphan employee dibersihkan: ${employee.name} (${employee.nip})`);
    }
  }

  const refreshedEmployees = await prisma.employee.findMany({
    select: {
      id: true,
      name: true,
    },
  });
  const employeeNameMap = new Map();
  for (const employee of refreshedEmployees) {
    employeeNameMap.set(normalizeName(employee.name), employee.id);
  }

  const summaryRows = workbook.Sheets["Sheet1"]
    ? XLSX.utils.sheet_to_json(workbook.Sheets["Sheet1"], { defval: "" })
    : [];
  for (const row of summaryRows) {
    const name = normalizeWhitespace(row.Nama);
    if (!name || name === "Nama") continue;
    const employeeId = employeeNameMap.get(normalizeName(name));
    if (!employeeId) {
      summaryRowsUnmatched += 1;
      warnings.push(`Summary tidak cocok dengan master pegawai: ${name}`);
      continue;
    }
    const employeeStatus = employeeStatusFromKet(row.Ket);
    const jpTarget = employeeStatus === "PNS" ? 20 : 0;
    const totalJp = parseDecimal(row["Total JP"]);
    const fulfillment = normalizeWhitespace(row["Pemenuhan JP"]);
    await prisma.employee.update({
      where: { id: employeeId },
      data: {
        employeeStatus,
        jpTarget,
        notes: fulfillment ? `Imported summary JP: ${totalJp ?? 0} (${fulfillment})` : undefined,
      },
    });
    summaryRowsMatched += 1;
  }

  const trainingRows = workbook.Sheets["Diklat 2025 dan evaluasi"]
    ? XLSX.utils.sheet_to_json(workbook.Sheets["Diklat 2025 dan evaluasi"], { defval: "", header: "A", range: 4 })
    : [];
  let currentEmployeeId = null;

  for (const row of trainingRows) {
    const rowName = normalizeWhitespace(row.B);
    const proposedTraining = normalizeWhitespace(row.C);
    const trainingName = normalizeWhitespace(row.D);

    if (rowName) {
      currentEmployeeId = employeeNameMap.get(normalizeName(rowName)) ?? null;
      if (!currentEmployeeId) {
        warnings.push(`Baris diklat tidak bisa dicocokkan ke employee: ${rowName}`);
      }
    }

    if (!currentEmployeeId || !trainingName) continue;

    const trainingProvider = normalizeWhitespace(row.F);
    const certificateNumber = normalizeWhitespace(row.G);
    const certificateLink = normalizeWhitespace(row.N);
    const jumlahJp = parseDecimal(row.H);
    if (!jumlahJp) continue;

    const year = inferYear(row.E);
    const flags = inferTrainingFlags(proposedTraining, trainingName);
    const existing = await prisma.training.findFirst({
      where: {
        employeeId: currentEmployeeId,
        trainingName,
        year,
        certificateNumber: certificateNumber || null,
      },
      select: { id: true },
    });

    const payload = {
      employeeId: currentEmployeeId,
      proposedTraining: proposedTraining || null,
      trainingName,
      trainingDateText: normalizeWhitespace(row.E) || null,
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
      await prisma.training.update({ where: { id: existing.id }, data: payload });
      trainingsUpdated += 1;
    } else {
      await prisma.training.create({ data: payload });
      trainingsCreated += 1;
    }
  }

  await prisma.systemSetting.upsert({
    where: { key: "excel_import_source" },
    update: { value: path.basename(workbookPath) },
    create: { key: "excel_import_source", value: path.basename(workbookPath) },
  });

  console.log(
    JSON.stringify(
      {
        sourceFile: path.basename(workbookPath),
        sheets: workbook.SheetNames,
        employeesCreated,
        employeesUpdated,
        trainingsCreated,
        trainingsUpdated,
        summaryRowsMatched,
        summaryRowsUnmatched,
        warnings,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
