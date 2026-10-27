import express from "express";
import cors from "cors"
import AuthRoutes from "./src/routes/authRoutes.js";
import SetupRoutes from "./src/routes/setupRoutes.js";
import employeeRoutes from "./src/routes/employeeRoutes.js";
import AttendanceRoutes from "./src/routes/attendanceRoutes.js";
import cookieParser from "cookie-parser"
import LeaveRoutes from "./src/routes/leaveRoutes.js";
import PayrollRoutes from "./src/routes/payrollRoutes.js";
import AiRoutes from "./src/routes/aiRoutes.js";
import AnnoucementRoutes from "./src/routes/announcementRoutes.js";
import { connectDB } from "./src/config/db.js";

const app = express()

app.use(cookieParser());
app.use(cors({
    origin: 'https://calm-lebkuchen-7e99c8.netlify.app',
    credentials: true
}))
app.use(express.json())
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (error) {
        console.error("Database unavailable for request:", {
            method: req.method,
            path: req.path,
            name: error.name,
            message: error.message,
        });
        res.status(503).json({ error: "Service temporarily unavailable" });
    }
});
app.use('/api/auth', AuthRoutes);
app.use('/api/setup', SetupRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', AttendanceRoutes);
app.use('/api/leave', LeaveRoutes);
app.use('/api/payroll', PayrollRoutes);
app.use('/api/ai', AiRoutes);
app.use("/api/announcement", AnnoucementRoutes)
app.get("/", (req, res) => {
    res.json({
        message: "HCM lite salyani hackathon is started"
    })
})


export default app



