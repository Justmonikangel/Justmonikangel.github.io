import 'dotenv/config';

const required = (name, fallback) => {
  const v = process.env[name];
  if (v === undefined || v === '') {
    if (fallback !== undefined) return fallback;
    return null;
  }
  return v;
};

export const config = {
  port: parseInt(required('PORT', '3000'), 10),
  nodeEnv: required('NODE_ENV', 'development'),
  corsOrigin: required('CORS_ORIGIN', '*'),
  elevenlabs: {
    apiKey: required('ELEVENLABS_API_KEY'),
    defaultVoiceId: required('ELEVENLABS_DEFAULT_VOICE_ID', '21m00Tcm4TlvDq8ikWAM'),
    modelId: required('ELEVENLABS_MODEL_ID', 'eleven_multilingual_v2'),
    baseUrl: 'https://api.elevenlabs.io/v1',
  },
  session: {
    ttlMinutes: parseInt(required('SESSION_TTL_MINUTES', '60'), 10),
  },
};

export const isElevenLabsConfigured = () => Boolean(config.elevenlabs.apiKey);
