-- Create sample_shipment_requests table for managing sample shipping
CREATE TABLE IF NOT EXISTS sample_shipment_requests (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
    sample_ids TEXT[], -- Array of received_samples IDs
    delivery_address TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (
        status IN ('pending', 'payment_pending', 'paid', 'shipped', 'delivered')
    ),
    package_photo TEXT, -- Base64 encoded package photo
    payment_link TEXT,
    tracking_number VARCHAR(255),
    shipped_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_sample_shipment_requests_user_id ON sample_shipment_requests(user_id);
CREATE INDEX idx_sample_shipment_requests_status ON sample_shipment_requests(status);
CREATE INDEX idx_sample_shipment_requests_created_at ON sample_shipment_requests(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_sample_shipment_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating updated_at
CREATE TRIGGER trigger_update_sample_shipment_requests_updated_at
BEFORE UPDATE ON sample_shipment_requests
FOR EACH ROW
EXECUTE FUNCTION update_sample_shipment_requests_updated_at();

-- Disable RLS for now (enable with proper policies in production)
ALTER TABLE sample_shipment_requests DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON sample_shipment_requests TO authenticated;
GRANT ALL ON sample_shipment_requests TO anon;
GRANT ALL ON sample_shipment_requests TO service_role;