-- =====================================================
-- NORMALIZED DATABASE SCHEMA FOR FREIGHTSHARK
-- Avoids JSON/TEXT columns in favor of individual columns
-- =====================================================

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS tracking_events CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS shipment_warehouses CASCADE;
DROP TABLE IF EXISTS quote_warehouse_costs CASCADE;
DROP TABLE IF EXISTS quote_additional_charges CASCADE;
DROP TABLE IF EXISTS warehouses CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS carton_details CASCADE;
DROP TABLE IF EXISTS shipments CASCADE;
DROP TABLE IF EXISTS quotes CASCADE;
DROP TABLE IF EXISTS quote_requests CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS id_sequences CASCADE;

-- Create users table (already well normalized)
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

-- Create sessions table (already well normalized)
CREATE TABLE sessions (
    token VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create suppliers table (normalized from pickup_location string)
CREATE TABLE suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state_province VARCHAR(100),
    country VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20),
    contact_name VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create warehouses table (normalized from destination_warehouses JSON)
CREATE TABLE warehouses (
    id SERIAL PRIMARY KEY,
    fba_warehouse_code VARCHAR(10) NOT NULL UNIQUE, -- LAX7, JFK8, etc.
    name VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state_province VARCHAR(100),
    country VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create quote_requests table (normalized)
CREATE TABLE quote_requests (
    id VARCHAR(50) PRIMARY KEY,
    customer_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
    service_type VARCHAR(50) DEFAULT 'Air Freight',
    cargo_ready_date DATE NOT NULL,
    total_weight DECIMAL(10,2),
    total_volume DECIMAL(10,2),
    total_cartons INTEGER,
    special_requirements TEXT,
    status VARCHAR(50) DEFAULT 'Awaiting Quote',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create quote_request_warehouses table (many-to-many relationship)
CREATE TABLE quote_request_warehouses (
    id SERIAL PRIMARY KEY,
    quote_request_id VARCHAR(50) REFERENCES quote_requests(id) ON DELETE CASCADE,
    warehouse_id INTEGER REFERENCES warehouses(id) ON DELETE CASCADE,
    amazon_shipment_id VARCHAR(100),
    cartons_count INTEGER,
    weight DECIMAL(10,2),
    UNIQUE(quote_request_id, warehouse_id)
);

-- Create carton_details table (normalized from carton details)
CREATE TABLE carton_details (
    id SERIAL PRIMARY KEY,
    quote_request_warehouse_id INTEGER REFERENCES quote_request_warehouses(id) ON DELETE CASCADE,
    length DECIMAL(8,2),
    width DECIMAL(8,2),
    height DECIMAL(8,2),
    weight DECIMAL(8,2),
    quantity INTEGER NOT NULL DEFAULT 1,
    description TEXT
);

-- Create quotes table (normalized)
CREATE TABLE quotes (
    id VARCHAR(50) PRIMARY KEY,
    request_id VARCHAR(50) REFERENCES quote_requests(id) ON DELETE CASCADE,
    customer_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
    staff_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    freight_cost DECIMAL(10,2) NOT NULL,
    insurance_cost DECIMAL(10,2) DEFAULT 0,
    fuel_surcharge DECIMAL(10,2) DEFAULT 0,
    customs_clearance_cost DECIMAL(10,2) DEFAULT 0,
    documentation_fee DECIMAL(10,2) DEFAULT 0,
    handling_fee DECIMAL(10,2) DEFAULT 0,
    total_cost DECIMAL(10,2) NOT NULL,
    valid_until DATE NOT NULL,
    commission_rate_per_kg DECIMAL(5,4), -- e.g., 0.0250 for 2.5%
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(50) DEFAULT 'Pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create quote_warehouse_costs table (normalized from per_warehouse_costs JSON)
CREATE TABLE quote_warehouse_costs (
    id SERIAL PRIMARY KEY,
    quote_id VARCHAR(50) REFERENCES quotes(id) ON DELETE CASCADE,
    warehouse_id INTEGER REFERENCES warehouses(id) ON DELETE CASCADE,
    cost_per_kg DECIMAL(8,4),
    base_cost DECIMAL(10,2),
    additional_fees DECIMAL(10,2) DEFAULT 0,
    UNIQUE(quote_id, warehouse_id)
);

-- Create quote_additional_charges table (normalized from additional_charges JSON)
CREATE TABLE quote_additional_charges (
    id SERIAL PRIMARY KEY,
    quote_id VARCHAR(50) REFERENCES quotes(id) ON DELETE CASCADE,
    charge_type VARCHAR(100) NOT NULL, -- 'storage', 'special_handling', etc.
    description TEXT,
    amount DECIMAL(10,2) NOT NULL,
    is_percentage BOOLEAN DEFAULT FALSE,
    applies_to VARCHAR(50) DEFAULT 'total' -- 'total', 'freight', 'weight'
);

-- Create shipments table (normalized)
CREATE TABLE shipments (
    id VARCHAR(50) PRIMARY KEY,
    quote_id VARCHAR(50) REFERENCES quotes(id) ON DELETE SET NULL,
    customer_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'Created',
    service_type VARCHAR(50),
    estimated_weight DECIMAL(10,2),
    actual_weight DECIMAL(10,2),
    estimated_volume DECIMAL(10,2),
    actual_volume DECIMAL(10,2),
    estimated_delivery DATE,
    actual_delivery DATE,
    pickup_date DATE,
    departure_date DATE,
    arrival_date DATE,
    customs_cleared_date DATE,
    delivered_date DATE,
    container_number VARCHAR(50),
    bill_of_lading VARCHAR(50),
    tracking_number VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create shipment_warehouses table (many-to-many for shipment destinations)
CREATE TABLE shipment_warehouses (
    id SERIAL PRIMARY KEY,
    shipment_id VARCHAR(50) REFERENCES shipments(id) ON DELETE CASCADE,
    warehouse_id INTEGER REFERENCES warehouses(id) ON DELETE CASCADE,
    cartons_count INTEGER,
    weight DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'Planned', -- 'Planned', 'In Transit', 'Delivered'
    delivered_date DATE,
    UNIQUE(shipment_id, warehouse_id)
);

-- Create tracking_events table (already well normalized)
CREATE TABLE tracking_events (
    id VARCHAR(50) PRIMARY KEY,
    shipment_id VARCHAR(50) REFERENCES shipments(id) ON DELETE CASCADE,
    date TIMESTAMP NOT NULL,
    status VARCHAR(100) NOT NULL,
    location VARCHAR(255),
    description TEXT,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create documents table (normalized)
CREATE TABLE documents (
    id VARCHAR(50) PRIMARY KEY,
    shipment_id VARCHAR(50) REFERENCES shipments(id) ON DELETE CASCADE,
    quote_id VARCHAR(50) REFERENCES quotes(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL, -- 'invoice', 'packing_list', 'bill_of_lading', etc.
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    uploaded_by VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    is_required BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create announcements table (already well normalized)
CREATE TABLE announcements (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
    created_by VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create system_settings table (key-value pairs for configuration)
CREATE TABLE system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create id_sequences table for generating custom IDs
CREATE TABLE id_sequences (
    name VARCHAR(50) PRIMARY KEY,
    current_value INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Users table indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Sessions table indexes
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- Suppliers table indexes
CREATE INDEX idx_suppliers_country ON suppliers(country);
CREATE INDEX idx_suppliers_city ON suppliers(city);

-- Warehouses table indexes
CREATE INDEX idx_warehouses_fba_code ON warehouses(fba_warehouse_code);
CREATE INDEX idx_warehouses_country ON warehouses(country);

-- Quote requests table indexes
CREATE INDEX idx_quote_requests_customer_id ON quote_requests(customer_id);
CREATE INDEX idx_quote_requests_status ON quote_requests(status);
CREATE INDEX idx_quote_requests_created_at ON quote_requests(created_at);
CREATE INDEX idx_quote_requests_supplier_id ON quote_requests(supplier_id);

-- Quote request warehouses indexes
CREATE INDEX idx_quote_request_warehouses_request_id ON quote_request_warehouses(quote_request_id);
CREATE INDEX idx_quote_request_warehouses_warehouse_id ON quote_request_warehouses(warehouse_id);

-- Quotes table indexes
CREATE INDEX idx_quotes_request_id ON quotes(request_id);
CREATE INDEX idx_quotes_customer_id ON quotes(customer_id);
CREATE INDEX idx_quotes_staff_id ON quotes(staff_id);
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_quotes_created_at ON quotes(created_at);

-- Shipments table indexes
CREATE INDEX idx_shipments_quote_id ON shipments(quote_id);
CREATE INDEX idx_shipments_customer_id ON shipments(customer_id);
CREATE INDEX idx_shipments_status ON shipments(status);
CREATE INDEX idx_shipments_created_at ON shipments(created_at);

-- Tracking events indexes
CREATE INDEX idx_tracking_events_shipment_id ON tracking_events(shipment_id);
CREATE INDEX idx_tracking_events_date ON tracking_events(date);

-- Documents indexes
CREATE INDEX idx_documents_shipment_id ON documents(shipment_id);
CREATE INDEX idx_documents_quote_id ON documents(quote_id);
CREATE INDEX idx_documents_type ON documents(document_type);

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Insert default warehouses
INSERT INTO warehouses (fba_warehouse_code, name, city, state_province, country) VALUES
('LAX7', 'Amazon LAX7 Fulfillment Center', 'Los Angeles', 'California', 'United States'),
('JFK8', 'Amazon JFK8 Fulfillment Center', 'Staten Island', 'New York', 'United States'),
('DFW7', 'Amazon DFW7 Fulfillment Center', 'Dallas', 'Texas', 'United States'),
('ATL6', 'Amazon ATL6 Fulfillment Center', 'Atlanta', 'Georgia', 'United States'),
('ORD4', 'Amazon ORD4 Fulfillment Center', 'Chicago', 'Illinois', 'United States'),
('SEA8', 'Amazon SEA8 Fulfillment Center', 'Seattle', 'Washington', 'United States'),
('BOS7', 'Amazon BOS7 Fulfillment Center', 'Boston', 'Massachusetts', 'United States'),
('PHX7', 'Amazon PHX7 Fulfillment Center', 'Phoenix', 'Arizona', 'United States');

-- Insert default suppliers
INSERT INTO suppliers (name, address, city, country) VALUES
('Guangzhou Electronics Co.', '123 Industrial Park', 'Guangzhou', 'China'),
('Shenzhen Manufacturing Ltd.', '456 Tech District', 'Shenzhen', 'China'),
('Shanghai Imports Inc.', '789 Port Area', 'Shanghai', 'China'),
('Ningbo Trading Co.', '321 Export Zone', 'Ningbo', 'China');

-- Initialize ID sequences
INSERT INTO id_sequences (name, current_value) VALUES
('quote', 1000),
('shipment', 1000),
('quote_request', 1000);

-- Insert default system settings
INSERT INTO system_settings (key, value, description) VALUES
('default_currency', 'USD', 'Default currency for quotes and invoices'),
('default_commission_rate', '0.025', 'Default commission rate (2.5%)'),
('quote_validity_days', '30', 'Default quote validity period in days'),
('max_file_upload_size', '10485760', 'Maximum file upload size in bytes (10MB)');