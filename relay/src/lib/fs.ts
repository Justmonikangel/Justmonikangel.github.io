import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

export async function ensureDataDir(dataDir: string): Promise<void> {
  await mkdir(join(dataDir, 'sessions'), { recursive: true });
}
