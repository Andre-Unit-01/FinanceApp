// Budget routes expose both category-budget CRUD and the monthly planner API.
// The planner endpoint combines stored plans with actual transactions.
import { Router } from 'express';
import { getBudgets, create, update, remove, getPlanner, saveMonthly } from '../controllers/budgetController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);
router.get('/planner', getPlanner);
router.put('/monthly', saveMonthly);
router.get('/', getBudgets);
router.post('/', create);
router.patch('/:id', update);
router.delete('/:id', remove);

export default router;
