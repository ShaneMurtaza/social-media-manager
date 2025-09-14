import pg from 'pg';
const { Pool } = pg;

// Configuration for the PostgreSQL connection pool
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Neon.tech
  },
  connectionTimeoutMillis: 15000, // 15 seconds
  idleTimeoutMillis: 30000, // 30 seconds
  max: 20 // Maximum number of clients in the pool
};

const pool = new Pool(poolConfig);

// Test the connection on startup
(async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Database connected successfully');
    client.release(); // Release the client back to the pool
  } catch (err) {
    console.error('❌ Database connection error:', err);
    // Don't crash the app, but the first query will fail
  }
})();

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