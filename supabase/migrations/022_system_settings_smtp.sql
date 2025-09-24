-- Add SMTP settings to system_settings table
-- This keeps all configuration in one place

-- First ensure the system_settings table exists with the right structure
CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert SMTP settings with default values
INSERT INTO system_settings (key, value, description) VALUES
    ('smtp_host', '', 'SMTP server hostname (e.g., smtp.gmail.com)'),
    ('smtp_port', '587', 'SMTP server port (e.g., 587 for TLS, 465 for SSL)'),
    ('smtp_secure', 'false', 'Use SSL/TLS for SMTP connection'),
    ('smtp_user', '', 'SMTP authentication username/email'),
    ('smtp_pass', '', 'SMTP authentication password (encrypted)'),
    ('smtp_from_name', 'FreightShark', 'From name for emails'),
    ('smtp_from_email', 'noreply@freightshark.com', 'From email address'),
    ('smtp_enabled', 'false', 'Whether SMTP email sending is enabled')
ON CONFLICT (key) DO UPDATE SET
    description = EXCLUDED.description,
    updated_at = CURRENT_TIMESTAMP;

-- Function to get all SMTP settings as JSON
CREATE OR REPLACE FUNCTION get_smtp_config()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'enabled', (SELECT value FROM system_settings WHERE key = 'smtp_enabled')::boolean,
        'host', (SELECT value FROM system_settings WHERE key = 'smtp_host'),
        'port', (SELECT value FROM system_settings WHERE key = 'smtp_port')::integer,
        'secure', (SELECT value FROM system_settings WHERE key = 'smtp_secure')::boolean,
        'auth', json_build_object(
            'user', (SELECT value FROM system_settings WHERE key = 'smtp_user'),
            'pass', (SELECT value FROM system_settings WHERE key = 'smtp_pass')
        ),
        'from', json_build_object(
            'name', (SELECT value FROM system_settings WHERE key = 'smtp_from_name'),
            'email', (SELECT value FROM system_settings WHERE key = 'smtp_from_email')
        )
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to update SMTP settings
CREATE OR REPLACE FUNCTION update_smtp_config(config JSON)
RETURNS BOOLEAN AS $$
BEGIN
    -- Update each setting if provided
    IF config->>'host' IS NOT NULL THEN
        UPDATE system_settings SET value = config->>'host', updated_at = CURRENT_TIMESTAMP WHERE key = 'smtp_host';
    END IF;

    IF config->>'port' IS NOT NULL THEN
        UPDATE system_settings SET value = config->>'port', updated_at = CURRENT_TIMESTAMP WHERE key = 'smtp_port';
    END IF;

    IF config->>'secure' IS NOT NULL THEN
        UPDATE system_settings SET value = config->>'secure', updated_at = CURRENT_TIMESTAMP WHERE key = 'smtp_secure';
    END IF;

    IF config->'auth'->>'user' IS NOT NULL THEN
        UPDATE system_settings SET value = config->'auth'->>'user', updated_at = CURRENT_TIMESTAMP WHERE key = 'smtp_user';
    END IF;

    IF config->'auth'->>'pass' IS NOT NULL THEN
        UPDATE system_settings SET value = config->'auth'->>'pass', updated_at = CURRENT_TIMESTAMP WHERE key = 'smtp_pass';
    END IF;

    IF config->'from'->>'name' IS NOT NULL THEN
        UPDATE system_settings SET value = config->'from'->>'name', updated_at = CURRENT_TIMESTAMP WHERE key = 'smtp_from_name';
    END IF;

    IF config->'from'->>'email' IS NOT NULL THEN
        UPDATE system_settings SET value = config->'from'->>'email', updated_at = CURRENT_TIMESTAMP WHERE key = 'smtp_from_email';
    END IF;

    IF config->>'enabled' IS NOT NULL THEN
        UPDATE system_settings SET value = config->>'enabled', updated_at = CURRENT_TIMESTAMP WHERE key = 'smtp_enabled';
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_smtp_config() TO authenticated;
GRANT EXECUTE ON FUNCTION get_smtp_config() TO anon;
GRANT EXECUTE ON FUNCTION get_smtp_config() TO service_role;

GRANT EXECUTE ON FUNCTION update_smtp_config(JSON) TO authenticated;
GRANT EXECUTE ON FUNCTION update_smtp_config(JSON) TO service_role;

-- Test the functions
SELECT get_smtp_config();