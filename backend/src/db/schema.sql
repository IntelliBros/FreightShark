-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS tracking_events CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS shipments CASCADE;
DROP TABLE IF EXISTS quotes CASCADE;
DROP TABLE IF EXISTS quote_requests CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS id_sequences CASCADE;

-- Create users table
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    company VARCHAR(255),
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'staff', 'user')),
    amazon_seller_id VARCHAR(255),
    ein_tax_id VARCHAR(50),
    staff_position VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create sessions table
CREATE TABLE sessions (
    token VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create quote_requests table
CREATE TABLE quote_requests (
    id VARCHAR(50) PRIMARY KEY,
    customer_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
    service_type VARCHAR(50) DEFAULT 'Air Freight',
    pickup_location TEXT NOT NULL,
    destination_warehouses JSONB NOT NULL,
    cargo_ready_date DATE NOT NULL,
    total_weight DECIMAL(10,2),
    total_volume DECIMAL(10,2),
    total_cartons INTEGER,
    special_requirements TEXT,
    status VARCHAR(50) DEFAULT 'Awaiting Quote',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create quotes table
CREATE TABLE quotes (
    id VARCHAR(50) PRIMARY KEY,
    request_id VARCHAR(50) REFERENCES quote_requests(id) ON DELETE CASCADE,
    customer_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
    staff_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    freight_cost DECIMAL(10,2) NOT NULL,
    insurance_cost DECIMAL(10,2),
    additional_charges JSONB,
    total_cost DECIMAL(10,2) NOT NULL,
    valid_until DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending',
    per_warehouse_costs JSONB,
    commission_rate_per_kg DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create shipments table
CREATE TABLE shipments (
    id VARCHAR(50) PRIMARY KEY,
    quote_id VARCHAR(50) REFERENCES quotes(id) ON DELETE SET NULL,
    customer_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'Created',
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    cargo_details JSONB,
    estimated_weight DECIMAL(10,2),
    actual_weight DECIMAL(10,2),
    estimated_delivery DATE,
    actual_delivery DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create tracking_events table
CREATE TABLE tracking_events (
    id VARCHAR(50) PRIMARY KEY,
    shipment_id VARCHAR(50) REFERENCES shipments(id) ON DELETE CASCADE,
    date TIMESTAMP NOT NULL,
    status VARCHAR(100) NOT NULL,
    location VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create documents table
CREATE TABLE documents (
    id VARCHAR(50) PRIMARY KEY,
    shipment_id VARCHAR(50) REFERENCES shipments(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50),
    size INTEGER,
    url TEXT,
    uploaded_by VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create announcements table
CREATE TABLE announcements (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(20) CHECK (type IN ('info', 'warning', 'success', 'error')),
    created_by VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create system_settings table
CREATE TABLE system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create id_sequences table
CREATE TABLE id_sequences (
    type VARCHAR(20) PRIMARY KEY,
    current_value INTEGER DEFAULT 0
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
CREATE INDEX idx_quote_requests_customer ON quote_requests(customer_id);
CREATE INDEX idx_quotes_customer ON quotes(customer_id);
CREATE INDEX idx_quotes_request ON quotes(request_id);
CREATE INDEX idx_shipments_customer ON shipments(customer_id);
CREATE INDEX idx_shipments_quote ON shipments(quote_id);
CREATE INDEX idx_tracking_shipment ON tracking_events(shipment_id);
CREATE INDEX idx_documents_shipment ON documents(shipment_id);

-- Initialize id_sequences
INSERT INTO id_sequences (type, current_value) VALUES 
    ('quote', 0), 
    ('shipment', 0)
ON CONFLICT (type) DO NOTHING;

-- Initialize system settings
INSERT INTO system_settings (key, value) VALUES 
    ('commission_rate', '{"rate_per_kg": 0.50}')
ON CONFLICT (key) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quote_requests_updated_at BEFORE UPDATE ON quote_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON quotes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shipments_updated_at BEFORE UPDATE ON shipments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to increment sequence
CREATE OR REPLACE FUNCTION increment_sequence(seq_type VARCHAR)
RETURNS INTEGER AS $$
DECLARE
    new_value INTEGER;
BEGIN
    UPDATE id_sequences 
    SET current_value = current_value + 1 
    WHERE type = seq_type
    RETURNING current_value INTO new_value;
    
    IF new_value IS NULL THEN
        INSERT INTO id_sequences (type, current_value) 
        VALUES (seq_type, 1)
        RETURNING current_value INTO new_value;
    END IF;
    
    RETURN new_value;
END;
$$ language 'plpgsql';