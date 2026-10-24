import mongoose from 'mongoose';

const companySettingSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  officeStart: { type: String, default: "09:00" },
  graceTimeMinutes: { type: Number, default: 15 },
  halfDayHours: { type: Number, default: 5 },
  weekendDays: { type: [Number], default: [0, 6] }, // 0 = Sun, 6 = Sat
  officeLocation: {
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 },
    radiusMeters: { type: Number, default: 150 }
  },
  departments: [{ type: String }],
  designations: [{ type: String }],
  holidays: [{ name: String, date: Date }],
  leaveQuotas: {
    annual: { type: Number, default: 14 },
    sick: { type: Number, default: 8 },
    casual: { type: Number, default: 10 }
  }
}, { timestamps: true });

export default mongoose.model('CompanySetting', companySettingSchema);