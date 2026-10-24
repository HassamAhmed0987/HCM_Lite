import express from 'express';
import { applyLeave, updateLeaveStatus, getLeaves } from '../controllers/leaveController.js';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', authenticateToken, getLeaves);
router.post('/', authenticateToken, authorizeRoles('EMPLOYEE'), applyLeave);
router.put('/:leaveId/status', authenticateToken, authorizeRoles('ADMIN', 'HR'), updateLeaveStatus);

export default router;