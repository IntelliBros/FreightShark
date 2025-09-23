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

-- Add RLS (Row Level Security) policies
ALTER TABLE sample_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE received_samples ENABLE ROW LEVEL SECURITY;

-- Policy for sample_requests: Users can see their own requests, staff and admin can see all
CREATE POLICY sample_requests_select_policy ON sample_requests
    FOR SELECT
    USING (
        auth.uid()::text = user_id
        OR EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()::text
            AND role IN ('staff', 'admin')
        )
    );

-- Policy for sample_requests: Users can insert their own requests
CREATE POLICY sample_requests_insert_policy ON sample_requests
    FOR INSERT
    WITH CHECK (auth.uid()::text = user_id);

-- Policy for sample_requests: Only staff and admin can update
CREATE POLICY sample_requests_update_policy ON sample_requests
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()::text
            AND role IN ('staff', 'admin')
        )
    );

-- Policy for received_samples: Users can see samples for their requests, staff and admin can see all
CREATE POLICY received_samples_select_policy ON received_samples
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM sample_requests
            WHERE id = received_samples.sample_request_id
            AND user_id = auth.uid()::text
        )
        OR EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()::text
            AND role IN ('staff', 'admin')
        )
    );

-- Policy for received_samples: Only staff and admin can insert
CREATE POLICY received_samples_insert_policy ON received_samples
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()::text
            AND role IN ('staff', 'admin')
        )
    );

-- Policy for received_samples: Only staff and admin can update
CREATE POLICY received_samples_update_policy ON received_samples
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()::text
            AND role IN ('staff', 'admin')
        )
    );