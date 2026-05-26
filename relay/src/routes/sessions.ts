import { Hono } from 'hono';
import {
  createSession,
  listSessions,
  readManifest,
  writeManifest,
} from '../lib/sessions.ts';
import { loadTurns } from '../memory/markdown.ts';
import { listAvailableSkills } from '../skills/loader.ts';

export const sessionRoutes = new Hono();

sessionRoutes.get('/', async (c) => c.json(await listSessions()));

sessionRoutes.post('/', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  return c.json(await createSession(body.title));
});

sessionRoutes.get('/skills', async (c) => c.json(await listAvailableSkills()));

sessionRoutes.get('/:id', async (c) => {
  try {
    return c.json(await readManifest(c.req.param('id')));
  } catch {
    return c.json({ error: 'not found' }, 404);
  }
});

sessionRoutes.get('/:id/turns', async (c) => {
  try {
    return c.json(await loadTurns(c.req.param('id')));
  } catch {
    return c.json([]);
  }
});

sessionRoutes.patch('/:id', async (c) => {
  const id = c.req.param('id');
  const body = (await c.req.json()) as { title?: string; skills?: string[] };
  const m = await readManifest(id);
  if (typeof body.title === 'string') m.title = body.title;
  if (Array.isArray(body.skills)) m.skills = body.skills;
  await writeManifest(m);
  return c.json(m);
});
