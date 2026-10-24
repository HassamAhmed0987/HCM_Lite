import bcrypt from 'bcryptjs';
import User from '../models/user.js';

export const initAdmin = async () => {
  try {
    const adminCount = await User.countDocuments({ role: 'ADMIN' });
    if (adminCount === 0) {
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || "Admin123!", 10);
      await User.create({
        email: process.env.ADMIN_EMAIL || "admin@company.com",
        password: hashedPassword,
        role: 'ADMIN',
        mustChangePassword: false
      });
      console.log("🚀 First-run: Initial Admin Account Created!");
    }
  } catch (error) {
    console.error("Error creating initial admin:", error);
  }
};