import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { config } from './config.ts';
import { ensureDataDir } from './lib/fs.ts';
import { ombreEnabled } from './memory/ombrebrain.ts';
import { importRoutes } from './routes/import.ts';
import { sessionRoutes } from './routes/sessions.ts';
import { chatRoutes } from './routes/chat.ts';
import { fileRoutes } from './routes/files.ts';
import { forkRoutes } from './routes/fork.ts';

await ensureDataDir(config.dataDir);

const app = new Hono();
app.use('*', cors());
app.use('/api/*', async (c, next) => {
  if (c.req.method === 'OPTIONS') {
    await next();
    return;
  }

  if (!config.relayToken) {
    await next();
    return;
  }

  const expected = `Bearer ${config.relayToken}`;
  const header = c.req.header('Authorization');
  if (header !== expected) {
    return c.json({ error: 'unauthorized' }, 401);
  }

  await next();
});

app.get('/health', (c) =>
  c.json({
    ok: true,
    claudeModel: config.claude.model,
    gptModel: config.gpt.model,
    ombrebrain: ombreEnabled(),
  }),
);

app.route('/api/sessions', importRoutes);
app.route('/api/sessions', sessionRoutes);
app.route('/api/sessions', chatRoutes);
app.route('/api/sessions', fileRoutes);
app.route('/api/sessions', forkRoutes);
app.use('/*', serveStatic({ root: './web/dist' }));

serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(`relay listening on http://localhost:${info.port}`);
});
