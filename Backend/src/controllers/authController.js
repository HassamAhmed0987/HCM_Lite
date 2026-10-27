import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';

// 1. Login Controller
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user and populate employee profile if linked
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate JWT Token
    const token = jwt.sign(
      { 
        userId: user._id, 
        role: user.role, 
        employeeId: user.employeeProfile ? user.employeeProfile._id : null 
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      message: "Login successful",
      token,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
      employeeId: user.employeeProfile ? user.employeeProfile._id : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. Change Password Controller
export const changePassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await User.findByIdAndUpdate(req.user.userId, {
      password: hashedPassword,
      mustChangePassword: false
    });

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};