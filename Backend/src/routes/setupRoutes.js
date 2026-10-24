import express from 'express';
import { getSettings, updateSettings } from '../controllers/setupController.js';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', authenticateToken, getSettings);
router.put('/', authenticateToken, authorizeRoles('ADMIN'), updateSettings);

export default router;