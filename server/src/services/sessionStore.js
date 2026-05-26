import { nanoid } from 'nanoid';
import { initialState } from '../lib/sedonaFlow.js';
import { config } from '../config.js';

const sessions = new Map();

const isExpired = (s) => {
  const ttlMs = config.session.ttlMinutes * 60 * 1000;
  return Date.now() - s.updatedAt > ttlMs;
};

export const createSession = () => {
  const id = nanoid(16);
  const now = Date.now();
  const session = {
    id,
    createdAt: now,
    updatedAt: now,
    state: initialState(),
  };
  sessions.set(id, session);
  return session;
};

export const getSession = (id) => {
  const s = sessions.get(id);
  if (!s) return null;
  if (isExpired(s)) {
    sessions.delete(id);
    return null;
  }
  return s;
};

export const updateSession = (id, mutator) => {
  const s = getSession(id);
  if (!s) return null;
  mutator(s);
  s.updatedAt = Date.now();
  return s;
};

export const deleteSession = (id) => sessions.delete(id);

// Periodic cleanup so memory doesn't drift in a long-running process.
setInterval(() => {
  for (const [id, s] of sessions) {
    if (isExpired(s)) sessions.delete(id);
  }
}, 5 * 60 * 1000).unref();

export const sessionCount = () => sessions.size;
