// Analytics routes expose read-only calculated summaries for authenticated
// users. The calculations themselves live in analyticsService.
import { Router } from 'express';
import { getMonthly } from '../controllers/analyticsController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);
router.get('/monthly', getMonthly);

export default router;
