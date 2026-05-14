import { compressImage, type CompressOptions } from '@/lib/image/compress';
import type { VisionImageInput } from '@/lib/llm/types';

/**
 * Convert an uploaded image File into a vision-API-friendly base64 payload.
 *
 * Always compresses first (see ARCHITECTURE-v2.md §13). The returned
 * `mimeType` matches the compressed encoding, not the original.
 */
export async function fileToVisionInput(
  file: File,
  opts?: CompressOptions,
): Promise<VisionImageInput> {
  const compressed = await compressImage(file, opts);
  const data = await blobToBase64(compressed);
  return { mimeType: compressed.type, data };
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('FileReader returned non-string'));
        return;
      }
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error ?? new Error('FileReader error'));
    reader.readAsDataURL(blob);
  });
}
