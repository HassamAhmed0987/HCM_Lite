import express from 'express';
import { createAnnouncement, getAnnouncements, getAuditLogs } from '../controllers/announcementcontroller.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/announcements', authenticateToken, getAnnouncements);
router.post('/announcements', authenticateToken, createAnnouncement);
router.get('/audit-logs', authenticateToken, getAuditLogs);

export default router;