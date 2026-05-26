import { mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { config } from '../config.ts';
import type { SessionManifest } from '../types.ts';

const root = () => join(config.dataDir, 'sessions');

export function sessionDir(sessionId: string): string {
  return join(root(), sessionId);
}

export async function createSession(title?: string): Promise<SessionManifest> {
  const id = randomUUID();
  const now = new Date().toISOString();
  const manifest: SessionManifest = {
    id,
    title: title?.trim() || 'untitled',
    createdAt: now,
    updatedAt: now,
    turnCount: 0,
    compactedThrough: 0,
    skills: [],
  };
  const dir = sessionDir(id);
  await mkdir(join(dir, 'turns'), { recursive: true });
  await mkdir(join(dir, 'digests'), { recursive: true });
  await mkdir(join(dir, 'uploads'), { recursive: true });
  await writeManifest(manifest);
  return manifest;
}

export async function readManifest(sessionId: string): Promise<SessionManifest> {
  const data = await readFile(join(sessionDir(sessionId), 'manifest.json'), 'utf8');
  return JSON.parse(data) as SessionManifest;
}

export async function writeManifest(m: SessionManifest): Promise<void> {
  m.updatedAt = new Date().toISOString();
  await writeFile(
    join(sessionDir(m.id), 'manifest.json'),
    JSON.stringify(m, null, 2),
  );
}

export async function listSessions(): Promise<SessionManifest[]> {
  let ids: string[];
  try {
    ids = await readdir(root());
  } catch {
    return [];
  }
  const out: SessionManifest[] = [];
  for (const id of ids) {
    try {
      out.push(await readManifest(id));
    } catch {}
  }
  return out.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
