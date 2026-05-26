import { Hono } from 'hono';
import { stream } from 'hono/streaming';
import { spawn } from 'node:child_process';
import { readManifest, sessionDir } from '../lib/sessions.ts';

export const forkRoutes = new Hono();

forkRoutes.get('/:id/fork', async (c) => {
  const id = c.req.param('id');
  const manifest = await readManifest(id).catch(() => null);
  if (!manifest) return c.json({ error: 'not found' }, 404);

  const dir = sessionDir(id);
  const safeTitle = manifest.title.replace(/[^\w.\-]+/g, '_') || 'session';
  c.header('Content-Type', 'application/gzip');
  c.header(
    'Content-Disposition',
    `attachment; filename="${safeTitle}-${id}.tar.gz"`,
  );

  return stream(c, async (s) => {
    const proc = spawn('tar', ['-czf', '-', '-C', dir, '.']);
    proc.stderr.on('data', (d) => console.warn('[fork tar]', d.toString()));
    for await (const chunk of proc.stdout as AsyncIterable<Buffer>) {
      await s.write(chunk);
    }
    await new Promise<void>((resolve) => proc.on('close', () => resolve()));
  });
});
