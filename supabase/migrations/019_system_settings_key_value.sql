-- Create a key-value store table for system settings
-- This is needed for storing commission rate and other global settings

-- First create the new table if it doesn't exist
CREATE TABLE IF NOT EXISTS system_settings_kv (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default commission rate
INSERT INTO system_settings_kv (key, value, description)
VALUES ('commission_rate', '0.50', 'Commission rate per kg in USD')
ON CONFLICT (key) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_system_settings_kv_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating updated_at
DROP TRIGGER IF EXISTS trigger_update_system_settings_kv_updated_at ON system_settings_kv;
CREATE TRIGGER trigger_update_system_settings_kv_updated_at
BEFORE UPDATE ON system_settings_kv
FOR EACH ROW
EXECUTE FUNCTION update_system_settings_kv_updated_at();

-- Disable RLS for system settings (admin only access via application logic)
ALTER TABLE system_settings_kv DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON system_settings_kv TO authenticated;
GRANT ALL ON system_settings_kv TO anon;
GRANT ALL ON system_settings_kv TO service_role;

-- Update the view/alias to point to the new table
-- This allows the code to continue using "system_settings" name
CREATE OR REPLACE VIEW system_settings AS
SELECT key, value, description, created_at, updated_at
FROM system_settings_kv;

-- Grant permissions on the view
GRANT ALL ON system_settings TO authenticated;
GRANT ALL ON system_settings TO anon;
GRANT ALL ON system_settings TO service_role;

-- Make the view updatable
CREATE OR REPLACE RULE system_settings_insert AS
ON INSERT TO system_settings
DO INSTEAD INSERT INTO system_settings_kv (key, value, description, created_at, updated_at)
VALUES (NEW.key, NEW.value, NEW.description, NEW.created_at, NEW.updated_at);

CREATE OR REPLACE RULE system_settings_update AS
ON UPDATE TO system_settings
DO INSTEAD UPDATE system_settings_kv
SET value = NEW.value, description = NEW.description, updated_at = CURRENT_TIMESTAMP
WHERE key = OLD.key;

CREATE OR REPLACE RULE system_settings_delete AS
ON DELETE TO system_settings
DO INSTEAD DELETE FROM system_settings_kv WHERE key = OLD.key;

-- Verify the setup
SELECT * FROM system_settings WHERE key = 'commission_rate';