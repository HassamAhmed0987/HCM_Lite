import Leave from '../models/leave.js';
import CompanySetting from '../models/companySetting.js';

// Helper to calculate working days between two dates (skipping weekends & holidays)
const calculateWorkingDays = async (startStr, endStr) => {
  const settings = await CompanySetting.findOne();
  const weekendDays = settings ? settings.weekendDays : [0, 6]; // Default Sun, Sat
  const holidays = settings ? settings.holidays.map(h => new Date(h.date).toISOString().split('T')[0]) : [];

  let count = 0;
  let curr = new Date(startStr);
  const end = new Date(endStr);

  while (curr <= end) {
    const dateStr = curr.toISOString().split('T')[0];
    const dayOfWeek = curr.getDay(); // 0 = Sun, 6 = Sat

    const isWeekend = weekendDays.includes(dayOfWeek);
    const isHoliday = holidays.includes(dateStr);

    if (!isWeekend && !isHoliday) {
      count++;
    }
    curr.setDate(curr.getDate() + 1);
  }
  return count;
};

// 1. Apply for Leave
export const applyLeave = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    if (!employeeId) {
      return res.status(403).json({ error: "Only employees can apply for leave" });
    }

    const { leaveType, startDate, endDate, reason } = req.body;
    if (!leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({ error: "Start date cannot be after end date" });
    }

    // Check for date overlaps with existing pending/approved leaves
    const existingLeaves = await Leave.find({
      employee: employeeId,
      status: { $in: ['PENDING', 'APPROVED'] },
      $or: [
        { startDate: { $lte: endDate }, endDate: { $gte: startDate } }
      ]
    });

    if (existingLeaves.length > 0) {
      return res.status(422).json({ error: "Leave dates overlap with an existing request" });
    }

    const daysCount = await calculateWorkingDays(startDate, endDate);
    if (daysCount <= 0) {
      return res.status(400).json({ error: "Selected period contains no working days" });
    }

    // Check quota limits if leaveType is not UNPAID
    if (leaveType !== 'UNPAID') {
      const settings = await CompanySetting.findOne();
      const quotas = settings ? settings.leaveQuotas : { annual: 14, sick: 8, casual: 10 };
      const maxQuota = quotas[leaveType.toLowerCase()] || 0;

      const currentYear = new Date().getFullYear();
      const approvedLeaves = await Leave.find({
        employee: employeeId,
        leaveType,
        status: 'APPROVED',
        startDate: { $regex: `^${currentYear}` }
      });

      const usedDays = approvedLeaves.reduce((sum, l) => sum + l.daysCount, 0);

      if (usedDays + daysCount > maxQuota) {
        return res.status(422).json({ 
          error: `Over-balance: You only have ${maxQuota - usedDays} days left for ${leaveType}` 
        });
      }
    }

    const leave = await Leave.create({
      employee: employeeId,
      leaveType,
      startDate,
      endDate,
      daysCount,
      reason
    });

    res.status(201).json({ message: "Leave applied successfully", leave });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. Approve or Reject Leave (HR / Admin)
export const updateLeaveStatus = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const { status, comment } = req.body; // status: APPROVED / REJECTED

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const leave = await Leave.findById(leaveId);
    if (!leave) {
      return res.status(404).json({ error: "Leave request not found" });
    }

    leave.status = status;
    leave.approverComment = comment || "";
    await leave.save();

    res.json({ message: `Leave request ${status.toLowerCase()} successfully`, leave });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 3. Get Leaves (Role-scoped)
export const getLeaves = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'EMPLOYEE') {
      query.employee = req.user.employeeId;
    }

    const leaves = await Leave.find(query).populate('employee', 'firstName lastName employeeCode department');
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};