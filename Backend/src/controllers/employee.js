import Employee from '../models/employee.js';
import User from '../models/user.js';
import CompanySetting from '../models/companySetting.js';
import bcrypt from 'bcryptjs';

// Register Employee (Creates Login with Temp Password)
export const registerEmployee = async (req, res) => {
  try {
    // 'role' ko bhi req.body se destructure kar lein (default 'EMPLOYEE' hoga)
    const { employeeCode, firstName, lastName, email, phone, address, department, designation, joiningDate, basicSalary, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "Email already registered" });

    const existingEmp = await Employee.findOne({ employeeCode });
    if (existingEmp) return res.status(400).json({ error: "Employee code already exists" });

    const tempPassword = `Temp@${email}`;
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Yahan role set hoga (agar request mein 'HR' diya gaya toh wohi save hoga)
    const user = await User.create({
      email,
      password: hashedPassword,
      role: role && ['HR', 'EMPLOYEE'].includes(role) ? role : 'EMPLOYEE',
      mustChangePassword: true
    });

    const employee = await Employee.create({
      user: user._id,
      employeeCode,
      firstName,
      lastName,
      phone,
      address,
      department,
      designation,
      joiningDate,
      basicSalary
    });

    user.employeeProfile = employee._id;
    await user.save();

    res.status(201).json({
      message: "Employee/HR registered successfully",
      employee,
      tempPassword
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Employees Directory with Search, Filter & Paging (Respects Data Scope)
export const getEmployees = async (req, res) => {
  try {
    const { search, department, page = 1, limit = 10 } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { employeeCode: { $regex: search, $options: 'i' } }
      ];
    }
    if (department) {
      query.department = department;
    }

    // Role-based data scope: Employee can only view themselves
    if (req.user.role === 'EMPLOYEE') {
      query._id = req.user.employeeId;
    }

    const employees = await Employee.find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Employee.countDocuments(query);

    res.json({
      employees,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// CSV Import Dry-Run (Brief Requirement)
export const csvDryRun = async (req, res) => {
  try {
    const { rows } = req.body; // Array of employee objects from parsed CSV
    if (!rows || !Array.isArray(rows)) {
      return res.status(400).json({ error: "Invalid rows data provided for dry-run" });
    }

    const settings = await CompanySetting.findOne();
    const validDepartments = settings ? settings.departments : [];
    let report = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      let errors = [];

      if (!row.employeeCode) errors.push({ field: 'employeeCode', reason: 'Required field missing' });
      if (!row.email || !row.email.includes('@')) errors.push({ field: 'email', reason: 'Valid email required' });
      if (!row.firstName) errors.push({ field: 'firstName', reason: 'Required field missing' });
      if (!row.department || (validDepartments.length > 0 && !validDepartments.includes(row.department))) {
        errors.push({ field: 'department', reason: 'Unknown or missing department' });
      }
      if (!row.basicSalary || Number(row.basicSalary) <= 0) errors.push({ field: 'basicSalary', reason: 'Must be greater than 0' });

      // Check database duplicates
      if (row.email && await User.findOne({ email: row.email })) {
        errors.push({ field: 'email', reason: 'Email already exists in database' });
      }
      if (row.employeeCode && await Employee.findOne({ employeeCode: row.employeeCode })) {
        errors.push({ field: 'employeeCode', reason: 'Employee code already exists in database' });
      }

      report.push({
        rowNumber: i + 1,
        data: row,
        isValid: errors.length === 0,
        errors
      });
    }

    res.json({ dryRunReport: report });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};