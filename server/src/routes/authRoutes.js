// Routes describe public authentication URLs and protected account lookup.
// They do not implement authentication rules; authService and middleware do.
import { Router } from 'express';
import { register, login, me, logout } from '../controllers/authController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authMiddleware, me);

export default router;
