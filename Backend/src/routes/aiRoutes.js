import express from 'express';
import { handleAiAssistant } from '../controllers/aiController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/chat', authenticateToken, handleAiAssistant);

export default router;