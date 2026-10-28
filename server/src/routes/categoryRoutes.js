// Category URLs are protected and delegate all work to categoryController.
import { Router } from 'express';
import { getCategories, create, update, remove } from '../controllers/categoryController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);
router.get('/', getCategories);
router.post('/', create);
router.patch('/:id', update);
router.delete('/:id', remove);

export default router;
