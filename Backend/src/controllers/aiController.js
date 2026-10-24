import Employee from '../models/employee.js';
import Attendance from '../models/attendance.js';
import Leave from '../models/leave.js';
import Payroll from '../models/payroll.js';
import CompanySetup from '../models/companySetting.js';

export const handleAiAssistant = async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    // 1. Gather relevant database context based on who is asking
    let dbContext = "";
    
    if (req.user.role === 'EMPLOYEE') {
      const employee = await Employee.findOne({ user: req.user.userId });
      const leaves = await Leave.find({ employee: employee?._id });
      const payroll = await Payroll.findOne({ employee: employee?._id }).sort({ year: -1, month: -1 });
      
      dbContext = `
        Current User Role: Employee
        Employee Name: ${employee?.firstName} ${employee?.lastName}
        Department: ${employee?.department}
        Designation: ${employee?.designation}
        Leave Records: ${JSON.stringify(leaves)}
        Latest Payroll: ${JSON.stringify(payroll)}
      `;
    } else {
      const totalEmployees = await Employee.countDocuments();
      const pendingLeaves = await Leave.countDocuments({ status: 'PENDING' });
      const setup = await CompanySetup.findOne();

      dbContext = `
        Current User Role: ${req.user.role}
        Total Company Employees: ${totalEmployees}
        Pending Leave Requests: ${pendingLeaves}
        Company Name: ${setup?.companyName || 'N/A'}
      `;
    }

    // 2. Call OpenRouter API
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.AI_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3001", // Optional for OpenRouter rankings
        "X-Title": "HCM Lite AI"                 // Optional
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini", // Aap koi bhi sasta/free model choose kar sakte hain (e.g., 'meta-llama/llama-3-8b-instruct:free')
        messages: [
          {
            role: "system",
            content: `You are an AI HR Assistant for HCM Lite. Use the following database context to answer the user's question accurately, professionally, and concisely. \n\nDatabase Context:\n${dbContext}`
          },
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to fetch response from OpenRouter");
    }

    const aiMessage = data.choices[0].message.content;

    res.json({
      prompt,
      aiResponse: aiMessage
    });

  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ error: error.message });
  }
};