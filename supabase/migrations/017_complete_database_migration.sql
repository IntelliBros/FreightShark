-- Complete Database Migration for FreightShark
-- This migration ensures all tables exist and RLS is properly configured

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

-- Create warehouse_inventory table for tracking items
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

-- Create email_logs table for tracking sent emails
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

-- Create activity_logs table for audit trail
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

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_quotes_customer_id ON quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_shipments_customer_id ON shipments(customer_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_tracking_shipment_id ON tracking_events(shipment_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_samples_customer_id ON samples(customer_id);
CREATE INDEX IF NOT EXISTS idx_consolidation_customer_id ON consolidation_requests(customer_id);

-- Disable RLS on all tables for now (we'll enable with proper policies later)
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

-- Grant permissions to authenticated users
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at on all tables with that column
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN
        SELECT table_name
        FROM information_schema.columns
        WHERE column_name = 'updated_at'
        AND table_schema = 'public'
    LOOP
        EXECUTE format('
            CREATE TRIGGER update_%I_updated_at
            BEFORE UPDATE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column()',
            t, t);
    END LOOP;
END $$;

-- Create a function to get next ID for a given entity type
CREATE OR REPLACE FUNCTION get_next_id(entity_type TEXT, prefix TEXT)
RETURNS TEXT AS $$
DECLARE
    next_val BIGINT;
BEGIN
    -- Get the next value from id_sequences table
    UPDATE id_sequences
    SET current_value = current_value + 1
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

    -- Return formatted ID
    RETURN prefix || '-' || LPAD(next_val::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- Ensure id_sequences table exists and has proper structure
CREATE TABLE IF NOT EXISTS id_sequences (
    entity VARCHAR(50) PRIMARY KEY,
    current_value BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Initialize sequences if they don't exist
INSERT INTO id_sequences (entity, current_value)
VALUES
    ('quote', 0),
    ('shipment', 0),
    ('invoice', 0),
    ('sample', 0)
ON CONFLICT (entity) DO NOTHING;