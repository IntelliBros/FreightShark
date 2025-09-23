-- Add display_id column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS display_id INTEGER UNIQUE;

-- Create a sequence for generating display IDs
CREATE SEQUENCE IF NOT EXISTS users_display_id_seq START WITH 1;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_display_id ON users(display_id);

-- Update existing users with display IDs
DO $$
DECLARE
    user_record RECORD;
    current_display_id INTEGER := 1;
BEGIN
    -- First, assign display_id to users with numerical IDs in order
    FOR user_record IN
        SELECT id FROM users
        WHERE id ~ '^\d+$'  -- Only numerical IDs
        ORDER BY CAST(id AS INTEGER)
    LOOP
        UPDATE users
        SET display_id = current_display_id
        WHERE id = user_record.id
        AND display_id IS NULL;

        current_display_id := current_display_id + 1;
    END LOOP;

    -- Then, assign display_id to users with non-numerical IDs
    FOR user_record IN
        SELECT id FROM users
        WHERE NOT (id ~ '^\d+$')  -- Non-numerical IDs (UUIDs)
        ORDER BY created_at, id
    LOOP
        UPDATE users
        SET display_id = current_display_id
        WHERE id = user_record.id
        AND display_id IS NULL;

        current_display_id := current_display_id + 1;
    END LOOP;

    -- Update the sequence to continue from the last assigned ID
    PERFORM setval('users_display_id_seq', current_display_id);
END $$;

-- Make display_id NOT NULL after populating existing rows
ALTER TABLE users
ALTER COLUMN display_id SET NOT NULL;

-- Add a trigger to automatically assign display_id to new users
CREATE OR REPLACE FUNCTION assign_display_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.display_id IS NULL THEN
        NEW.display_id := nextval('users_display_id_seq');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new user inserts
DROP TRIGGER IF EXISTS set_display_id_on_insert ON users;
CREATE TRIGGER set_display_id_on_insert
    BEFORE INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION assign_display_id();

-- Add comment for documentation
COMMENT ON COLUMN users.display_id IS 'Simple numerical ID for display purposes, auto-incremented starting from 1';