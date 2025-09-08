// init_db.js
const sqlite3 = require('sqlite3').verbose();

// Connect to SQLite database
const db = new sqlite3.Database('./database.sqlite');

// Create tables
db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password_hash TEXT
    )`);
    
    // Social accounts table
    db.run(`CREATE TABLE IF NOT EXISTS social_accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        platform TEXT,
        account_name TEXT,
        access_token TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);
    
    // Scheduled posts table
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
    
    console.log('Database tables initialized!');
});

// Close connection
db.close();
