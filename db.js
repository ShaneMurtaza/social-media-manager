const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 15000, // 15 seconds
  idleTimeoutMillis: 30000, // 30 seconds
  max: 20 // Maximum number of clients in the pool
});

// Enhanced error handling with retry logic
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  // Implement retry logic here if needed
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  connect: (callback) => pool.connect(callback),
  end: () => pool.end()
};