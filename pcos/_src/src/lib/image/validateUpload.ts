/**
 * Validate an uploaded report image before sending it to the OCR pipeline.
 *
 * P1 rules (ARCHITECTURE-v2.md §13):
 *  - Accepted MIME: image/jpeg, image/png, image/webp. PDF deferred to P1.5.
 *  - Single file <= 5 MB (raw, pre-compression).
 *  - Max 5 files per upload session.
 */
export interface UploadValidationOptions {
  maxFileSizeBytes?: number;
  maxFileCount?: number;
  acceptedMimeTypes?: string[];
}

export interface UploadValidationResult {
  ok: boolean;
  rejected: Array<{ file: File; reason: string }>;
  accepted: File[];
}

const DEFAULT_ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];

export function validateUpload(files: File[], opts: UploadValidationOptions = {}): UploadValidationResult {
  const maxFileSizeBytes = opts.maxFileSizeBytes ?? 5 * 1024 * 1024;
  const maxFileCount = opts.maxFileCount ?? 5;
  const acceptedMimeTypes = opts.acceptedMimeTypes ?? DEFAULT_ACCEPTED;

  const accepted: File[] = [];
  const rejected: UploadValidationResult['rejected'] = [];

  if (files.length > maxFileCount) {
    return {
      ok: false,
      rejected: files.slice(maxFileCount).map((file) => ({
        file,
        reason: `单次上传最多 ${maxFileCount} 张`,
      })),
      accepted: files.slice(0, maxFileCount),
    };
  }

  for (const file of files) {
    if (!acceptedMimeTypes.includes(file.type)) {
      rejected.push({ file, reason: `不支持的文件类型 ${file.type || '未知'}` });
      continue;
    }
    if (file.size > maxFileSizeBytes) {
      rejected.push({
        file,
        reason: `单文件超过 ${(maxFileSizeBytes / 1024 / 1024).toFixed(0)} MB 限制`,
      });
      continue;
    }
    accepted.push(file);
  }

  return { ok: rejected.length === 0, accepted, rejected };
}
