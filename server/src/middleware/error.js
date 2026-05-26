import { ElevenLabsError } from '../services/elevenlabs.js';

export const notFound = (req, res) => {
  res.status(404).json({ error: 'not_found', path: req.path });
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, _next) => {
  if (err instanceof ElevenLabsError) {
    return res.status(err.status || 502).json({
      error: 'elevenlabs_error',
      message: err.message,
      upstream: err.body,
    });
  }
  if (err && err.status) {
    return res.status(err.status).json({ error: err.code || 'error', message: err.message });
  }
  console.error('[unhandled]', err);
  res.status(500).json({ error: 'internal_error', message: 'Something went wrong.' });
};
