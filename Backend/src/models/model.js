import mongoose from 'mongoose';

const leaveSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  leaveType: { type: String, enum: ['ANNUAL', 'SICK', 'CASUAL', 'UNPAID'], required: true },
  startDate: { type: String, required: true }, // YYYY-MM-DD
  endDate: { type: String, required: true }, // YYYY-MM-DD
  daysCount: { type: Number, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'], default: 'PENDING' },
  approverComment: { type: String }
}, { timestamps: true });

export default mongoose.model('Leave', leaveSchema);