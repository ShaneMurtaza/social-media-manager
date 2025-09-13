import { query } from '../db.js';
import dotenv from 'dotenv';

dotenv.config();

const migrations = [
  // Roles table
  `CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    permissions JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // User roles junction table
  `CREATE TABLE IF NOT EXISTS user_roles (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    assigned_by INTEGER REFERENCES users(id),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id)
  )`,

  // Admin audit log table
  `CREATE TABLE IF NOT EXISTS admin_audit_log (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    target_user_id INTEGER REFERENCES users(id),
    details TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // Insert default roles
  `INSERT INTO roles (name, permissions) VALUES 
  ('super_admin', '{"users": ["create", "read", "update", "delete", "assign_roles"], "posts": ["create", "read", "update", "delete", "approve"], "settings": ["read", "update"]}'),
  ('admin', '{"users": ["read", "update"], "posts": ["create", "read", "update", "delete", "approve"], "settings": ["read"]}'),
  ('moderator', '{"users": ["read"], "posts": ["read", "update", "approve"]}'),
  ('user', '{"posts": ["create", "read", "update", "delete"]}')
  ON CONFLICT (name) DO NOTHING`,

  // Add role_id to users table
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS primary_role_id INTEGER REFERENCES roles(id)`
];

async function runMigrations() {
  try {
    console.log('Starting database migrations...');
    
    for (const migration of migrations) {
      console.log('Running migration:', migration.substring(0, 50) + '...');
      await query(migration);
    }
    
    console.log('All migrations completed successfully');
    
    // Initialize admin role if ADMIN_USER_ID is set
    const adminUserId = process.env.ADMIN_USER_ID;
    if (adminUserId) {
      console.log('Assigning super_admin role to user ID:', adminUserId);
      await query(
        'INSERT INTO user_roles (user_id, role_id, assigned_by) VALUES ($1, 1, $1) ON CONFLICT DO NOTHING',
        [adminUserId]
      );
    } else {
      console.log('ADMIN_USER_ID not set, skipping admin role assignment');
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();