import express from 'express';
import { registerEmployee, getEmployees, csvDryRun } from '../controllers/employee.js';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', authenticateToken, getEmployees);
router.post('/', authenticateToken, authorizeRoles('ADMIN', 'HR'), registerEmployee);
router.post('/csv-dry-run', authenticateToken, authorizeRoles('ADMIN', 'HR'), csvDryRun);

export default router;