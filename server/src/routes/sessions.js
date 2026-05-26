import { Router } from 'express';
import { createSession, getSession, updateSession, deleteSession } from '../services/sessionStore.js';
import { advance, renderPrompt, initialState, isTerminal } from '../lib/sedonaFlow.js';

const router = Router();

const publicView = (session) => ({
  id: session.id,
  createdAt: session.createdAt,
  updatedAt: session.updatedAt,
  state: {
    step: session.state.step,
    currentEmotion: session.state.currentEmotion,
    releaseCount: session.state.releaseCount,
    terminal: isTerminal(session.state),
  },
  prompt: renderPrompt(session.state),
  history: session.state.history,
});

// Create a new session and return the opening prompt.
router.post('/', (req, res) => {
  const session = createSession();
  // Record the opening prompt in history so the client gets the welcome line.
  const prompt = renderPrompt(session.state);
  session.state.history.push({
    role: 'guide',
    step: prompt.step,
    text_zh: prompt.say.zh,
    text_en: prompt.say.en,
    at: Date.now(),
  });
  res.status(201).json(publicView(session));
});

// Fetch session state.
router.get('/:id', (req, res) => {
  const s = getSession(req.params.id);
  if (!s) return res.status(404).json({ error: 'session_not_found' });
  res.json(publicView(s));
});

// Submit a user turn; advance the flow.
router.post('/:id/turn', (req, res) => {
  const s = getSession(req.params.id);
  if (!s) return res.status(404).json({ error: 'session_not_found' });

  const { input = '' } = req.body || {};
  if (typeof input !== 'string') {
    return res.status(400).json({ error: 'invalid_input', message: 'input must be a string' });
  }
  if (input.length > 2000) {
    return res.status(400).json({ error: 'input_too_long', message: 'max 2000 chars' });
  }

  updateSession(s.id, (session) => {
    advance(session.state, input);
  });

  res.json(publicView(s));
});

// Reset a session to the welcome step but keep the id.
router.post('/:id/reset', (req, res) => {
  const s = getSession(req.params.id);
  if (!s) return res.status(404).json({ error: 'session_not_found' });
  updateSession(s.id, (session) => {
    session.state = initialState();
    const prompt = renderPrompt(session.state);
    session.state.history.push({
      role: 'guide',
      step: prompt.step,
      text_zh: prompt.say.zh,
      text_en: prompt.say.en,
      at: Date.now(),
    });
  });
  res.json(publicView(s));
});

router.delete('/:id', (req, res) => {
  const ok = deleteSession(req.params.id);
  if (!ok) return res.status(404).json({ error: 'session_not_found' });
  res.status(204).end();
});

export default router;
