import { mkdir, rename, copyFile, unlink, access } from "fs/promises";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const UPLOADS_DIR = process.env.UPLOADS_DIR?.trim() || path.join(process.cwd(), "uploads");
const STORED_UPLOADS_PREFIX = "uploads";
const PERIOD_MONTH_LABELS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];

function sanitizeUploadPathSegment(value) {
  const normalized = String(value || "").trim().replace(/[^a-zA-Z0-9._-]/g, "_");
  return normalized || "unknown";
}

function buildStoredUploadPath(...segments) {
  return path.posix.join(STORED_UPLOADS_PREFIX, ...segments);
}

function resolveStoredUploadPath(storedPath) {
  const normalized = String(storedPath || "")
    .replace(/\\/g, "/")
    .replace(/^\/+/, "");

  if (normalized === STORED_UPLOADS_PREFIX) {
    return UPLOADS_DIR;
  }

  if (normalized.startsWith(`${STORED_UPLOADS_PREFIX}/`)) {
    return path.join(UPLOADS_DIR, normalized.slice(STORED_UPLOADS_PREFIX.length + 1));
  }

  return path.isAbsolute(storedPath)
    ? storedPath
    : path.join(process.cwd(), storedPath);
}

function getSupportingDocumentPeriodSegment(periodMonth, periodYear) {
  const monthLabel = PERIOD_MONTH_LABELS[periodMonth - 1] || "UNK";
  return `${monthLabel}-${periodYear}`;
}

function getTrainingTargetPath(nip, year, filename) {
  return buildStoredUploadPath(
    "certificates",
    sanitizeUploadPathSegment(nip),
    String(year),
    filename,
  );
}

function getSupportingTargetPath(nip, periodMonth, periodYear, filename) {
  return buildStoredUploadPath(
    "supporting-documents",
    sanitizeUploadPathSegment(nip),
    getSupportingDocumentPeriodSegment(periodMonth, periodYear),
    filename,
  );
}

async function exists(targetPath) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function moveFile(sourcePath, targetPath) {
  await mkdir(path.dirname(targetPath), { recursive: true });

  if (sourcePath === targetPath) {
    return "already-in-place";
  }

  if (await exists(targetPath)) {
    return "target-exists";
  }

  try {
    await rename(sourcePath, targetPath);
    return "renamed";
  } catch (error) {
    if (error && error.code !== "EXDEV") {
      throw error;
    }

    await copyFile(sourcePath, targetPath);
    await unlink(sourcePath);
    return "copied";
  }
}

async function migrateTrainings(summary) {
  const trainings = await prisma.training.findMany({
    where: { certificateFilePath: { not: null } },
    select: {
      id: true,
      year: true,
      certificateFilePath: true,
      employee: { select: { nip: true } },
    },
  });

  for (const training of trainings) {
    const currentStoredPath = training.certificateFilePath;

    if (!currentStoredPath) {
      continue;
    }

    const filename = path.basename(currentStoredPath);
    const targetStoredPath = getTrainingTargetPath(training.employee.nip, training.year, filename);

    if (currentStoredPath === targetStoredPath) {
      summary.training.skipped += 1;
      continue;
    }

    const sourcePath = resolveStoredUploadPath(currentStoredPath);
    const targetPath = resolveStoredUploadPath(targetStoredPath);
    const sourceExists = await exists(sourcePath);
    const targetExists = await exists(targetPath);

    if (!sourceExists && !targetExists) {
      summary.training.missing.push({ id: training.id, path: currentStoredPath });
      continue;
    }

    if (sourceExists) {
      await moveFile(sourcePath, targetPath);
    }

    await prisma.training.update({
      where: { id: training.id },
      data: { certificateFilePath: targetStoredPath },
    });

    summary.training.migrated += 1;
  }
}

async function migrateSupportingDocuments(summary) {
  const documents = await prisma.supportingDocument.findMany({
    select: {
      id: true,
      periodMonth: true,
      periodYear: true,
      filePath: true,
      fileStoredName: true,
      employee: { select: { nip: true } },
    },
  });

  for (const document of documents) {
    const targetStoredPath = getSupportingTargetPath(
      document.employee.nip,
      document.periodMonth,
      document.periodYear,
      document.fileStoredName,
    );

    if (document.filePath === targetStoredPath) {
      summary.supporting.skipped += 1;
      continue;
    }

    const sourcePath = resolveStoredUploadPath(document.filePath);
    const targetPath = resolveStoredUploadPath(targetStoredPath);
    const sourceExists = await exists(sourcePath);
    const targetExists = await exists(targetPath);

    if (!sourceExists && !targetExists) {
      summary.supporting.missing.push({ id: document.id, path: document.filePath });
      continue;
    }

    if (sourceExists) {
      await moveFile(sourcePath, targetPath);
    }

    await prisma.supportingDocument.update({
      where: { id: document.id },
      data: { filePath: targetStoredPath },
    });

    summary.supporting.migrated += 1;
  }
}

async function main() {
  const summary = {
    uploadsDir: UPLOADS_DIR,
    training: { migrated: 0, skipped: 0, missing: [] },
    supporting: { migrated: 0, skipped: 0, missing: [] },
  };

  await migrateTrainings(summary);
  await migrateSupportingDocuments(summary);

  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
