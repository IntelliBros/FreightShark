-- Create SMTP settings table for secure email configuration storage
-- This replaces localStorage with database storage for better security

CREATE TABLE IF NOT EXISTS smtp_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    host VARCHAR(255) NOT NULL,
    port INTEGER NOT NULL,
    secure BOOLEAN DEFAULT false,
    auth_user VARCHAR(255) NOT NULL,
    auth_pass TEXT NOT NULL, -- Encrypted in application layer
    from_name VARCHAR(255) DEFAULT 'FreightShark',
    from_email VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Only one active configuration at a time
CREATE UNIQUE INDEX idx_smtp_settings_active ON smtp_settings(is_active) WHERE is_active = true;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_smtp_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating updated_at
CREATE TRIGGER trigger_update_smtp_settings_updated_at
BEFORE UPDATE ON smtp_settings
FOR EACH ROW
EXECUTE FUNCTION update_smtp_settings_updated_at();

-- Enable RLS for security
ALTER TABLE smtp_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can view and modify SMTP settings
CREATE POLICY smtp_settings_admin_only ON smtp_settings
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Grant permissions
GRANT ALL ON smtp_settings TO authenticated;
GRANT ALL ON smtp_settings TO service_role;

-- Insert default settings (optional - comment out if not needed)
-- INSERT INTO smtp_settings (
--     host,
--     port,
--     secure,
--     auth_user,
--     auth_pass,
--     from_name,
--     from_email,
--     is_active
-- ) VALUES (
--     'smtp.gmail.com',
--     587,
--     false,
--     'your-email@gmail.com',
--     'your-encrypted-password',
--     'FreightShark',
--     'noreply@freightshark.com',
--     true
-- );