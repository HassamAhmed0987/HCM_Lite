import Attendance from '../models/attendance.js';
import CompanySetting from '../models/companySetting.js';

// Helper to get current date string (YYYY-MM-DD)
const getTodayDate = () => {
  return new Date().toISOString().split('T')[0];
};

// 1. Check-In
export const checkIn = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    if (!employeeId) {
      return res.status(403).json({ error: "Only employees can check in" });
    }

    const today = getTodayDate();

    // Check if already checked in today
    const existingRecord = await Attendance.findOne({ employee: employeeId, date: today });
    if (existingRecord) {
      return res.status(409).json({ error: "Already checked in for today" });
    }

    // Get company settings for office hours & grace time
    const settings = await CompanySetting.findOne();
    const officeStart = settings ? settings.officeStart : "09:00"; // e.g., "09:00"
    const graceMinutes = settings ? settings.graceTimeMinutes : 15;

    // Calculate late threshold time
    const [startHour, startMin] = officeStart.split(':').map(Number);
    const thresholdDate = new Date();
    thresholdDate.setHours(startHour, startMin + graceMinutes, 0, 0);

    const now = new Date();
    const status = now > thresholdDate ? 'LATE' : 'PRESENT';

    const attendance = await Attendance.create({
      employee: employeeId,
      date: today,
      checkIn: now,
      status,
      source: req.body.source || 'WEB'
    });

    res.status(201).json({ message: "Checked in successfully", attendance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. Check-Out
export const checkOut = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    if (!employeeId) {
      return res.status(403).json({ error: "Only employees can check out" });
    }

    const today = getTodayDate();
    const attendance = await Attendance.findOne({ employee: employeeId, date: today });

    if (!attendance || !attendance.checkIn) {
      return res.status(400).json({ error: "No active check-in found for today" });
    }

    if (attendance.checkOut) {
      return res.status(400).json({ error: "Already checked out for today" });
    }

    const now = new Date();
    attendance.checkOut = now;

    // Calculate working hours
    const diffMs = now - new Date(attendance.checkIn);
    const workingHours = diffMs / (1000 * 60 * 60);
    attendance.workingHours = Number(workingHours.toFixed(2));

    // Check half-day rule (default under 5 hours)
    const settings = await CompanySetting.findOne();
    const halfDayLimit = settings ? settings.halfDayHours : 5;

    if (attendance.workingHours < halfDayLimit) {
      attendance.status = 'HALF_DAY';
    }

    await attendance.save();
    res.json({ message: "Checked out successfully", attendance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 3. Get Attendance Records (Role-scoped)
export const getAttendance = async (req, res) => {
  try {
    const { date, department, employeeId } = req.query;
    let query = {};

    if (date) query.date = date;
    if (employeeId) query.employee = employeeId;

    // Data scope enforcement for employees
    if (req.user.role === 'EMPLOYEE') {
      query.employee = req.user.employeeId;
    }

    const records = await Attendance.find(query).populate('employee', 'firstName lastName employeeCode department');
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};