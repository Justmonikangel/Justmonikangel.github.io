import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { config } from './config.ts';
import { ensureDataDir } from './lib/fs.ts';
import { sessionRoutes } from './routes/sessions.ts';
import { chatRoutes } from './routes/chat.ts';
import { fileRoutes } from './routes/files.ts';
import { forkRoutes } from './routes/fork.ts';

await ensureDataDir(config.dataDir);

const app = new Hono();
app.use('*', cors());

app.get('/health', (c) =>
  c.json({
    ok: true,
    claudeModel: config.claude.model,
    gptModel: config.gpt.model,
    ombrebrain: Boolean(config.ombrebrain.url),
  }),
);

app.route('/api/sessions', sessionRoutes);
app.route('/api/sessions', chatRoutes);
app.route('/api/sessions', fileRoutes);
app.route('/api/sessions', forkRoutes);

serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(`relay listening on http://localhost:${info.port}`);
});
