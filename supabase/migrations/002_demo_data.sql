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

-- Sample Announcements
INSERT INTO announcements (id, title, content, type, created_by, is_active)
VALUES 
    (
        'ANN-001',
        'Shipping Agent Update',
        'Some Amazon warehouses are experiencing delays due to capacity issues. Please check your shipment status regularly.',
        'warning',
        'staff-1',
        true
    ),
    (
        'ANN-002',
        'Holiday Schedule Notice',
        'Our offices will be closed on December 25th and January 1st. Please plan your shipments accordingly.',
        'info',
        'staff-1',
        true
    ),
    (
        'ANN-003',
        'New Feature: Real-time Tracking',
        'We have enhanced our tracking system with real-time updates. Check your shipment status for live location data.',
        'success',
        'staff-1',
        true
    )
ON CONFLICT (id) DO NOTHING;