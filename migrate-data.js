const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');

// SQLite connection
const dbPath = path.join(__dirname, 'database.sqlite');
const sqliteDb = new sqlite3.Database(dbPath);

// PostgreSQL connection (using your Neon connection)
const pgPool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_dzG0Qitf6reD@ep-hidden-hat-adn3mje2-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require",
  ssl: {
    rejectUnauthorized: false
  }
});

// Migrate data function
async function migrateData() {
  try {
    console.log('Starting data migration...');
    
    // Get all data from SQLite
    sqliteDb.all("SELECT * FROM users", async (err, users) => {
      if (err) {
        console.error('Error reading users:', err);
        return;
      }
      
      // Insert users into PostgreSQL
      for (const user of users) {
        await pgPool.query(
          'INSERT INTO users (id, username, password_hash) VALUES ($1, $2, $3)',
          [user.id, user.username, user.password_hash]
        );
      }
      console.log('Users migrated successfully');
    });

    // Repeat for other tables (social_accounts, scheduled_posts)
    sqliteDb.all("SELECT * FROM social_accounts", async (err, accounts) => {
      if (err) {
        console.error('Error reading social accounts:', err);
        return;
      }
      
      for (const account of accounts) {
        await pgPool.query(
          'INSERT INTO social_accounts (id, user_id, platform, account_name, access_token) VALUES ($1, $2, $3, $4, $5)',
          [account.id, account.user_id, account.platform, account.account_name, account.access_token]
        );
      }
      console.log('Social accounts migrated successfully');
    });

    sqliteDb.all("SELECT * FROM scheduled_posts", async (err, posts) => {
      if (err) {
        console.error('Error reading scheduled posts:', err);
        return;
      }
      
      for (const post of posts) {
        await pgPool.query(
          'INSERT INTO scheduled_posts (id, user_id, content, media_url, scheduled_for, is_posted, posted_at, platforms) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
          [post.id, post.user_id, post.content, post.media_url, post.scheduled_for, post.is_posted, post.posted_at, post.platforms]
        );
      }
      console.log('Scheduled posts migrated successfully');
      
      // Close connections
      sqliteDb.close();
      await pgPool.end();
      console.log('Data migration completed!');
    });

  } catch (error) {
    console.error('Migration error:', error);
  }
}

migrateData();