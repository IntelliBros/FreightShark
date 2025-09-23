-- First, check if the table exists and drop it if needed to recreate with correct schema
DROP TABLE IF EXISTS system_settings CASCADE;

-- Create system_settings table with correct schema
CREATE TABLE system_settings (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
    sample_delivery_address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT INTO system_settings (id, sample_delivery_address)
VALUES ('default', 'DDP Freight Consolidation Center, 123 Logistics Avenue, Building 7, Guangzhou, Guangdong 510000, China');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_system_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating updated_at
DROP TRIGGER IF EXISTS trigger_update_system_settings_updated_at ON system_settings;
CREATE TRIGGER trigger_update_system_settings_updated_at
BEFORE UPDATE ON system_settings
FOR EACH ROW
EXECUTE FUNCTION update_system_settings_updated_at();

-- Disable RLS for system settings
ALTER TABLE system_settings DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON system_settings TO authenticated;
GRANT ALL ON system_settings TO anon;
GRANT ALL ON system_settings TO service_role;

-- Verify the table was created successfully
SELECT
    column_name,
    data_type,
    column_default
FROM
    information_schema.columns
WHERE
    table_name = 'system_settings'
ORDER BY
    ordinal_position;