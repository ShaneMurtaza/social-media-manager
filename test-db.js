// This file tests the connection to your Neon PostgreSQL database
const { query } = require('./db');

async function testConnection() {
  try {
    const result = await query('SELECT NOW() as current_time');
    console.log('✅ Database connection successful!');
    console.log('Current time in database:', result.rows[0].current_time);
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
}

testConnection();