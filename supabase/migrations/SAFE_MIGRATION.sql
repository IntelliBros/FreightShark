-- ============================================
-- SAFE FREIGHTSHARK DATABASE MIGRATION
-- ============================================
-- This version checks for existing objects before creating them
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/ryrjmidulkpekrwclcoa/sql/new

-- Step 1: Create missing tables (with checks)
-- ============================================

-- Create invoices table if not exists
CREATE TABLE IF NOT EXISTS invoices (
    id VARCHAR(50) PRIMARY KEY,
    shipment_id VARCHAR(50),
    customer_id VARCHAR(50),
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

-- Add foreign keys if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                   WHERE constraint_name = 'invoices_shipment_id_fkey') THEN
        ALTER TABLE invoices ADD CONSTRAINT invoices_shipment_id_fkey
        FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                   WHERE constraint_name = 'invoices_customer_id_fkey') THEN
        ALTER TABLE invoices ADD CONSTRAINT invoices_customer_id_fkey
        FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create other support tables
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

-- Step 2: Create indexes (only if they don't exist)
-- ============================================

-- Helper function to create index if not exists
CREATE OR REPLACE FUNCTION create_index_if_not_exists(
    index_name text,
    table_name text,
    column_name text
) RETURNS void AS $$
DECLARE
    index_exists boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE indexname = index_name
    ) INTO index_exists;

    IF NOT index_exists THEN
        EXECUTE format('CREATE INDEX %I ON %I(%I)', index_name, table_name, column_name);
        RAISE NOTICE 'Created index: %', index_name;
    ELSE
        RAISE NOTICE 'Index already exists: %', index_name;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for core tables
SELECT create_index_if_not_exists('idx_quotes_customer_id', 'quotes', 'customer_id');
SELECT create_index_if_not_exists('idx_quotes_status', 'quotes', 'status');
SELECT create_index_if_not_exists('idx_shipments_customer_id', 'shipments', 'customer_id');
SELECT create_index_if_not_exists('idx_shipments_status', 'shipments', 'status');
SELECT create_index_if_not_exists('idx_invoices_customer_id', 'invoices', 'customer_id');
SELECT create_index_if_not_exists('idx_invoices_status', 'invoices', 'status');

-- Create indexes for messages table (check for correct columns)
DO $$
BEGIN
    -- Check if messages table exists and has expected columns
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') THEN
        -- Create index on sender_id if column exists
        IF EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'messages' AND column_name = 'sender_id') THEN
            PERFORM create_index_if_not_exists('idx_messages_sender_id', 'messages', 'sender_id');
        END IF;

        -- Create index on shipment_id if column exists
        IF EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'messages' AND column_name = 'shipment_id') THEN
            PERFORM create_index_if_not_exists('idx_messages_shipment_id', 'messages', 'shipment_id');
        END IF;

        -- Create index on created_at if column exists
        IF EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'messages' AND column_name = 'created_at') THEN
            PERFORM create_index_if_not_exists('idx_messages_created_at', 'messages', 'created_at');
        END IF;
    END IF;

    -- Similar checks for notifications
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'notifications' AND column_name = 'user_id') THEN
            PERFORM create_index_if_not_exists('idx_notifications_user_id', 'notifications', 'user_id');
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'notifications' AND column_name = 'read') THEN
            PERFORM create_index_if_not_exists('idx_notifications_read', 'notifications', 'read');
        END IF;
    END IF;

    -- Check for samples table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'samples') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'samples' AND column_name = 'customer_id') THEN
            PERFORM create_index_if_not_exists('idx_samples_customer_id', 'samples', 'customer_id');
        END IF;
    END IF;
END $$;

-- Step 3: Create ID sequences table and function
-- ============================================

