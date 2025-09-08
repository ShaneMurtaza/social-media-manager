const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Create tables
db.serialize(() => {
  console.log('Initializing SQLite database...');
  
  // Create users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password_hash TEXT
  )`);
  
  // Create social_accounts table
  db.run(`CREATE TABLE IF NOT EXISTS social_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    platform TEXT,
    account_name TEXT,
    access_token TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);
  
  // Create scheduled_posts table
  db.run(`CREATE TABLE IF NOT EXISTS scheduled_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    content TEXT,
    media_url TEXT,
    scheduled_for DATETIME,
    is_posted BOOLEAN DEFAULT 0,
    posted_at DATETIME,
    platforms TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);
  
  console.log('Tables created successfully');
  
  // Close the database connection
  db.close();
});