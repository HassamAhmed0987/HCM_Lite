import express from 'express';
import { generatePayrollDraft, finalizePayroll, downloadPayslip, getPayroll } from '../controllers/payrollController.js';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', authenticateToken, getPayroll);
router.post('/generate', authenticateToken, authorizeRoles('ADMIN', 'HR'), generatePayrollDraft);
router.post('/finalize', authenticateToken, authorizeRoles('ADMIN'), finalizePayroll);
router.get('/:payrollId/payslip', authenticateToken, downloadPayslip);

export default router;