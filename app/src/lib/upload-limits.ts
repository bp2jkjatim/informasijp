export const MAX_UPLOAD_SIZE_MB = 25;
export const MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024;

export function isUploadSizeAllowed(fileSize: number) {
  return fileSize <= MAX_UPLOAD_SIZE_BYTES;
}

export function getUploadSizeLimitMessage(fileLabel = "File") {
  return `${fileLabel} maksimal ${MAX_UPLOAD_SIZE_MB} MB.`;
}
