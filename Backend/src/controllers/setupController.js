import CompanySetting from '../models/companySetting.js';

// Get Company Settings
export const getSettings = async (req, res) => {
  try {
    let settings = await CompanySetting.findOne();
    if (!settings) {
      settings = await CompanySetting.create({ 
        companyName: "Default Company",
        departments: ["Engineering", "HR", "Sales", "Management"],
        designations: ["Software Engineer", "HR Manager", "Sales Executive", "Director"]
      });
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Company Settings (Admin Only)
export const updateSettings = async (req, res) => {
  try {
    let settings = await CompanySetting.findOne();
    if (!settings) {
      settings = new CompanySetting(req.body);
    } else {
      Object.assign(settings, req.body);
    }
    await settings.save();
    res.json({ message: "Company settings updated successfully", settings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};