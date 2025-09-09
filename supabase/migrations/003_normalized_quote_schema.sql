-- Normalized Quote Database Schema
-- Every field from the NewQuote form has its own column

-- Drop existing tables for clean setup
DROP TABLE IF EXISTS quote_carton_assignments CASCADE;
DROP TABLE IF EXISTS quote_destinations CASCADE;
DROP TABLE IF EXISTS carton_configurations CASCADE;
DROP TABLE IF EXISTS quote_requests_new CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;

-- Suppliers table
CREATE TABLE suppliers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'China',
    contact_name VARCHAR(255),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX idx_suppliers_name ON suppliers(name);

-- New normalized quote_requests table
CREATE TABLE quote_requests_new (
    id VARCHAR(50) PRIMARY KEY,
    customer_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Supplier Information
    supplier_id VARCHAR(50) REFERENCES suppliers(id),
    supplier_name VARCHAR(255), -- Denormalized for quick access
    supplier_address TEXT,
    supplier_city VARCHAR(100),
    supplier_country VARCHAR(100),
    supplier_contact_name VARCHAR(255),
    supplier_contact_phone VARCHAR(50),
    
    -- Shipment Details
    shipment_date DATE,
    service_type VARCHAR(50) DEFAULT 'Air Freight',
    requested_date DATE NOT NULL,
    due_by DATE NOT NULL,
    
    -- Product Information
    product_description TEXT,
    competitor_asin VARCHAR(50),
    regulated_goods VARCHAR(50) CHECK (regulated_goods IN ('fda', 'wood-bamboo-animal', 'batteries-hazmat', 'cream-liquids-powders', 'none')),
    
    -- Master Cargo Summary (calculated from destinations)
    total_carton_count INTEGER DEFAULT 0,
    total_gross_weight DECIMAL(10,2) DEFAULT 0,
    total_volumetric_weight DECIMAL(10,2) DEFAULT 0,
    total_chargeable_weight DECIMAL(10,2) DEFAULT 0,
    total_cbm DECIMAL(10,3) DEFAULT 0,
    dimension_unit VARCHAR(10) DEFAULT 'cm' CHECK (dimension_unit IN ('cm', 'in')),
    
    -- Special Instructions
    special_instructions TEXT,
    
    -- Status and Metadata
    status VARCHAR(50) DEFAULT 'Awaiting Quote',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX idx_quote_requests_customer ON quote_requests_new(customer_id);
CREATE INDEX idx_quote_requests_status ON quote_requests_new(status);
CREATE INDEX idx_quote_requests_created ON quote_requests_new(created_at DESC);

-- Carton Configurations table (reusable carton templates)
CREATE TABLE carton_configurations (
    id VARCHAR(50) PRIMARY KEY,
    quote_request_id VARCHAR(50) REFERENCES quote_requests_new(id) ON DELETE CASCADE,
    nickname VARCHAR(255) NOT NULL,
    carton_weight DECIMAL(10,2) NOT NULL,
    length DECIMAL(10,2) NOT NULL,
    width DECIMAL(10,2) NOT NULL,
    height DECIMAL(10,2) NOT NULL,
    dimension_unit VARCHAR(10) DEFAULT 'cm' CHECK (dimension_unit IN ('cm', 'in')),
    volumetric_weight DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_carton_configs_request ON carton_configurations(quote_request_id);

-- Quote Destinations table
CREATE TABLE quote_destinations (
    id VARCHAR(50) PRIMARY KEY,
    quote_request_id VARCHAR(50) REFERENCES quote_requests_new(id) ON DELETE CASCADE,
    
    -- Warehouse Information
    is_amazon BOOLEAN DEFAULT true,
    fba_warehouse_code VARCHAR(50),
    fba_warehouse_name VARCHAR(255),
    warehouse_address TEXT,
    warehouse_city VARCHAR(100),
    warehouse_state VARCHAR(50),
    warehouse_zip VARCHAR(20),
    custom_address TEXT, -- For non-Amazon addresses
    
    -- Cargo Summary for this destination
    total_cartons INTEGER DEFAULT 0,
    gross_weight DECIMAL(10,2) DEFAULT 0,
    volumetric_weight DECIMAL(10,2) DEFAULT 0,
    chargeable_weight DECIMAL(10,2) DEFAULT 0,
    
    -- Display order
    display_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_destinations_request ON quote_destinations(quote_request_id);
CREATE INDEX idx_destinations_warehouse ON quote_destinations(fba_warehouse_code);

-- Junction table for carton assignments to destinations
CREATE TABLE quote_carton_assignments (
    id VARCHAR(50) PRIMARY KEY,
    destination_id VARCHAR(50) REFERENCES quote_destinations(id) ON DELETE CASCADE,
    carton_config_id VARCHAR(50) REFERENCES carton_configurations(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(destination_id, carton_config_id)
);

CREATE INDEX idx_carton_assignments_dest ON quote_carton_assignments(destination_id);
CREATE INDEX idx_carton_assignments_config ON quote_carton_assignments(carton_config_id);

-- Updated quotes table to reference new schema
CREATE TABLE IF NOT EXISTS quotes_new (
    id VARCHAR(50) PRIMARY KEY,
    request_id VARCHAR(50) REFERENCES quote_requests_new(id) ON DELETE CASCADE,
    customer_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
    staff_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Base Pricing
    freight_cost DECIMAL(10,2) NOT NULL,
    insurance_cost DECIMAL(10,2) DEFAULT 0,
    customs_clearance_fee DECIMAL(10,2) DEFAULT 0,
    fuel_surcharge DECIMAL(10,2) DEFAULT 0,
    handling_fee DECIMAL(10,2) DEFAULT 0,
    documentation_fee DECIMAL(10,2) DEFAULT 0,
    
    -- Per-Destination Costs (stored as JSONB for flexibility)
    per_destination_costs JSONB,
    
    -- Commission
    commission_rate_per_kg DECIMAL(10,2),
    total_commission DECIMAL(10,2) DEFAULT 0,
    
    -- Totals
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_cost DECIMAL(10,2) NOT NULL,
    
    -- Quote Details
    valid_until DATE NOT NULL,
    payment_terms VARCHAR(100),
    delivery_terms VARCHAR(100),
    status VARCHAR(50) DEFAULT 'Pending',
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_quotes_request ON quotes_new(request_id);
CREATE INDEX idx_quotes_customer ON quotes_new(customer_id);
CREATE INDEX idx_quotes_status ON quotes_new(status);

-- Function to update quote request totals when destinations change
CREATE OR REPLACE FUNCTION update_quote_request_totals()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE quote_requests_new
    SET 
        total_carton_count = (
            SELECT COALESCE(SUM(total_cartons), 0)
            FROM quote_destinations
            WHERE quote_request_id = NEW.quote_request_id
        ),
        total_gross_weight = (
            SELECT COALESCE(SUM(gross_weight), 0)
            FROM quote_destinations
            WHERE quote_request_id = NEW.quote_request_id
        ),
        total_volumetric_weight = (
            SELECT COALESCE(SUM(volumetric_weight), 0)
            FROM quote_destinations
            WHERE quote_request_id = NEW.quote_request_id
        ),
        total_chargeable_weight = (
            SELECT COALESCE(SUM(chargeable_weight), 0)
            FROM quote_destinations
            WHERE quote_request_id = NEW.quote_request_id
        ),
        total_cbm = (
            SELECT COALESCE(SUM(volumetric_weight), 0) / 167
            FROM quote_destinations
            WHERE quote_request_id = NEW.quote_request_id
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.quote_request_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to update totals
CREATE TRIGGER update_request_totals_on_destination_insert
    AFTER INSERT ON quote_destinations
    FOR EACH ROW
    EXECUTE FUNCTION update_quote_request_totals();

CREATE TRIGGER update_request_totals_on_destination_update
    AFTER UPDATE ON quote_destinations
    FOR EACH ROW
    EXECUTE FUNCTION update_quote_request_totals();

CREATE TRIGGER update_request_totals_on_destination_delete
    AFTER DELETE ON quote_destinations
    FOR EACH ROW
    EXECUTE FUNCTION update_quote_request_totals();

-- Function to update destination totals when cartons are assigned
CREATE OR REPLACE FUNCTION update_destination_totals()
RETURNS TRIGGER AS $$
DECLARE
    dest_id VARCHAR(50);
BEGIN
    -- Get the destination ID
    IF TG_OP = 'DELETE' THEN
        dest_id := OLD.destination_id;
    ELSE
        dest_id := NEW.destination_id;
    END IF;
    
    -- Update destination totals
    UPDATE quote_destinations
    SET 
        total_cartons = (
            SELECT COALESCE(SUM(qca.quantity), 0)
            FROM quote_carton_assignments qca
            WHERE qca.destination_id = dest_id
        ),
        gross_weight = (
            SELECT COALESCE(SUM(qca.quantity * cc.carton_weight), 0)
            FROM quote_carton_assignments qca
            JOIN carton_configurations cc ON qca.carton_config_id = cc.id
            WHERE qca.destination_id = dest_id
        ),
        volumetric_weight = (
            SELECT COALESCE(SUM(qca.quantity * cc.volumetric_weight), 0)
            FROM quote_carton_assignments qca
            JOIN carton_configurations cc ON qca.carton_config_id = cc.id
            WHERE qca.destination_id = dest_id
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = dest_id;
    
    -- Update chargeable weight (max of gross and volumetric)
    UPDATE quote_destinations
    SET chargeable_weight = GREATEST(gross_weight, volumetric_weight)
    WHERE id = dest_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for carton assignments
CREATE TRIGGER update_destination_on_carton_insert
    AFTER INSERT ON quote_carton_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_destination_totals();

CREATE TRIGGER update_destination_on_carton_update
    AFTER UPDATE ON quote_carton_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_destination_totals();

CREATE TRIGGER update_destination_on_carton_delete
    AFTER DELETE ON quote_carton_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_destination_totals();

-- Sample data for suppliers
INSERT INTO suppliers (id, name, address, city, country, contact_name, contact_phone)
VALUES 
    ('supplier-1', 'Shanghai Electronics Co.', '123 Huaihai Road, Shanghai', 'Shanghai', 'China', 'Li Wei', '+86 21 1234 5678'),
    ('supplier-2', 'Guangzhou Manufacturing Ltd.', '456 Pearl River Avenue', 'Guangzhou', 'China', 'Chen Ming', '+86 20 8765 4321'),
    ('supplier-3', 'Shenzhen Tech Solutions', '789 Innovation Park', 'Shenzhen', 'China', 'Wang Xiaoming', '+86 755 9876 5432');

-- Create view for easy querying of quote requests with all details
CREATE OR REPLACE VIEW quote_request_details AS
SELECT 
    qr.*,
    s.name as supplier_display_name,
    (
        SELECT json_agg(
            json_build_object(
                'id', qd.id,
                'warehouse_code', qd.fba_warehouse_code,
                'warehouse_name', qd.fba_warehouse_name,
                'custom_address', qd.custom_address,
                'cartons', qd.total_cartons,
                'gross_weight', qd.gross_weight,
                'volumetric_weight', qd.volumetric_weight,
                'chargeable_weight', qd.chargeable_weight,
                'carton_assignments', (
                    SELECT json_agg(
                        json_build_object(
                            'config_id', qca.carton_config_id,
                            'config_nickname', cc.nickname,
                            'quantity', qca.quantity,
                            'weight', cc.carton_weight,
                            'dimensions', cc.length || 'x' || cc.width || 'x' || cc.height || ' ' || cc.dimension_unit
                        )
                    )
                    FROM quote_carton_assignments qca
                    JOIN carton_configurations cc ON qca.carton_config_id = cc.id
                    WHERE qca.destination_id = qd.id
                )
            )
            ORDER BY qd.display_order, qd.created_at
        )
    ) as destinations
FROM quote_requests_new qr
LEFT JOIN suppliers s ON qr.supplier_id = s.id
LEFT JOIN quote_destinations qd ON qd.quote_request_id = qr.id
GROUP BY qr.id, s.name;

-- Grant appropriate permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT INSERT, UPDATE, DELETE ON quote_requests_new, quote_destinations, carton_configurations, quote_carton_assignments, suppliers TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;