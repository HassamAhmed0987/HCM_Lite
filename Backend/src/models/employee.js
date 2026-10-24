import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  employeeCode: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: { type: String },
  address: { type: String },
  department: { type: String, required: true },
  designation: { type: String, required: true },
  joiningDate: { type: Date, required: true },
  basicSalary: { type: Number, required: true },
  status: { type: String, enum: ['ACTIVE', 'PROBATION', 'EXITED'], default: 'ACTIVE' }
}, { timestamps: true });

export default mongoose.model('Employee', employeeSchema);