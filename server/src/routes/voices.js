import { Router } from 'express';
import { listVoices } from '../services/elevenlabs.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const data = await listVoices();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
