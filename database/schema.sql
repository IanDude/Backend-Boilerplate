-- ============================================
-- DATABASE SCHEMA
-- ============================================
-- Run this script in your MySQL client to create
-- the database and table.
--
-- Usage:
-- mysql -u root -p < database/schema.sql
-- ============================================

-- Create the database (if it doesn't exist)
CREATE DATABASE IF NOT EXISTS devDB;

-- Switch to the database
USE devDB;

-- Create the users table
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    salt VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    avatar_path VARCHAR(255),
    gallery_path LONGTEXT(65535),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Add a unique constraint on email
    UNIQUE KEY unique_email (email)
);

-- Insert some sample data (optional)
INSERT INTO users (name, email, status) VALUES
    ('John Doe', 'john@example.com', 'active'),
    ('Jane Smith', 'jane@example.com', 'active'),
    ('Bob Wilson', 'bob@example.com', 'pending');

-- Verify the table was created
SELECT 'Table created successfully!' AS message;
SELECT * FROM users;
