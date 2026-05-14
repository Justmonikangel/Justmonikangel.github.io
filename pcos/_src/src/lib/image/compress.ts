/**
 * Compress an image File so it fits under the LLM vision payload limit.
 *
 * Why: Anthropic vision is documented as ~5MB per image after base64. A
 * modern phone photo is 3–8MB and base64 inflates by +33%. Direct uploads
 * fail or time out without compression. See ARCHITECTURE-v2.md §13 /
 * DECISIONS.md D-006.
 *
 * Strategy:
 *  - Decode to ImageBitmap.
 *  - Scale longest edge to maxWidth (default 1600px) preserving aspect.
 *  - Re-encode as JPEG at quality 0.8 (default) via OffscreenCanvas.
 *  - Fall back to HTMLCanvasElement when OffscreenCanvas is unavailable.
 *
 * The compressed Blob is what the rest of the pipeline (base64 + LLM)
 * should consume; the original File is not retained unless the user opted
 * in to IndexedDB storage in Settings.
 */
export interface CompressOptions {
  maxWidth?: number;
  quality?: number;
  mimeType?: 'image/jpeg' | 'image/webp';
}

export async function compressImage(file: File, opts: CompressOptions = {}): Promise<Blob> {
  const maxWidth = opts.maxWidth ?? 1600;
  const quality = opts.quality ?? 0.8;
  const mimeType = opts.mimeType ?? 'image/jpeg';

  const bitmap = await createImageBitmap(file);
  const longest = Math.max(bitmap.width, bitmap.height);
  const scale = longest > maxWidth ? maxWidth / longest : 1;
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  if (typeof OffscreenCanvas !== 'undefined') {
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('OffscreenCanvas 2d context unavailable');
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    return canvas.convertToBlob({ type: mimeType, quality });
  }

  // Fallback: DOM canvas + toBlob
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2d context unavailable');
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('canvas.toBlob returned null'))),
      mimeType,
      quality,
    );
  });
}
