-- Ensure staff-demo-user exists in the database
-- This is needed for quote creation to work properly

-- Insert the staff demo user if it doesn't exist
INSERT INTO users (
    id,
    email,
    name,
    role,
    company,
    password_hash,
    created_at,
    updated_at
) VALUES (
    'staff-demo-user',
    'staff@freightshark.com',
    'Staff User',
    'staff',
    'FreightShark',
    '$2a$10$GPQJLgZ.M2lUSiFn41gQjeMJBZgJYH1CQ1hJz0S1tlJa3qOY3s0TW', -- password123
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (id) DO UPDATE SET
    role = 'staff',
    updated_at = CURRENT_TIMESTAMP;

-- Also ensure the email constraint is handled
-- If there's already a user with this email but different ID, update that user's ID
DO $$
BEGIN
    -- Check if there's a user with the email but different ID
    IF EXISTS (
        SELECT 1 FROM users
        WHERE email = 'staff@freightshark.com'
        AND id != 'staff-demo-user'
    ) THEN
        -- Update that user's ID to staff-demo-user
        UPDATE users
        SET id = 'staff-demo-user'
        WHERE email = 'staff@freightshark.com';
    END IF;
END $$;

-- Verify the user exists
SELECT id, email, name, role FROM users WHERE id = 'staff-demo-user';