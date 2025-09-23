-- ============================================
-- WORKING FREIGHTSHARK DATABASE MIGRATION
-- ============================================
-- This handles the existing id_sequences table structure
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/ryrjmidulkpekrwclcoa/sql/new

-- Step 1: Handle id_sequences table
-- ============================================
-- The existing table uses 'type' column, not 'entity'
-- We need to work with the existing structure

-- Add missing sequence types to existing table
INSERT INTO id_sequences (type, current_value)
VALUES
    ('invoice', 0),
    ('sample', 0),
    ('user', 100),
    ('document', 0)
ON CONFLICT (type) DO NOTHING;

-- Step 2: Create missing tables
-- ============================================

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

-- Add foreign keys safely
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
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Foreign key constraints might already exist or tables missing';
END $$;

CREATE TABLE IF NOT EXISTS warehouse_inventory (
    id VARCHAR(50) PRIMARY KEY,
    customer_id VARCHAR(50),
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
    user_id VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id VARCHAR(50),
    details JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Step 3: Create/Update ID generation function to work with existing table
-- ============================================

CREATE OR REPLACE FUNCTION get_next_id(entity_type TEXT, prefix TEXT)
RETURNS TEXT AS $$
DECLARE
    next_val INTEGER;
BEGIN
    -- Update using 'type' column (existing structure)
    UPDATE id_sequences
    SET current_value = current_value + 1
    WHERE type = entity_type
    RETURNING current_value INTO next_val;

    -- If no row was updated, insert a new one
    IF next_val IS NULL THEN
        INSERT INTO id_sequences (type, current_value)
        VALUES (entity_type, 1)
        ON CONFLICT (type) DO UPDATE
        SET current_value = id_sequences.current_value + 1
        RETURNING current_value INTO next_val;
    END IF;

    -- Return formatted ID with prefix
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

-- Step 5: Create indexes safely
-- ============================================

DO $$
BEGIN
    -- Core table indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_quotes_customer_id') THEN
        CREATE INDEX idx_quotes_customer_id ON quotes(customer_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_quotes_status') THEN
        CREATE INDEX idx_quotes_status ON quotes(status);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_shipments_customer_id') THEN
        CREATE INDEX idx_shipments_customer_id ON shipments(customer_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_shipments_status') THEN
        CREATE INDEX idx_shipments_status ON shipments(status);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_invoices_customer_id') THEN
        CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_invoices_status') THEN
        CREATE INDEX idx_invoices_status ON invoices(status);
    END IF;

    -- Messages table indexes (if table exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_messages_sender_id') THEN
            CREATE INDEX idx_messages_sender_id ON messages(sender_id);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_messages_shipment_id') THEN
            CREATE INDEX idx_messages_shipment_id ON messages(shipment_id);
        END IF;
    END IF;

    -- Notifications table indexes (if table exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_notifications_user_id') THEN
            CREATE INDEX idx_notifications_user_id ON notifications(user_id);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_notifications_read') THEN
            CREATE INDEX idx_notifications_read ON notifications(read);
        END IF;
    END IF;

    -- Samples table indexes (if table exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'samples') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_samples_customer_id') THEN
            CREATE INDEX idx_samples_customer_id ON samples(customer_id);
        END IF;
    END IF;
END $$;

-- Step 6: Add update triggers safely
-- ============================================

DO $$
DECLARE
    tbl record;
    trigger_name text;
BEGIN
    FOR tbl IN
        SELECT DISTINCT table_name
        FROM information_schema.columns
        WHERE column_name = 'updated_at'
        AND table_schema = 'public'
        AND table_name NOT LIKE 'pg_%'
    LOOP
        trigger_name := 'update_' || tbl.table_name || '_updated_at';

        -- Check if trigger exists
        IF NOT EXISTS (
            SELECT 1 FROM pg_trigger
            WHERE tgname = trigger_name
        ) THEN
            EXECUTE format('
                CREATE TRIGGER %I
                BEFORE UPDATE ON %I
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column()',
                trigger_name, tbl.table_name
            );
            RAISE NOTICE 'Created trigger: %', trigger_name;
        END IF;
    END LOOP;
END $$;

-- Step 7: Disable RLS for development
-- ============================================

DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN
        SELECT tablename FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename NOT LIKE 'pg_%'
    LOOP
        EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', tbl);
    END LOOP;
    RAISE NOTICE 'Disabled RLS for all tables';
END $$;

-- Step 8: Grant permissions
-- ============================================

GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Step 9: Insert demo users (if not exists)
-- ============================================

INSERT INTO users (id, name, email, password_hash, company, role)
VALUES
    ('admin-demo-user', 'John Admin', 'admin@freightshark.com', '$2a$10$ZKxPquztLVlP5U5rLVJzL.x0bTqXkhQs', 'FreightShark', 'admin'),
    ('customer-demo-user', 'Demo Customer', 'customer@example.com', '$2a$10$ZKxPquztLVlP5U5rLVJzL.x0bTqXkhQs', 'Acme Imports', 'user'),
    ('staff-demo-user', 'Sarah Chen', 'staff@freightshark.com', '$2a$10$ZKxPquztLVlP5U5rLVJzL.x0bTqXkhQs', 'FreightShark', 'staff')
ON CONFLICT (id) DO NOTHING;

-- Step 10: Verification
-- ============================================

-- Check tables
SELECT
    tablename as "Table",
    CASE
        WHEN tablename IN ('users', 'quotes', 'shipments', 'invoices') THEN '⭐ Core'
        WHEN tablename IN ('messages', 'notifications', 'samples') THEN '💬 Feature'
        ELSE '📦 Support'
    END as "Type"
FROM pg_tables
WHERE schemaname = 'public'
AND tablename NOT LIKE 'pg_%'
ORDER BY
    CASE
        WHEN tablename IN ('users', 'quotes', 'shipments', 'invoices') THEN 1
        ELSE 2
    END,
    tablename;

-- Count records
SELECT 'Summary' as "Status",
    (SELECT COUNT(*) FROM users) as "Users",
    (SELECT COUNT(*) FROM quotes) as "Quotes",
    (SELECT COUNT(*) FROM shipments) as "Shipments",
    (SELECT COUNT(*) FROM invoices) as "Invoices";

-- Test ID generation
SELECT
    get_next_id('quote', 'Q') as "Next Quote ID",
    get_next_id('shipment', 'FS') as "Next Shipment ID",
    get_next_id('invoice', 'INV') as "Next Invoice ID";

-- ============================================
-- ✅ MIGRATION COMPLETE!
-- ============================================
-- Next:
-- 1. Set USE_SUPABASE: true in src/config/database.ts
-- 2. Restart dev server
-- 3. Test the application
-- ============================================