const { Pool } = require('pg');
require('dotenv').config(); // Load environment variables from .env file

// Create a connection pool using your Neon connection string
const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_dzG0Qitf6reD@ep-hidden-hat-adn3mje2-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require",
  ssl: {
    rejectUnauthorized: false // Required for Neon connections
  }
});

// Test the connection
pool.on('connect', () => {
  console.log('✅ Connected to Neon PostgreSQL database successfully!');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err);
});

// Export the pool for use in other files
module.exports = {
  query: (text, params) => pool.query(text, params),
  connect: (callback) => pool.connect(callback),
  end: () => pool.end()
};