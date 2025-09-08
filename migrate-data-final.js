const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');

// SQLite connection
const dbPath = path.join(__dirname, 'database.sqlite');
const sqliteDb = new sqlite3.Database(dbPath);

// PostgreSQL connection
const pgPool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_dzG0Qitf6reD@ep-hidden-hat-adn3mje2-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require",
  ssl: {
    rejectUnauthorized: false
  }
});

async function migrateTable(tableName) {
  return new Promise((resolve, reject) => {
    console.log(`Migrating ${tableName}...`);
    
    // Get all data from SQLite table
    sqliteDb.all(`SELECT * FROM ${tableName}`, async (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (rows.length === 0) {
        console.log(`No data found in ${tableName}`);
        resolve();
        return;
      }
      
      try {
        // Insert data into PostgreSQL
        for (const row of rows) {
          const columns = Object.keys(row);
          const values = Object.values(row);
          const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
          
          await pgPool.query(
            `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`,
            values
          );
        }
        
        console.log(`✅ ${rows.length} records migrated to ${tableName}`);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });
}

async function migrateData() {
  try {
    console.log('Starting data migration from SQLite to PostgreSQL...');
    
    // Migrate each table
    await migrateTable('users');
    await migrateTable('social_accounts');
    await migrateTable('scheduled_posts');
    
    console.log('✅ Data migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    // Close connections
    sqliteDb.close();
    await pgPool.end();
    console.log('Database connections closed');
  }
}

migrateData();