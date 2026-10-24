import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['ADMIN', 'HR', 'EMPLOYEE'], required: true },
  mustChangePassword: { type: Boolean, default: false },
  employeeProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }
}, { timestamps: true });

export default mongoose.model('User', userSchema);