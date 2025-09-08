const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Check if database file exists and list all tables
db.serialize(() => {
  console.log('Checking SQLite database at:', dbPath);
  
  // List all tables in the database
  db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    if (err) {
      console.error('Error accessing database:', err);
      return;
    }
    
    console.log('Tables found:', tables.map(t => t.name));
    
    // If no tables found, the database might be empty
    if (tables.length === 0) {
      console.log('No tables found. The database might be empty or not initialized.');
    }
  });
  
  // Close the database connection
  db.close();
});