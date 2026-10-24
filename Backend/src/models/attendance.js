import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  checkIn: { type: Date },
  checkOut: { type: Date },
  status: { 
    type: String, 
    enum: ['PRESENT', 'LATE', 'HALF_DAY', 'ABSENT', 'ON_LEAVE', 'MISSING_CHECKOUT'],
    default: 'ABSENT' 
  },
  workingHours: { type: Number, default: 0 },
  source: { type: String, enum: ['WEB', 'CAMERA'], default: 'WEB' }
}, { timestamps: true });

attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

export default mongoose.model('Attendance', attendanceSchema);