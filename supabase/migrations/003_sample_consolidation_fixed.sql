-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS received_samples CASCADE;
DROP TABLE IF EXISTS sample_requests CASCADE;

-- Create sample_requests table
CREATE TABLE sample_requests (
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
CREATE TABLE received_samples (
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

-- Create function to update sample_request status when samples are received
CREATE OR REPLACE FUNCTION update_sample_request_status()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Update the received_samples count for INSERT
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
    ELSIF TG_OP = 'DELETE' THEN
        -- Update the received_samples count for DELETE
        UPDATE sample_requests
        SET received_samples = (
            SELECT COUNT(*)
            FROM received_samples
            WHERE sample_request_id = OLD.sample_request_id
        ),
        status = CASE
            WHEN (
                SELECT COUNT(*)
                FROM received_samples
                WHERE sample_request_id = OLD.sample_request_id
            ) >= expected_samples THEN 'completed'
            WHEN (
                SELECT COUNT(*)
                FROM received_samples
                WHERE sample_request_id = OLD.sample_request_id
            ) > 0 THEN 'partially_received'
            ELSE 'pending'
        END,
        updated_at = CURRENT_TIMESTAMP
        WHERE id = OLD.sample_request_id;

        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating sample status
CREATE TRIGGER trigger_update_sample_status
AFTER INSERT OR DELETE ON received_samples
FOR EACH ROW
EXECUTE FUNCTION update_sample_request_status();

-- Disable RLS for now (enable with proper policies in production)
ALTER TABLE sample_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE received_samples DISABLE ROW LEVEL SECURITY;

-- Grant permissions (adjust based on your Supabase setup)
GRANT ALL ON sample_requests TO authenticated;
GRANT ALL ON sample_requests TO anon;
GRANT ALL ON sample_requests TO service_role;

GRANT ALL ON received_samples TO authenticated;
GRANT ALL ON received_samples TO anon;
GRANT ALL ON received_samples TO service_role;

-- Test that tables were created successfully
SELECT 'sample_requests table created' as status
WHERE EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_name = 'sample_requests'
);

SELECT 'received_samples table created' as status
WHERE EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_name = 'received_samples'
);