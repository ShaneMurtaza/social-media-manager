const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_dzG0Qitf6reD@ep-hidden-hat-adn3mje2-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require",
  ssl: {
    rejectUnauthorized: false
  }
});

async function verifyMigration() {
  try {
    console.log('Verifying data migration...');
    
    // Check counts for each table
    const tables = ['users', 'social_accounts', 'scheduled_posts'];
    
    for (const table of tables) {
      const result = await pool.query(`SELECT COUNT(*) FROM ${table}`);
      console.log(`✅ ${table}: ${result.rows[0].count} records`);
    }
    
    console.log('✅ Verification completed!');
  } catch (error) {
    console.error('❌ Verification error:', error);
  } finally {
    await pool.end();
  }
}

verifyMigration();