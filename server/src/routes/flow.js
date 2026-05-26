import { Router } from 'express';
import { STEPS, renderPrompt, initialState } from '../lib/sedonaFlow.js';

const router = Router();

// Returns the full script template (every step's prompt with a placeholder emotion).
// Useful for a frontend to preload or pre-render copy.
router.get('/script', (req, res) => {
  const fakeState = initialState();
  fakeState.currentEmotion = req.query.emotion || '这个感受';
  const scripts = {};
  for (const step of Object.values(STEPS)) {
    fakeState.step = step;
    scripts[step] = renderPrompt(fakeState);
  }
  res.json({
    steps: Object.values(STEPS),
    scripts,
    notes: {
      method: 'The Sedona Method, created by Lester Levenson; popularized by Hale Dwoskin.',
      three_questions: [
        'Could you let it go?',
        'Would you?',
        'When?',
      ],
    },
  });
});

export default router;
