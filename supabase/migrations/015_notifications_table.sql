-- Create notifications table for in-app notifications
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'quote', 'shipment', 'invoice', 'sample', 'message'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    icon VARCHAR(50),
    link VARCHAR(255),
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, read);

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update timestamp
CREATE TRIGGER trigger_notifications_updated_at
BEFORE UPDATE ON notifications
FOR EACH ROW
EXECUTE FUNCTION update_notifications_updated_at();

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own notifications
CREATE POLICY notifications_select_policy ON notifications
FOR SELECT USING (
    auth.uid()::text = user_id OR
    auth.uid()::text IN (SELECT id FROM users WHERE role IN ('admin', 'staff'))
);

-- Only staff and admin can insert notifications
CREATE POLICY notifications_insert_policy ON notifications
FOR INSERT WITH CHECK (
    auth.uid()::text IN (SELECT id FROM users WHERE role IN ('admin', 'staff'))
);

-- Users can update their own notifications (mark as read), staff/admin can update any
CREATE POLICY notifications_update_policy ON notifications
FOR UPDATE USING (
    auth.uid()::text = user_id OR
    auth.uid()::text IN (SELECT id FROM users WHERE role IN ('admin', 'staff'))
);

-- Only admin can delete notifications
CREATE POLICY notifications_delete_policy ON notifications
FOR DELETE USING (
    auth.uid()::text IN (SELECT id FROM users WHERE role = 'admin')
);