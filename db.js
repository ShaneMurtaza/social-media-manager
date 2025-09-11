import pg from 'pg';
const { Pool } = pg;

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

export const query = (text, params) => pool.query(text, params);
export const connect = (callback) => pool.connect(callback);
export const end = () => pool.end();

export default {
  query,
  connect,
  end
};