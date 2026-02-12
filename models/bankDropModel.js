import pool from '../config/database.js';

/**
 * Bank drop model: bank_drop_batches (one row per batch) and bank_drops (one row per cash drop in a batch).
 */

export const BankDrop = {
  /**
   * Record a batch in bank_drop_batches (batch_number, drop_count, created_at).
   */
  recordBatch: async (batchNumber, dropCount) => {
    await pool.query(
      'INSERT INTO bank_drop_batches (batch_number, drop_count) VALUES (?, ?)',
      [batchNumber, dropCount]
    );
  },

  /**
   * Record one or more cash drops in bank_drops.
   * @param {string} batchNumber
   * @param {Array<{id: number, drop_amount: number}>} dropsWithAmount
   * @param {number} batchDropAmount - total amount for the batch
   */
  recordDrops: async (batchNumber, dropsWithAmount, batchDropAmount) => {
    for (const d of dropsWithAmount) {
      await pool.query(
        `INSERT INTO bank_drops (batch_number, cash_drop_id, cash_drop_amount, batch_drop_amount)
         VALUES (?, ?, ?, ?)`,
        [batchNumber, d.id, d.drop_amount, batchDropAmount]
      );
    }
  },

  /**
   * Find all batches (for future listing/reports).
   */
  findAllBatches: async () => {
    const [rows] = await pool.query(
      'SELECT * FROM bank_drop_batches ORDER BY created_at DESC'
    );
    return rows;
  },

  /**
   * Find all batches with batch total amount (for History list).
   */
  findAllBatchesWithAmount: async () => {
    const [rows] = await pool.query(`
      SELECT b.id, b.batch_number, b.drop_count, b.created_at,
             (SELECT bd.batch_drop_amount FROM bank_drops bd WHERE bd.batch_number = b.batch_number LIMIT 1) AS batch_drop_amount
      FROM bank_drop_batches b
      ORDER BY b.created_at DESC
    `);
    return rows;
  },

  /**
   * Find all bank_drops rows for a batch (for future detail view).
   */
  findByBatchNumber: async (batchNumber) => {
    const [rows] = await pool.query(
      'SELECT * FROM bank_drops WHERE batch_number = ? ORDER BY cash_drop_id',
      [batchNumber]
    );
    return rows;
  }
};
