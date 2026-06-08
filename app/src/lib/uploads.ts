import path from "path";

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
] as const;

export function getUploadsRootDir() {
  const configuredDir = process.env.UPLOADS_DIR?.trim();

  if (configuredDir) {
    return configuredDir;
  }

  return path.join(process.cwd(), STORED_UPLOADS_PREFIX);
}

export function getUploadsSubdir(...segments: string[]) {
  return path.join(getUploadsRootDir(), ...segments);
}

export function buildStoredUploadPath(...segments: string[]) {
  return path.posix.join(STORED_UPLOADS_PREFIX, ...segments);
}

export function resolveStoredUploadPath(storedPath: string) {
  const normalized = storedPath.replace(/\\/g, "/").replace(/^\/+/, "");

  if (normalized === STORED_UPLOADS_PREFIX) {
    return getUploadsRootDir();
  }

  if (normalized.startsWith(`${STORED_UPLOADS_PREFIX}/`)) {
    return path.join(
      getUploadsRootDir(),
      normalized.slice(STORED_UPLOADS_PREFIX.length + 1),
    );
  }

  return path.isAbsolute(storedPath)
    ? storedPath
    : path.join(process.cwd(), storedPath);
}

export function sanitizeUploadPathSegment(value: string) {
  const normalized = value.trim().replace(/[^a-zA-Z0-9._-]/g, "_");
  return normalized || "unknown";
}

export function getSupportingDocumentPeriodSegment(periodMonth: number, periodYear: number) {
  const monthLabel = PERIOD_MONTH_LABELS[periodMonth - 1];
  return `${monthLabel || "UNK"}-${periodYear}`;
}

export function getTrainingCertificateRelativePath(nip: string, year: number, filename: string) {
  return buildStoredUploadPath(
    "certificates",
    sanitizeUploadPathSegment(nip),
    String(year),
    filename,
  );
}

export function getSupportingDocumentRelativePath(
  nip: string,
  periodMonth: number,
  periodYear: number,
  filename: string,
) {
  return buildStoredUploadPath(
    "supporting-documents",
    sanitizeUploadPathSegment(nip),
    getSupportingDocumentPeriodSegment(periodMonth, periodYear),
    filename,
  );
}
