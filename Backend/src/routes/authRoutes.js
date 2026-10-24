import express from 'express';
import { login, changePassword } from '../controllers/authController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/login', login);
router.post('/change-password', authenticateToken, changePassword);

export default router;