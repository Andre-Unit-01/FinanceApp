// Transaction routes map HTTP verbs and URLs to controller functions.
// Authentication runs once for every route in this router.
import { Router } from 'express';
import { getTransactions, getTransaction, create, update, remove } from '../controllers/transactionController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);
router.get('/', getTransactions);
router.get('/:id', getTransaction);
router.post('/', create);
router.patch('/:id', update);
router.delete('/:id', remove);

export default router;