CREATE TABLE IF NOT EXISTS id_sequences (
    entity VARCHAR(50) PRIMARY KEY,
    current_value BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Initialize sequences (only if not exists)
INSERT INTO id_sequences (entity, current_value)
VALUES
    ('quote', 0),
    ('shipment', 0),
    ('invoice', 0),
    ('sample', 0),
    ('user', 100),
    ('document', 0)
ON CONFLICT (entity) DO NOTHING;

-- Create or replace ID generation function
CREATE OR REPLACE FUNCTION get_next_id(entity_type TEXT, prefix TEXT)
RETURNS TEXT AS $$
DECLARE
    next_val BIGINT;
BEGIN
    UPDATE id_sequences
    SET current_value = current_value + 1,
        updated_at = NOW()
    WHERE entity = entity_type
    RETURNING current_value INTO next_val;

    IF next_val IS NULL THEN
        INSERT INTO id_sequences (entity, current_value)
        VALUES (entity_type, 1)
        ON CONFLICT (entity) DO UPDATE
        SET current_value = id_sequences.current_value + 1
        RETURNING current_value INTO next_val;
    END IF;

    RETURN prefix || '-' || LPAD(next_val::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create update trigger function
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Add update triggers (with checks)
-- ============================================

-- Helper function to create trigger if not exists
CREATE OR REPLACE FUNCTION create_update_trigger_if_not_exists(
    table_name text
) RETURNS void AS $$
DECLARE
    trigger_name text;
BEGIN
    trigger_name := 'update_' || table_name || '_updated_at';

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = trigger_name
    ) THEN
        EXECUTE format('
            CREATE TRIGGER %I
            BEFORE UPDATE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column()',
            trigger_name, table_name
        );
        RAISE NOTICE 'Created trigger: %', trigger_name;
    ELSE
        RAISE NOTICE 'Trigger already exists: %', trigger_name;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for tables with updated_at column
DO $$
DECLARE
    tbl record;
BEGIN
    FOR tbl IN
        SELECT DISTINCT table_name
        FROM information_schema.columns
        WHERE column_name = 'updated_at'
        AND table_schema = 'public'
        AND table_name NOT LIKE 'pg_%'
    LOOP
        PERFORM create_update_trigger_if_not_exists(tbl.table_name);
    END LOOP;
END $$;

-- Step 6: Disable RLS for development (with checks)
-- ============================================

DO $$
DECLARE
    tbl record;
BEGIN
    FOR tbl IN
        SELECT tablename FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename NOT LIKE 'pg_%'
    LOOP
        EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', tbl.tablename);
        RAISE NOTICE 'Disabled RLS for table: %', tbl.tablename;
    END LOOP;
END $$;

-- Step 7: Grant permissions
-- ============================================

GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Step 8: Insert demo users (only if not exists)
-- ============================================

INSERT INTO users (id, name, email, password_hash, company, role)
VALUES
    ('admin-demo-user', 'John Admin', 'admin@freightshark.com', '$2a$10$ZKxPquztLVlP5U5rLVJzL.x0bTqXkhQs', 'FreightShark', 'admin'),
    ('customer-demo-user', 'Demo Customer', 'customer@example.com', '$2a$10$ZKxPquztLVlP5U5rLVJzL.x0bTqXkhQs', 'Acme Imports', 'user'),
    ('staff-demo-user', 'Sarah Chen', 'staff@freightshark.com', '$2a$10$ZKxPquztLVlP5U5rLVJzL.x0bTqXkhQs', 'FreightShark', 'staff')
ON CONFLICT (id) DO NOTHING;

-- Step 9: Verification queries
-- ============================================

-- Show all tables
SELECT
    tablename as "Table Name",
    CASE
        WHEN tablename IN ('users', 'quotes', 'shipments', 'invoices') THEN '⭐ Core'
        WHEN tablename IN ('messages', 'notifications', 'samples') THEN '💬 Communication'
        ELSE '📦 Support'
    END as "Category"
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY
    CASE
        WHEN tablename IN ('users', 'quotes', 'shipments', 'invoices') THEN 1
        WHEN tablename IN ('messages', 'notifications', 'samples') THEN 2
        ELSE 3
    END,
    tablename;

-- Count records
SELECT
    'Users' as "Table", COUNT(*) as "Records" FROM users
UNION ALL SELECT 'Quotes', COUNT(*) FROM quotes
UNION ALL SELECT 'Shipments', COUNT(*) FROM shipments
UNION ALL SELECT 'Invoices', COUNT(*) FROM invoices
UNION ALL SELECT 'Messages', COUNT(*) FROM messages
UNION ALL SELECT 'Notifications', COUNT(*) FROM notifications
ORDER BY "Table";

-- Test ID generation
SELECT
    get_next_id('quote', 'Q') as "Sample Quote ID",
    get_next_id('shipment', 'FS') as "Sample Shipment ID",
    get_next_id('invoice', 'INV') as "Sample Invoice ID";

-- ============================================
-- ✅ MIGRATION COMPLETE!
-- ============================================
-- Next steps:
-- 1. Edit src/config/database.ts
-- 2. Set USE_SUPABASE: true
-- 3. Restart your dev server
-- 4. Test creating a new quote request
-- ============================================