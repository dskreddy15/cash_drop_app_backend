import { AdminSettings } from '../models/adminSettingsModel.js';

// Get all admin settings
export const getAdminSettings = async (req, res) => {
  try {
    const settings = await AdminSettings.getAll();
    res.json(settings);
  } catch (error) {
    console.error('Get admin settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update admin settings
export const updateAdminSettings = async (req, res) => {
  try {
    const { shifts, workstations, starting_amount, max_cash_drops_per_day } = req.body;
    
    // Validate input
    if (shifts !== undefined && !Array.isArray(shifts)) {
      return res.status(400).json({ error: 'shifts must be an array' });
    }
    if (workstations !== undefined && !Array.isArray(workstations)) {
      return res.status(400).json({ error: 'workstations must be an array' });
    }
    if (starting_amount !== undefined && (typeof starting_amount !== 'number' || starting_amount < 0)) {
      return res.status(400).json({ error: 'starting_amount must be a positive number' });
    }
    if (max_cash_drops_per_day !== undefined && (typeof max_cash_drops_per_day !== 'number' || max_cash_drops_per_day < 1)) {
      return res.status(400).json({ error: 'max_cash_drops_per_day must be a positive integer' });
    }
    
    // Build settings object with only provided fields
    const settingsToUpdate = {};
    if (shifts !== undefined) settingsToUpdate.shifts = shifts;
    if (workstations !== undefined) settingsToUpdate.workstations = workstations;
    if (starting_amount !== undefined) settingsToUpdate.starting_amount = starting_amount;
    if (max_cash_drops_per_day !== undefined) settingsToUpdate.max_cash_drops_per_day = max_cash_drops_per_day;
    
    // If no fields to update, return current settings
    if (Object.keys(settingsToUpdate).length === 0) {
      const currentSettings = await AdminSettings.getAll();
      return res.json(currentSettings);
    }
    
    // Update settings
    const updatedSettings = await AdminSettings.update(settingsToUpdate);
    res.json(updatedSettings);
  } catch (error) {
    console.error('Update admin settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
