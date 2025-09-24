-- Fix user ID type mismatch
-- The users table has an integer ID, but we're using string IDs elsewhere

-- First, alter the users table to have a display_id column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_id TEXT UNIQUE;

-- Create an index on display_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_display_id ON users(display_id);

-- Update carton_configurations to reference users by integer ID
-- First, drop the existing foreign key constraint
ALTER TABLE carton_configurations
DROP CONSTRAINT IF EXISTS carton_configurations_user_id_fkey;

-- Change user_id to integer type to match users table
ALTER TABLE carton_configurations
ALTER COLUMN user_id TYPE INTEGER USING NULL;

-- Re-add the foreign key constraint
ALTER TABLE carton_configurations
ADD CONSTRAINT carton_configurations_user_id_fkey
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Add a display_user_id column for string-based user IDs
ALTER TABLE carton_configurations
ADD COLUMN IF NOT EXISTS display_user_id TEXT;

-- Create an index for display_user_id
CREATE INDEX IF NOT EXISTS idx_carton_configs_display_user_id
ON carton_configurations(display_user_id);