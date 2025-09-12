-- Users table with enhanced security
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    connected_platforms JSONB DEFAULT '{}',
    session_token VARCHAR(255),
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Scheduled posts table
CREATE TABLE IF NOT EXISTS scheduled_posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    content TEXT NOT NULL,
    media_url VARCHAR(500),
    platforms JSONB NOT NULL,
    scheduled_for TIMESTAMP NOT NULL,
    is_posted BOOLEAN DEFAULT FALSE,
    posted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Social platform credentials table (secure storage)
CREATE TABLE IF NOT EXISTS social_credentials (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    platform VARCHAR(50) NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_expiry TIMESTAMP,
    platform_user_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, platform)
);

-- Add these to your existing database_schema.sql file or run them directly

-- Email verification table
CREATE TABLE IF NOT EXISTS email_verifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin approval table
CREATE TABLE IF NOT admin_approvals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending',
    reviewed_by INTEGER REFERENCES users(id),
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add email_verified and admin_approved columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS admin_approved BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_sent_at TIMESTAMP;

-- Create admin user (run this once to create an admin account)
INSERT INTO users (name, email, password, admin_approved, email_verified, created_at) 
VALUES ('Admin User', 'admin@example.com', 'hashed_password_here', TRUE, TRUE, NOW())
ON CONFLICT (email) DO NOTHING;