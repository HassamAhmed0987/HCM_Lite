import mongoose from 'mongoose';
import Payroll from '../models/payroll.js';
import Employee from '../models/employee.js';
import Attendance from '../models/attendance.js';
import Leave from '../models/leave.js';
import PDFDocument from 'pdfkit';

// Calculate annual tax and return monthly tax
const calculateMonthlyTax = (annualGross) => {
  let annualTax = 0;

  if (annualGross <= 600000) {
    annualTax = 0;
  } else if (annualGross <= 1200000) {
    annualTax = (annualGross - 600000) * 0.05;
  } else if (annualGross <= 2400000) {
    annualTax = 30000 + (annualGross - 1200000) * 0.15;
  } else if (annualGross <= 3600000) {
    annualTax = 210000 + (annualGross - 2400000) * 0.25;
  } else {
    annualTax = 510000 + (annualGross - 3600000) * 0.35;
  }

  return annualTax / 12;
};

// 1. Generate Monthly Payroll Draft
export const generatePayrollDraft = async (req, res) => {
  try {
    const month = Number(req.body.month);
    const year = Number(req.body.year);

    if (
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12 ||
      !Number.isInteger(year) ||
      year < 2000
    ) {
      return res.status(400).json({
        error: 'A valid month and year are required',
      });
    }

    const employees = await Employee.find({
      status: { $ne: 'EXITED' },
    });

    const workingDays = 22;
    const generatedRecords = [];

    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 1));

    for (const emp of employees) {
      const existing = await Payroll.findOne({
        employee: emp._id,
        month,
        year,
      });

      // Never overwrite finalized payroll
      if (existing?.status === 'FINALIZED') {
        continue;
      }

      const basic = Number(emp.basicSalary);

      if (!Number.isFinite(basic) || basic < 0) {
        continue;
      }

      const gross = basic * 1.5;
      const perDayRate = gross / workingDays;

      // Assumes Attendance.date and Leave.startDate are Date fields.
      const attendances = await Attendance.find({
        employee: emp._id,
        date: {
          $gte: startDate,
          $lt: endDate,
        },
      });

      const absentDays = attendances.filter(
        (a) => a.status === 'ABSENT'
      ).length;

      const halfDays = attendances.filter(
        (a) => a.status === 'HALF_DAY'
      ).length;

      const unpaidLeaves = await Leave.find({
        employee: emp._id,
        leaveType: 'UNPAID',
        status: 'APPROVED',
        startDate: {
          $gte: startDate,
          $lt: endDate,
        },
      });

      const unpaidLeaveDays = unpaidLeaves.reduce(
        (sum, leave) => sum + (Number(leave.daysCount) || 0),
        0
      );

      const deductionDays =
        absentDays + unpaidLeaveDays + 0.5 * halfDays;

      const deductions = deductionDays * perDayRate;
      const monthlyTax = calculateMonthlyTax(gross * 12);
      const netSalary = Math.max(
        0,
        gross - deductions - monthlyTax
      );

      const payrollRecord = await Payroll.findOneAndUpdate(
        { employee: emp._id, month, year },
        {
          $set: {
            basicSalary: basic,
            grossSalary: gross,
            workingDays,
            absentDays,
            halfDays,
            unpaidLeaveDays,
            deductions: Number(deductions.toFixed(2)),
            monthlyTax: Number(monthlyTax.toFixed(2)),
            netSalary: Number(netSalary.toFixed(2)),
            status: 'DRAFT',
          },
        },
        {
          upsert: true,
          new: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        }
      );

      generatedRecords.push(payrollRecord);
    }

    return res.json({
      message: 'Payroll draft generated successfully',
      recordsCount: generatedRecords.length,
    });
  } catch (error) {
    console.error('Generate payroll error:', error);

    return res.status(500).json({
      error: 'Failed to generate payroll',
    });
  }
};

