import { Router } from 'express';
import { synthesize } from '../services/elevenlabs.js';
import { config, isElevenLabsConfigured } from '../config.js';

const router = Router();

router.get('/status', (req, res) => {
  res.json({
    configured: isElevenLabsConfigured(),
    defaultVoiceId: isElevenLabsConfigured() ? config.elevenlabs.defaultVoiceId : null,
    modelId: config.elevenlabs.modelId,
  });
});

// POST /api/tts  -> audio/mpeg
// Body: { text, voiceId?, modelId?, stability?, similarity?, style?, speakerBoost? }
router.post('/', async (req, res, next) => {
  try {
    const {
      text,
      voiceId,
      modelId,
      stability,
      similarity,
      style,
      speakerBoost,
    } = req.body || {};

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'invalid_text', message: 'text is required' });
    }
    if (text.length > 2500) {
      return res.status(400).json({ error: 'text_too_long', message: 'max 2500 chars per request' });
    }

    const { audio, contentType } = await synthesize({
      text,
      voiceId,
      modelId,
      stability,
      similarity,
      style,
      speakerBoost,
    });

    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'no-store');
    res.send(audio);
  } catch (err) {
    next(err);
  }
});

export default router;
