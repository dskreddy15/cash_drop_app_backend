import pool from '../config/database.js';

export const AdminSettings = {
  // Get all settings as an object
  getAll: async () => {
    const [rows] = await pool.execute(`
      SELECT setting_key, setting_value 
      FROM admin_settings
    `);
    
    // Convert key-value pairs to object
    const settings = {
      shifts: [],
      workstations: [],
      starting_amount: 200.00,
      max_cash_drops_per_day: 10
    };
    
    rows.forEach(row => {
      const key = row.setting_key;
      const value = row.setting_value;
      
      try {
        // Try to parse JSON values
        const parsedValue = JSON.parse(value);
        settings[key] = parsedValue;
      } catch (e) {
        // If not JSON, use as string or number
        if (key === 'starting_amount' || key === 'max_cash_drops_per_day') {
          settings[key] = parseFloat(value) || (key === 'max_cash_drops_per_day' ? 10 : 200.00);
        } else {
          settings[key] = value;
        }
      }
    });
    
    return settings;
  },

  // Update settings
  update: async (settings) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      // Update or insert each setting
      for (const [key, value] of Object.entries(settings)) {
        const jsonValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
        
        await connection.execute(`
          INSERT INTO admin_settings (setting_key, setting_value)
          VALUES (?, ?)
          ON DUPLICATE KEY UPDATE
            setting_value = VALUES(setting_value),
            updated_at = CURRENT_TIMESTAMP
        `, [key, jsonValue]);
      }
      
      await connection.commit();
      return AdminSettings.getAll();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // Get a specific setting
  get: async (key) => {
    const [rows] = await pool.execute(`
      SELECT setting_value 
      FROM admin_settings 
      WHERE setting_key = ?
    `, [key]);
    
    if (rows.length === 0) {
      return null;
    }
    
    const value = rows[0].setting_value;
    try {
      return JSON.parse(value);
    } catch (e) {
      return value;
    }
  }
};
