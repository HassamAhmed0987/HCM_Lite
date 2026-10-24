import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetDepartment: { type: String, default: 'ALL' }
}, { timestamps: true });

export default mongoose.model('Announcement', announcementSchema);