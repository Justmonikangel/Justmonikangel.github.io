import { del, get, keys, set } from 'idb-keyval';

/**
 * Thin wrapper around idb-keyval for opt-in original image storage.
 *
 * v2 rule: original report images NEVER touch localStorage. They only go
 * to IndexedDB when the user toggles "保留原图" in Settings.
 */
const KEY_PREFIX = 'cyster.original-image.';

export async function putOriginalImage(id: string, blob: Blob): Promise<void> {
  await set(`${KEY_PREFIX}${id}`, blob);
}

export async function getOriginalImage(id: string): Promise<Blob | undefined> {
  return get<Blob>(`${KEY_PREFIX}${id}`);
}

export async function deleteOriginalImage(id: string): Promise<void> {
  await del(`${KEY_PREFIX}${id}`);
}

export async function listOriginalImageKeys(): Promise<string[]> {
  const all = await keys();
  return all
    .filter((k): k is string => typeof k === 'string' && k.startsWith(KEY_PREFIX))
    .map((k) => k.slice(KEY_PREFIX.length));
}
