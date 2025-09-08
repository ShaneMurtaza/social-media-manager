const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_dzG0Qitf6reD@ep-hidden-hat-adn3mje2-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require",
  ssl: {
    rejectUnauthorized: false
  }
});

async function initPostgres() {
  try {
    console.log('Initializing PostgreSQL database...');
    
    // Create users table
    await pool.query(`CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE,
      password_hash TEXT
    )`);
    
    // Create social_accounts table
    await pool.query(`CREATE TABLE IF NOT EXISTS social_accounts (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      platform TEXT,
      account_name TEXT,
      access_token TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`);
    
    // Create scheduled_posts table
    await pool.query(`CREATE TABLE IF NOT EXISTS scheduled_posts (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      content TEXT,
      media_url TEXT,
      scheduled_for TIMESTAMP,
      is_posted BOOLEAN DEFAULT FALSE,
      posted_at TIMESTAMP,
      platforms TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`);
    
    console.log('PostgreSQL tables created successfully');
  } catch (error) {
    console.error('Error initializing PostgreSQL:', error);
  } finally {
    await pool.end();
  }
}

initPostgres();