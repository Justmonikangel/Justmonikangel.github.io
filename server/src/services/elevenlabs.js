import { config, isElevenLabsConfigured } from '../config.js';

class ElevenLabsError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = 'ElevenLabsError';
    this.status = status;
    this.body = body;
  }
}

const headers = () => ({
  'xi-api-key': config.elevenlabs.apiKey,
  Accept: 'application/json',
});

export const listVoices = async () => {
  if (!isElevenLabsConfigured()) {
    throw new ElevenLabsError('ELEVENLABS_API_KEY is not configured', 503);
  }
  const res = await fetch(`${config.elevenlabs.baseUrl}/voices`, { headers: headers() });
  if (!res.ok) {
    const body = await res.text();
    throw new ElevenLabsError('Failed to list voices', res.status, body);
  }
  return res.json();
};

export const synthesize = async ({
  text,
  voiceId,
  modelId,
  stability = 0.45,
  similarity = 0.75,
  style = 0.2,
  speakerBoost = true,
}) => {
  if (!isElevenLabsConfigured()) {
    throw new ElevenLabsError('ELEVENLABS_API_KEY is not configured', 503);
  }
  if (!text || !text.trim()) {
    throw new ElevenLabsError('text is required', 400);
  }
  const voice = voiceId || config.elevenlabs.defaultVoiceId;
  const model = modelId || config.elevenlabs.modelId;

  const url = `${config.elevenlabs.baseUrl}/text-to-speech/${encodeURIComponent(voice)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      ...headers(),
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: model,
      voice_settings: {
        stability,
        similarity_boost: similarity,
        style,
        use_speaker_boost: speakerBoost,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new ElevenLabsError('ElevenLabs synthesis failed', res.status, body);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  return { audio: buf, contentType: res.headers.get('content-type') || 'audio/mpeg' };
};

export { ElevenLabsError };
