import mongoose from 'mongoose';

const payrollSchema = new mongoose.Schema({
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    month: { type: Number, required: true }, // e.g., 10 (October)
    year: { type: Number, required: true },  // e.g., 2026
    basicSalary: { type: Number, required: true },
    grossSalary: { type: Number, required: true },
    workingDays: { type: Number, required: true },
    absentDays: { type: Number, default: 0 },
    halfDays: { type: Number, default: 0 },
    unpaidLeaveDays: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    monthlyTax: { type: Number, default: 0 },
    netSalary: { type: Number, required: true },
    status: { type: String, enum: ['DRAFT', 'FINALIZED'], default: 'DRAFT' }
}, { timestamps: true });

payrollSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });

export default mongoose.model('Payroll', payrollSchema);