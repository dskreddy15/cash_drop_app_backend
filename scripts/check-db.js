#!/usr/bin/env node
/**
 * Quick database check: connection + required columns.
 * Run from backend folder: node scripts/check-db.js
 */
import 'dotenv/config';
import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'dskreddy98',
  database: process.env.DB_NAME || 'cash_drop_db',
};

async function check() {
  console.log('Checking database:', dbConfig.host, dbConfig.database);
  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);
    await conn.ping();
    console.log('Connection: OK');

    const [cols] = await conn.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'cash_drops' AND COLUMN_NAME = 'bank_drop_batch_number'`,
      [dbConfig.database]
    );
    if (cols.length > 0) {
      console.log('Column cash_drops.bank_drop_batch_number: OK');
    } else {
      console.log('Column cash_drops.bank_drop_batch_number: MISSING (run the server once to apply migrations)');
    }
  } catch (err) {
    console.error('Database check failed:', err.message);
    console.error('Ensure MySQL is running and .env has correct DB_HOST, DB_USER, DB_PASSWORD, DB_NAME.');
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
  console.log('Done.');
}
check();
