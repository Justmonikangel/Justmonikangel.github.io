import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import { config, isElevenLabsConfigured } from './config.js';
import { sessionCount } from './services/sessionStore.js';
import sessionsRouter from './routes/sessions.js';
import ttsRouter from './routes/tts.js';
import voicesRouter from './routes/voices.js';
import flowRouter from './routes/flow.js';
import { notFound, errorHandler } from './middleware/error.js';

const app = express();

app.disable('x-powered-by');
app.use(express.json({ limit: '64kb' }));

const corsOptions =
  config.corsOrigin === '*'
    ? { origin: true }
    : {
        origin: config.corsOrigin.split(',').map((s) => s.trim()).filter(Boolean),
      };
app.use(cors(corsOptions));

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

const ttsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/tts', ttsLimiter);

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    env: config.nodeEnv,
    elevenlabs: isElevenLabsConfigured(),
    sessions: sessionCount(),
    uptime_s: Math.round(process.uptime()),
  });
});

app.use('/api/sessions', sessionsRouter);
app.use('/api/tts', ttsRouter);
app.use('/api/voices', voicesRouter);
app.use('/api/flow', flowRouter);

app.use(notFound);
app.use(errorHandler);

const server = app.listen(config.port, () => {
  console.log(`[sedona-server] listening on :${config.port} (${config.nodeEnv})`);
  if (!isElevenLabsConfigured()) {
    console.warn('[sedona-server] ELEVENLABS_API_KEY not set — /api/tts and /api/voices will return 503.');
  }
});

const shutdown = (signal) => {
  console.log(`[sedona-server] ${signal} received, shutting down`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
};
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

export default app;
