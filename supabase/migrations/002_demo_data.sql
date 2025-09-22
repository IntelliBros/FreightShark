-- Insert Demo Users
-- Password for all users is: Password123!
-- The hash below is for 'Password123!' using bcrypt

-- Admin user
INSERT INTO users (id, name, email, password_hash, company, role, amazon_seller_id, ein_tax_id, staff_position)
VALUES (
    'admin-1',
    'John Admin',
    'admin@freightshark.com',
    '$2a$10$YZP5o3YNlnXQKNgmzHbPxu8JZRHM5MqVKlKvRCzFpYJCCOHGvtLH.',
    'FreightShark',
    'admin',
    NULL,
    NULL,
    NULL
) ON CONFLICT (email) DO NOTHING;

-- Customer user
INSERT INTO users (id, name, email, password_hash, company, role, amazon_seller_id, ein_tax_id, staff_position)
VALUES (
    'user-1',
    'Demo Customer',
    'customer@example.com',
    '$2a$10$YZP5o3YNlnXQKNgmzHbPxu8JZRHM5MqVKlKvRCzFpYJCCOHGvtLH.',
    'Acme Imports',
    'user',
    'A1B2C3D4E5',
    '12-3456789',
    NULL
) ON CONFLICT (email) DO NOTHING;

-- Staff user
INSERT INTO users (id, name, email, password_hash, company, role, amazon_seller_id, ein_tax_id, staff_position)
VALUES (
    'staff-1',
    'Sarah Chen',
    'staff@freightshark.com',
    '$2a$10$YZP5o3YNlnXQKNgmzHbPxu8JZRHM5MqVKlKvRCzFpYJCCOHGvtLH.',
    'FreightShark',
    'staff',
    NULL,
    NULL,
    'Shipping Agent'
) ON CONFLICT (email) DO NOTHING;

-- Skip creating sample announcements - keeping database clean