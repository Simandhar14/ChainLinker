// token-related routes live here
import { Router } from 'express';
import { getTokenInsight } from '../controllers/tokenController.js';
const router = Router();

// POST /api/token/:id/insight
router.post('/:id/insight', getTokenInsight);

export default router;
