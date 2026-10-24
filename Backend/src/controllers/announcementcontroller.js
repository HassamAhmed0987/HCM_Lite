import Announcement from '../models/announcement.js';
import AuditLog from '../models/auditLog.js';

// 1. Post Announcement (Admin / HR Only)
export const createAnnouncement = async (req, res) => {
  try {
    const { title, content, targetDepartment } = req.body;
    
    const announcement = await Announcement.create({
      title,
      content,
      author: req.user.userId,
      targetDepartment: targetDepartment || 'ALL'
    });
    
    // Log the action in Audit Logs
    await AuditLog.create({
      user: req.user.userId,
      action: 'ANNOUNCEMENT_CREATED',
      details: `Announcement published: "${title}"`
    });

    res.status(201).json({ message: "Announcement published successfully", announcement });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. Get All Announcements (All authenticated users)
export const getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .populate('author', 'email role')
      .sort({ createdAt: -1 });
      
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 3. Get Audit Logs (Admin Only)
export const getAuditLogs = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: "Access denied. Admin only." });
    }

    const logs = await AuditLog.find()
      .populate('user', 'email role')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};