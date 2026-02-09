import pool from '../config/database.js';
import { getPSTDateTime } from '../utils/dateUtils.js';

export const CashDrop = {
  create: async (data) => {
    const [result] = await pool.execute(`
      INSERT INTO cash_drops (
        user_id, drawer_entry_id, workstation, shift_number, date,
        drop_amount, hundreds, fifties, twenties, tens, fives, twos, ones,
        half_dollars, quarters, dimes, nickels, pennies,
        quarter_rolls, dime_rolls, nickel_rolls, penny_rolls,
        ws_label_amount, variance, label_image, notes, submitted_at, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      data.user_id,
      data.drawer_entry_id || null,
      data.workstation,
      data.shift_number,
      data.date,
      data.drop_amount,
      data.hundreds || 0,
      data.fifties || 0,
      data.twenties || 0,
      data.tens || 0,
      data.fives || 0,
      data.twos || 0,
      data.ones || 0,
      data.half_dollars || 0,
      data.quarters || 0,
      data.dimes || 0,
      data.nickels || 0,
      data.pennies || 0,
      data.quarter_rolls || 0,
      data.dime_rolls || 0,
      data.nickel_rolls || 0,
      data.penny_rolls || 0,
      data.ws_label_amount || 0,
      data.variance || 0,
      data.label_image || null,
      data.notes || null,
      data.submitted_at || getPSTDateTime(),
      data.status || 'submitted'
    ]);
    
    return CashDrop.findById(result.insertId);
  },

  findById: async (id) => {
    const [rows] = await pool.execute(`
      SELECT cd.*, u.name as user_name
      FROM cash_drops cd
      JOIN users u ON cd.user_id = u.id
      WHERE cd.id = ?
    `, [id]);
    
    if (rows[0]) {
      return {
        ...rows[0],
        ignored: rows[0].ignored === 1,
        bank_dropped: rows[0].bank_dropped === 1,
        status: rows[0].status || (rows[0].ignored === 1 ? 'ignored' : 'submitted')
      };
    }
    return null;
  },

  findByDateRange: async (dateFrom, dateTo, userId = null) => {
    let query = `
      SELECT cd.*, u.name as user_name, cd.submitted_at
      FROM cash_drops cd
      JOIN users u ON cd.user_id = u.id
      WHERE cd.date >= ? AND cd.date <= ?
    `;
    
    const params = [dateFrom, dateTo];
    
    if (userId) {
      query += ' AND cd.user_id = ?';
      params.push(userId);
    }
    
    query += ' ORDER BY cd.date DESC';
    
    const [rows] = await pool.execute(query, params);
    return rows.map(row => ({
      ...row,
      ignored: row.ignored === 1,
      bank_dropped: row.bank_dropped === 1,
      status: row.status || (row.ignored === 1 ? 'ignored' : 'submitted')
    }));
  },

  update: async (id, data) => {
    const fields = [];
    const values = [];
    
    // Update denominations
    const denominationFields = ['hundreds', 'fifties', 'twenties', 'tens', 'fives', 'twos', 'ones', 
                                'half_dollars', 'quarters', 'dimes', 'nickels', 'pennies',
                                'quarter_rolls', 'dime_rolls', 'nickel_rolls', 'penny_rolls'];
    
    denominationFields.forEach(field => {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(data[field]);
      }
    });
    
    // Update other fields
    if (data.user_id !== undefined) {
      fields.push('user_id = ?');
      values.push(data.user_id);
    }
    if (data.drop_amount !== undefined) {
      fields.push('drop_amount = ?');
      values.push(data.drop_amount);
    }
    if (data.bank_dropped !== undefined) {
      fields.push('bank_dropped = ?');
      values.push(data.bank_dropped ? 1 : 0);
    }
    if (data.ignored !== undefined) {
      fields.push('ignored = ?');
      values.push(data.ignored ? 1 : 0);
    }
    if (data.ignore_reason !== undefined) {
      fields.push('ignore_reason = ?');
      values.push(data.ignore_reason);
    }
    if (data.status !== undefined) {
      fields.push('status = ?');
      values.push(data.status);
    }
    if (data.drawer_entry_id !== undefined) {
      fields.push('drawer_entry_id = ?');
      values.push(data.drawer_entry_id);
    }
    if (data.ws_label_amount !== undefined) {
      fields.push('ws_label_amount = ?');
      values.push(data.ws_label_amount);
    }
    if (data.variance !== undefined) {
      fields.push('variance = ?');
      values.push(data.variance);
    }
    if (data.label_image !== undefined) {
      fields.push('label_image = ?');
      values.push(data.label_image);
    }
    if (data.notes !== undefined) {
      fields.push('notes = ?');
      values.push(data.notes);
    }
    if (data.submitted_at !== undefined) {
      fields.push('submitted_at = ?');
      values.push(data.submitted_at);
    }
    
    if (fields.length === 0) return null;
    
    values.push(id);
    await pool.execute(`UPDATE cash_drops SET ${fields.join(', ')} WHERE id = ?`, values);
    return CashDrop.findById(id);
  },

  delete: async (id, retries = 3) => {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const [result] = await pool.execute('DELETE FROM cash_drops WHERE id = ?', [id]);
        return result.affectedRows > 0;
      } catch (error) {
        // If it's a deadlock and we have retries left, wait and retry
        if (error.code === 'ER_LOCK_DEADLOCK' && attempt < retries - 1) {
          // Wait a random amount of time (between 50-200ms) before retrying
          const waitTime = Math.floor(Math.random() * 150) + 50;
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        // If it's the last attempt or not a deadlock, throw the error
        throw error;
      }
    }
    return false;
  },

  findByWorkstationShiftDateStatus: async (workstation, shiftNumber, date, status = 'drafted') => {
    const [rows] = await pool.execute(`
      SELECT cd.*, u.name as user_name
      FROM cash_drops cd
      JOIN users u ON cd.user_id = u.id
      WHERE cd.workstation = ? AND cd.shift_number = ? AND cd.date = ? AND cd.status = ?
      ORDER BY cd.created_at DESC
      LIMIT 1
    `, [workstation, shiftNumber, date, status]);
    
    return rows[0] || null;
  },

  countByUserAndDate: async (userId, date) => {
    const [rows] = await pool.execute(`
      SELECT COUNT(*) as count 
      FROM cash_drops 
      WHERE user_id = ? AND date = ? AND ignored = 0
    `, [userId, date]);
    return rows[0].count;
  },

  findByWorkstationShiftDate: async (workstation, shiftNumber, date) => {
    const [rows] = await pool.execute(`
      SELECT cd.*, u.name as user_name
      FROM cash_drops cd
      JOIN users u ON cd.user_id = u.id
      WHERE cd.workstation = ? AND cd.shift_number = ? AND cd.date = ?
      LIMIT 1
    `, [workstation, shiftNumber, date]);
    
    if (rows[0]) {
      return {
        ...rows[0],
        ignored: rows[0].ignored === 1,
        bank_dropped: rows[0].bank_dropped === 1
      };
    }
    return null;
  }
};