// 2. Finalize Payroll
export const finalizePayroll = async (req, res) => {
  try {
    const month = Number(req.body.month);
    const year = Number(req.body.year);

    if (
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12 ||
      !Number.isInteger(year) ||
      year < 2000
    ) {
      return res.status(400).json({
        error: 'A valid month and year are required',
      });
    }

    const result = await Payroll.updateMany(
      { month, year },
      { $set: { status: 'FINALIZED' } },
      { runValidators: true }
    );

    return res.json({
      message: `Payroll for ${month}/${year} has been finalized.`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error('Finalize payroll error:', error);

    return res.status(500).json({
      error: 'Failed to finalize payroll',
    });
  }
};

// 3. Download Payslip PDF
export const downloadPayslip = async (req, res) => {
  try {
    const { payrollId } = req.params;

    console.log('Payslip request ID:', payrollId);

    if (!mongoose.isValidObjectId(payrollId)) {
      return res.status(400).json({
        error: 'Invalid payroll ID',
      });
    }

    const payroll = await Payroll.findById(payrollId)
      .populate(
        'employee',
        'firstName lastName employeeCode department designation'
      );

    if (!payroll) {
      return res.status(404).json({
        error: 'Payroll record not found',
      });
    }

    if (!payroll.employee) {
      return res.status(404).json({
        error: 'Employee linked to this payroll was not found',
      });
    }

    // Employees can only download their own payslips
    if (req.user?.role === 'EMPLOYEE') {
      const employeeId = String(
        payroll.employee._id
      );

      const loggedInEmployeeId = String(
        req.user.employeeId ?? ''
      );

      if (
        !loggedInEmployeeId ||
        employeeId !== loggedInEmployeeId
      ) {
        return res.status(403).json({
          error: 'Access denied',
        });
      }
    }

    res.status(200);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="payslip-${payroll.month}-${payroll.year}.pdf"`
    );

    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
    });

    // Handle PDF stream errors
    doc.on('error', (error) => {
      console.error('PDFKit stream error:', error);

      if (!res.destroyed) {
        res.destroy(error);
      }
    });

    res.on('error', (error) => {
      console.error('PDF response error:', error);
    });

    doc.pipe(res);

    const employee = payroll.employee;

    doc.fontSize(20).text(
      'HCM Lite - Official Payslip',
      { align: 'center' }
    );

    doc.moveDown();

    doc.fontSize(12);
    doc.text(
      `Employee: ${employee.firstName ?? ''} ${employee.lastName ?? ''}`
    );
    doc.text(`Employee Code: ${employee.employeeCode ?? 'N/A'}`);
    doc.text(`Department: ${employee.department ?? 'N/A'}`);
    doc.text(`Designation: ${employee.designation ?? 'N/A'}`);
    doc.text(`Pay Period: ${payroll.month}/${payroll.year}`);

    doc.moveDown();

    doc.text(`Basic Salary: PKR ${payroll.basicSalary}`);
    doc.text(`Gross Salary: PKR ${payroll.grossSalary}`);
    doc.text(`Deductions: PKR ${payroll.deductions}`);
    doc.text(`Monthly Tax: PKR ${payroll.monthlyTax}`);

    doc.moveDown();

    doc.fontSize(14).text(
      `Net Salary: PKR ${payroll.netSalary}`
    );

    doc.end();
  } catch (error) {
    console.error('Download payslip error:', error);

    if (!res.headersSent) {
      return res.status(500).json({
        error: 'Failed to generate payslip',
      });
    }

    res.destroy(error);
  }
};

// 4. Get Payroll Records
export const getPayroll = async (req, res) => {
  try {
    const query = {};

    if (req.user?.role === 'EMPLOYEE') {
      if (!req.user.employeeId) {
        return res.status(403).json({
          error: 'Employee account is not linked to an employee record',
        });
      }

      query.employee = req.user.employeeId;
    }

    const payrolls = await Payroll.find(query).populate(
      'employee',
      'firstName lastName employeeCode department designation'
    );

    return res.json(payrolls);
  } catch (error) {
    console.error('Get payroll error:', error);

    return res.status(500).json({
      error: 'Failed to fetch payroll records',
    });
  }
};


// import Payroll from '../models/payroll.js';
// import Employee from '../models/employee.js';
// import Attendance from '../models/attendance.js';
// import Leave from '../models/leave.js';
// import PDFDocument from 'pdfkit';

// // Helper to calculate annual tax and return monthly tax
// const calculateMonthlyTax = (annualGross) => {
//   let annualTax = 0;
//   if (annualGross <= 600000) {
//     annualTax = 0;
//   } else if (annualGross <= 1200000) {
//     annualTax = (annualGross - 600000) * 0.05;
//   } else if (annualGross <= 2400000) {
//     annualTax = 30000 + (annualGross - 1200000) * 0.15;
//   } else if (annualGross <= 3600000) {
//     annualTax = 210000 + (annualGross - 2400000) * 0.25;
//   } else {
//     annualTax = 510000 + (annualGross - 3600000) * 0.35;
//   }
//   return annualTax / 12;
// };

// // 1. Create Monthly Payroll Draft (HR)
// export const generatePayrollDraft = async (req, res) => {
//   try {
//     const { month, year } = req.body;
//     if (!month || !year) {
//       return res.status(400).json({ error: "Month and year are required" });
//     }

//     const employees = await Employee.find({ status: { $ne: 'EXITED' } });
//     const workingDays = 22; // Standard working days assumption for a month

//     let generatedRecords = [];

//     for (let emp of employees) {
//       // Check if finalized payroll already exists for this employee/month/year
//       const existing = await Payroll.findOne({ employee: emp._id, month, year });
//       if (existing && existing.status === 'FINALIZED') continue;

//       const basic = emp.basicSalary;
//       const gross = basic * 1.5; // Gross = 1.5 * basic
//       const perDayRate = gross / workingDays;

//       // Count absents, half-days from attendance for this month
//       const monthStr = `${year}-${String(month).padStart(2, '0')}`;
//       const attendances = await Attendance.find({
//         employee: emp._id,
//         date: { $regex: `^${monthStr}` }
//       });

//       const absentDays = attendances.filter(a => a.status === 'ABSENT').length;
//       const halfDays = attendances.filter(a => a.status === 'HALF_DAY').length;

//       // Count unpaid leaves
//       const unpaidLeaves = await Leave.find({
//         employee: emp._id,
//         leaveType: 'UNPAID',
//         status: 'APPROVED',
//         startDate: { $regex: `^${monthStr}` }
//       });
//       const unpaidLeaveDays = unpaidLeaves.reduce((sum, l) => sum + l.daysCount, 0);

//       // Total deductions calculation
//       const deductionDays = absentDays + unpaidLeaveDays + (0.5 * halfDays);
//       const deductions = deductionDays * perDayRate;

//       // Tax calculation
//       const annualGross = gross * 12;
//       const monthlyTax = calculateMonthlyTax(annualGross);

//       const netSalary = Math.max(0, gross - deductions - monthlyTax);

//       // Upsert payroll record
//       const payrollRecord = await Payroll.findOneAndUpdate(
//         { employee: emp._id, month, year },
//         {
//           basicSalary: basic,
//           grossSalary: gross,
//           workingDays,
//           absentDays,
//           halfDays,
//           unpaidLeaveDays,
//           deductions: Number(deductions.toFixed(2)),
//           monthlyTax: Number(monthlyTax.toFixed(2)),
//           netSalary: Number(netSalary.toFixed(2)),
//           status: 'DRAFT'
//         },
//         { upsert: true, new: true }
//       );

//       generatedRecords.push(payrollRecord);
//     }

//     res.json({ message: "Payroll draft generated successfully", recordsCount: generatedRecords.length });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// // 2. Finalize Payroll (Admin Only - Locks the month)
// export const finalizePayroll = async (req, res) => {
//   try {
//     const { month, year } = req.body;
//     await Payroll.updateMany({ month, year }, { status: 'FINALIZED' });
//     res.json({ message: `Payroll for ${month}/${year} has been finalized and locked.` });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// // 3. Download Payslip PDF
// export const downloadPayslip = async (req, res) => {
//   try {
//     const { payrollId } = req.params;
//     const payroll = await Payroll.findById(payrollId).populate('employee');

//     if (!payroll) {
//       return res.status(404).json({ error: "Payroll record not found" });
//     }

//     // Role check: Employee can only download their own payslip
//     if (req.user.role === 'EMPLOYEE' && payroll.employee._id.toString() !== req.user.employeeId) {
//       return res.status(403).json({ error: "Access denied" });
//     }

//     res.setHeader('Content-Type', 'application/pdf');
//     res.setHeader('Content-Disposition', `attachment; filename=payslip-${payroll.month}-${payroll.year}.pdf`);

//     const doc = new PDFDocument();
//     doc.pipe(res);

//     doc.fontSize(20).text('HCM Lite - Official Payslip', { align: 'center' });
//     doc.moveDown();
//     doc.fontSize(12).text(`Employee: ${payroll.employee.firstName} ${payroll.employee.lastName} (${payroll.employee.employeeCode})`);
//     doc.text(`Department: ${payroll.employee.department} | Designation: ${payroll.employee.designation}`);
//     doc.text(`Pay Period: ${payroll.month}/${payroll.year}`);
//     doc.moveDown();
//     doc.text(`Basic Salary: PKR ${payroll.basicSalary}`);
//     doc.text(`Gross Salary: PKR ${payroll.grossSalary}`);
//     doc.text(`Deductions (Absent/Unpaid/Half-day): PKR ${payroll.deductions}`);
//     doc.text(`Monthly Tax: PKR ${payroll.monthlyTax}`);
//     doc.fontSize(14).text(`Net Salary: PKR ${payroll.netSalary}`, { bold: true });

//     doc.end();
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// // 4. Get Payroll Records
// export const getPayroll = async (req, res) => {
//   try {
//     let query = {};
//     if (req.user.role === 'EMPLOYEE') {
//       query.employee = req.user.employeeId;
//     }
//     const payrolls = await Payroll.find(query).populate('employee', 'firstName lastName employeeCode department');
//     res.json(payrolls);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };