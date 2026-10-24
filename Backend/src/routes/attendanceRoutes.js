import express from 'express';
import { checkIn, checkOut, getAttendance } from '../controllers/attendanceController.js';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/check-in', authenticateToken, authorizeRoles('EMPLOYEE'), checkIn);
router.post('/check-out', authenticateToken, authorizeRoles('EMPLOYEE'), checkOut);
router.get('/', authenticateToken, getAttendance);

export default router;