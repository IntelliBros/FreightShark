-- Add read tracking fields to messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS read_by_staff BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS read_by_customer BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS read_by_staff_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS read_by_customer_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_read_by_staff ON messages(read_by_staff);
CREATE INDEX IF NOT EXISTS idx_messages_read_by_customer ON messages(read_by_customer);

-- Update existing messages based on sender_role and is_read
-- If sender is customer and is_read is true, mark as read by staff
UPDATE messages 
SET read_by_staff = true, 
    read_by_staff_at = updated_at
WHERE sender_role = 'customer' 
  AND is_read = true;

-- If sender is staff/system and is_read is true, mark as read by customer  
UPDATE messages 
SET read_by_customer = true,
    read_by_customer_at = updated_at
WHERE sender_role IN ('staff', 'system')
  AND is_read = true;

-- Messages sent by customer are automatically read by customer
UPDATE messages 
SET read_by_customer = true,
    read_by_customer_at = created_at
WHERE sender_role = 'customer';

-- Messages sent by staff are automatically read by staff
UPDATE messages 
SET read_by_staff = true,
    read_by_staff_at = created_at
WHERE sender_role = 'staff';

-- Messages sent by system are automatically read by staff
UPDATE messages 
SET read_by_staff = true,
    read_by_staff_at = created_at
WHERE sender_role = 'system';