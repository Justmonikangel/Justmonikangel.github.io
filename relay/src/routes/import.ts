import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { access, mkdtemp, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Hono } from 'hono';
import { z } from 'zod';
import { config } from '../config.ts';
import { sessionDir } from '../lib/sessions.ts';

const SessionManifestSchema = z
  .object({
    id: z.string().min(1),
    title: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    turnCount: z.number().int().nonnegative(),
    compactedThrough: z.number().int().nonnegative(),
    skills: z.array(z.string()),
  })
  .refine((manifest) => manifest.compactedThrough <= manifest.turnCount, {
    message: 'compactedThrough must not exceed turnCount',
  });

export const importRoutes = new Hono();

importRoutes.post('/import', async (c) => {
  const form = await c.req.parseBody({ all: true });
  const archive = pickArchiveFile(form);
  if (!archive) {
    return c.json({ error: 'multipart tar.gz file is required' }, 400);
  }

  const tempRoot = await mkdtemp(join(tmpdir(), 'relay-import-'));
  const archivePath = join(tempRoot, `${randomUUID()}.tar.gz`);
  const extractDir = join(tempRoot, 'extracted');

  try {
    await writeFile(archivePath, Buffer.from(await archive.arrayBuffer()));

    const entries = await listArchiveEntries(archivePath);
    if (entries.some(isUnsafeTarEntry)) {
      return c.json({ error: 'archive contains unsafe paths' }, 400);
    }

    await mkdir(extractDir, { recursive: true });
    await runTar(['-xzf', archivePath, '-C', extractDir]);

    const manifestPath = join(extractDir, 'manifest.json');
    const manifest = SessionManifestSchema.parse(
      JSON.parse(await readFile(manifestPath, 'utf8')),
    );

    const dest = sessionDir(manifest.id);
    if (await exists(dest)) {
      return c.json({ error: 'session already exists' }, 409);
    }

    await mkdir(join(config.dataDir, 'sessions'), { recursive: true });
    await rename(extractDir, dest);
    return c.json(manifest, 201);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return c.json(
        { error: 'invalid manifest', issues: err.issues.map((issue) => issue.message) },
        400,
      );
    }
    return c.json({ error: (err as Error).message ?? 'import failed' }, 400);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

function pickArchiveFile(form: Record<string, unknown>): File | null {
  const preferred = form.file ?? form.archive ?? form['tar.gz'];
  if (preferred instanceof File) return preferred;
  if (Array.isArray(preferred)) {
    const found = preferred.find((item): item is File => item instanceof File);
    if (found) return found;
  }

  for (const value of Object.values(form)) {
    if (value instanceof File) return value;
    if (Array.isArray(value)) {
      const found = value.find((item): item is File => item instanceof File);
      if (found) return found;
    }
  }
  return null;
}

async function listArchiveEntries(archivePath: string): Promise<string[]> {
  const stdout = await runTar(['-tzf', archivePath]);
  return stdout.split('\n').map((entry) => entry.trim()).filter(Boolean);
}

function isUnsafeTarEntry(entry: string): boolean {
  return entry.startsWith('/') || entry.split('/').includes('..');
}

async function runTar(args: string[]): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const proc = spawn('tar', args);
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];

    proc.stdout.on('data', (chunk) => stdout.push(Buffer.from(chunk)));
    proc.stderr.on('data', (chunk) => stderr.push(Buffer.from(chunk)));
    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code === 0) {
        resolve(Buffer.concat(stdout).toString('utf8'));
        return;
      }
      reject(new Error(Buffer.concat(stderr).toString('utf8') || `tar exited with code ${code}`));
    });
  });
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}
