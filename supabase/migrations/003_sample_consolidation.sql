-- Sample Consolidation Tables
-- This migration adds support for sample consolidation feature

-- Create sample_requests table
CREATE TABLE IF NOT EXISTS sample_requests (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    expected_samples INTEGER NOT NULL,
    received_samples INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'partially_received', 'completed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create received_samples table
CREATE TABLE IF NOT EXISTS received_samples (
    id VARCHAR(100) PRIMARY KEY,
    sample_request_id VARCHAR(100) REFERENCES sample_requests(id) ON DELETE CASCADE,
    barcode VARCHAR(255) NOT NULL UNIQUE,
    received_by VARCHAR(50) REFERENCES users(id),
    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'in_warehouse' CHECK (status IN ('in_warehouse', 'consolidated', 'shipped')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_sample_requests_user_id ON sample_requests(user_id);
CREATE INDEX idx_sample_requests_status ON sample_requests(status);
CREATE INDEX idx_received_samples_request_id ON received_samples(sample_request_id);
CREATE INDEX idx_received_samples_barcode ON received_samples(barcode);

-- Create trigger to update sample_request status when samples are received
CREATE OR REPLACE FUNCTION update_sample_request_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the received_samples count
    UPDATE sample_requests
    SET received_samples = (
        SELECT COUNT(*)
        FROM received_samples
        WHERE sample_request_id = NEW.sample_request_id
    ),
    status = CASE
        WHEN (
            SELECT COUNT(*)
            FROM received_samples
            WHERE sample_request_id = NEW.sample_request_id
        ) >= expected_samples THEN 'completed'
        WHEN (
            SELECT COUNT(*)
            FROM received_samples
            WHERE sample_request_id = NEW.sample_request_id
        ) > 0 THEN 'partially_received'
        ELSE 'pending'
    END,
    updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.sample_request_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_sample_status
AFTER INSERT OR DELETE ON received_samples
FOR EACH ROW
EXECUTE FUNCTION update_sample_request_status();

-- Disable RLS for now since we're using custom auth
-- In production, you would enable RLS with proper policies
ALTER TABLE sample_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE received_samples DISABLE ROW LEVEL SECURITY;

-- Note: When ready to enable RLS with proper Supabase Auth, uncomment and modify these policies:
-- ALTER TABLE sample_requests ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE received_samples ENABLE ROW LEVEL SECURITY;
--
-- CREATE POLICY sample_requests_select_policy ON sample_requests
--     FOR SELECT USING (true);
--
-- CREATE POLICY sample_requests_insert_policy ON sample_requests
--     FOR INSERT WITH CHECK (true);
--
-- CREATE POLICY sample_requests_update_policy ON sample_requests
--     FOR UPDATE USING (true);
--
-- CREATE POLICY received_samples_select_policy ON received_samples
--     FOR SELECT USING (true);
--
-- CREATE POLICY received_samples_insert_policy ON received_samples
--     FOR INSERT WITH CHECK (true);
--
-- CREATE POLICY received_samples_update_policy ON received_samples
--     FOR UPDATE USING (true);