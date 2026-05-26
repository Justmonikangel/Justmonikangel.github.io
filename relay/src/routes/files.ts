import { Hono } from 'hono';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { sessionDir } from '../lib/sessions.ts';
import type { Attachment, AttachmentKind } from '../types.ts';

export const fileRoutes = new Hono();

fileRoutes.post('/:id/upload', async (c) => {
  const sessionId = c.req.param('id');
  const form = await c.req.parseBody({ all: true });
  const raw = form['files'] ?? form['file'];
  const files = (Array.isArray(raw) ? raw : [raw]).filter(
    (f): f is File => f instanceof File,
  );
  const dir = join(sessionDir(sessionId), 'uploads');
  await mkdir(dir, { recursive: true });

  const out: Attachment[] = [];
  for (const f of files) {
    const id = randomUUID();
    const safeName = f.name.replace(/[^\w.\- ]+/g, '_') || `${id}.bin`;
    const dest = join(dir, `${id}-${safeName}`);
    await writeFile(dest, Buffer.from(await f.arrayBuffer()));
    out.push({
      id,
      name: safeName,
      mime: f.type || 'application/octet-stream',
      path: dest,
      kind: classify(f.type, safeName),
    });
  }
  return c.json(out);
});

function classify(mime: string, name: string): AttachmentKind {
  if (mime.startsWith('image/')) return 'image';
  if (mime === 'application/pdf' || /\.pdf$/i.test(name)) return 'pdf';
  if (
    mime.startsWith('text/') ||
    /json|markdown|csv|tex|yaml|toml/i.test(mime) ||
    /\.(md|txt|json|csv|tex|yaml|yml|toml|rtf)$/i.test(name)
  ) {
    return 'text';
  }
  return 'other';
}
