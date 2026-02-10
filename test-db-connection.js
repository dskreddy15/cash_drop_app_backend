/**
 * Test database connection script
 * Run this to verify your database configuration before deploying
 * Usage: node test-db-connection.js
 */

import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'cash_drop_db',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: false
  } : false
};

async function testConnection() {
  let connection;
  try {
    console.log('Testing database connection...');
    console.log('Host:', dbConfig.host);
    console.log('Port:', dbConfig.port);
    console.log('Database:', dbConfig.database);
    console.log('User:', dbConfig.user);
    
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connection successful!');
    
    // Test a simple query
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Query test successful:', rows);
    
    // Check if database exists and show tables
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('✅ Tables in database:', tables.length);
    
    connection.end();
    console.log('\n✅ All tests passed! Database is ready.');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Database connection failed!');
    console.error('Error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Check DB_HOST, DB_USER, DB_PASSWORD, DB_NAME in .env');
    console.error('2. Verify database exists');
    console.error('3. Check user permissions');
    console.error('4. Verify MySQL server is running');
    console.error('5. Check firewall/network settings');
    console.error('6. For Hostinger, verify SSL settings if required');
    
    if (connection) {
      connection.end();
    }
    process.exit(1);
  }
}

testConnection();
