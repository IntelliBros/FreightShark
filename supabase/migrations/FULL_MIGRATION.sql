-- ============================================
-- COMPLETE FREIGHTSHARK DATABASE MIGRATION
-- ============================================
-- Run this entire script in Supabase SQL Editor
-- Go to: https://supabase.com/dashboard/project/ryrjmidulkpekrwclcoa/sql/new

-- Step 1: Create missing tables
-- ============================================

-- Create invoices table if not exists
CREATE TABLE IF NOT EXISTS invoices (
    id VARCHAR(50) PRIMARY KEY,
    shipment_id VARCHAR(50) REFERENCES shipments(id) ON DELETE CASCADE,
    customer_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending',
    due_date DATE NOT NULL,
    paid_date DATE,
    payment_method VARCHAR(50),
    payment_reference VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create warehouse_inventory table
CREATE TABLE IF NOT EXISTS warehouse_inventory (
    id VARCHAR(50) PRIMARY KEY,
    customer_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
    warehouse_location VARCHAR(255) NOT NULL,
    item_description TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    unit VARCHAR(50),
    status VARCHAR(50) DEFAULT 'In Stock',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create email_logs table
CREATE TABLE IF NOT EXISTS email_logs (
    id SERIAL PRIMARY KEY,
    to_email VARCHAR(255) NOT NULL,
    template_id VARCHAR(50) NOT NULL,
    subject TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'Sent',
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id VARCHAR(50),
    details JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Step 2: Create indexes for better performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_quotes_customer_id ON quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_request_id ON quotes(request_id);

CREATE INDEX IF NOT EXISTS idx_shipments_customer_id ON shipments(customer_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_quote_id ON shipments(quote_id);

CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_shipment_id ON invoices(shipment_id);

CREATE INDEX IF NOT EXISTS idx_tracking_shipment_id ON tracking_events(shipment_id);
CREATE INDEX IF NOT EXISTS idx_tracking_date ON tracking_events(date);

CREATE INDEX IF NOT EXISTS idx_documents_shipment_id ON documents(shipment_id);

CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

CREATE INDEX IF NOT EXISTS idx_samples_customer_id ON samples(customer_id);
CREATE INDEX IF NOT EXISTS idx_samples_status ON samples(status);

CREATE INDEX IF NOT EXISTS idx_consolidation_customer_id ON consolidation_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_consolidation_status ON consolidation_requests(status);

-- Step 3: Create ID sequences table and function
-- ============================================

-- Create sequences table if not exists
CREATE TABLE IF NOT EXISTS id_sequences (
    entity VARCHAR(50) PRIMARY KEY,
    current_value BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Initialize sequences
INSERT INTO id_sequences (entity, current_value)
VALUES
    ('quote', 0),
    ('shipment', 0),
    ('invoice', 0),
    ('sample', 0),
    ('user', 100),
    ('document', 0)
ON CONFLICT (entity) DO NOTHING;

-- Create function to get next ID
CREATE OR REPLACE FUNCTION get_next_id(entity_type TEXT, prefix TEXT)
RETURNS TEXT AS $$
DECLARE
    next_val BIGINT;
BEGIN
    -- Get and increment the sequence
    UPDATE id_sequences
    SET current_value = current_value + 1,
        updated_at = NOW()
    WHERE entity = entity_type
    RETURNING current_value INTO next_val;

    -- If no row was updated, insert a new one
    IF next_val IS NULL THEN
        INSERT INTO id_sequences (entity, current_value)
        VALUES (entity_type, 1)
        ON CONFLICT (entity) DO UPDATE
        SET current_value = id_sequences.current_value + 1
        RETURNING current_value INTO next_val;
    END IF;

    -- Return formatted ID with prefix
    RETURN prefix || '-' || LPAD(next_val::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create update_updated_at trigger function
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Add triggers for updated_at columns
-- ============================================

-- Drop existing triggers to avoid conflicts
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_quote_requests_updated_at ON quote_requests;
DROP TRIGGER IF EXISTS update_quotes_updated_at ON quotes;
DROP TRIGGER IF EXISTS update_shipments_updated_at ON shipments;
DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
DROP TRIGGER IF EXISTS update_tracking_events_updated_at ON tracking_events;
DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
DROP TRIGGER IF EXISTS update_samples_updated_at ON samples;
DROP TRIGGER IF EXISTS update_consolidation_requests_updated_at ON consolidation_requests;

-- Create triggers for tables with updated_at column
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quote_requests_updated_at BEFORE UPDATE ON quote_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON quotes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shipments_updated_at BEFORE UPDATE ON shipments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_samples_updated_at BEFORE UPDATE ON samples
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consolidation_requests_updated_at BEFORE UPDATE ON consolidation_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 6: Disable Row Level Security (for development)
-- ============================================
-- Note: Re-enable and configure RLS for production!

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE quote_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE quotes DISABLE ROW LEVEL SECURITY;
ALTER TABLE shipments DISABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE announcements DISABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE samples DISABLE ROW LEVEL SECURITY;
ALTER TABLE consolidation_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE sample_photos DISABLE ROW LEVEL SECURITY;
ALTER TABLE sample_shipment_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE carton_configurations DISABLE ROW LEVEL SECURITY;
ALTER TABLE id_sequences DISABLE ROW LEVEL SECURITY;

-- Step 7: Grant permissions (for authenticated users)
-- ============================================

GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Step 8: Insert sample/demo data (optional)
-- ============================================

-- Insert demo users if they don't exist
INSERT INTO users (id, name, email, password_hash, company, role, amazon_seller_id, ein_tax_id, staff_position)
VALUES
    ('admin-demo-user', 'John Admin', 'admin@freightshark.com', '$2a$10$ZKxPquztLVlP5U5rLVJzL.x0bTqXkhQs/YzVtJhQg9nZxNqOo3oGa', 'FreightShark', 'admin', NULL, NULL, NULL),
    ('customer-demo-user', 'Demo Customer', 'customer@example.com', '$2a$10$ZKxPquztLVlP5U5rLVJzL.x0bTqXkhQs/YzVtJhQg9nZxNqOo3oGa', 'Acme Imports', 'user', 'A1B2C3D4E5', '12-3456789', NULL),
    ('staff-demo-user', 'Sarah Chen', 'staff@freightshark.com', '$2a$10$ZKxPquztLVlP5U5rLVJzL.x0bTqXkhQs/YzVtJhQg9nZxNqOo3oGa', 'FreightShark', 'staff', NULL, NULL, 'Shipping Agent')
ON CONFLICT (id) DO NOTHING;

-- Step 9: Verify migration
-- ============================================

-- Check all tables exist
SELECT
    table_name,
    CASE
        WHEN table_name IN (
            'users', 'sessions', 'quote_requests', 'quotes', 'shipments',
            'tracking_events', 'documents', 'invoices', 'messages',
            'notifications', 'samples', 'consolidation_requests'
        ) THEN '✅ Core Table'
        ELSE '📦 Support Table'
    END as table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY
    CASE
        WHEN table_name IN ('users', 'sessions', 'quote_requests', 'quotes', 'shipments') THEN 1
        ELSE 2
    END,
    table_name;

-- Count records in main tables
SELECT
    'Users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'Quote Requests', COUNT(*) FROM quote_requests
UNION ALL
SELECT 'Quotes', COUNT(*) FROM quotes
UNION ALL
SELECT 'Shipments', COUNT(*) FROM shipments
UNION ALL
SELECT 'Invoices', COUNT(*) FROM invoices
UNION ALL
SELECT 'Notifications', COUNT(*) FROM notifications
UNION ALL
SELECT 'Samples', COUNT(*) FROM samples
ORDER BY table_name;

-- Test the ID generation function
SELECT
    get_next_id('quote', 'Q') as sample_quote_id,
    get_next_id('shipment', 'FS') as sample_shipment_id,
    get_next_id('invoice', 'INV') as sample_invoice_id;

-- ============================================
-- Migration Complete!
-- ============================================
--
-- Next steps:
-- 1. Update src/config/database.ts and set USE_SUPABASE: true
-- 2. Restart your development server
-- 3. The app will now use Supabase for all data storage
--
-- To verify everything is working:
-- - Create a new quote request
-- - Check that it appears in the Supabase dashboard
-- - Refresh the page and verify data persists
-- ============================================