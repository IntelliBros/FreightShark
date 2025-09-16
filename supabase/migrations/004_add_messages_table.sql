-- Create messages table for real-time chat
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id VARCHAR(255) NOT NULL,
  sender_id VARCHAR(255) NOT NULL,
  sender_name VARCHAR(255) NOT NULL,
  sender_role VARCHAR(50) NOT NULL CHECK (sender_role IN ('customer', 'staff', 'admin', 'system')),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  attachments JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_shipment_id ON messages(shipment_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_shipment_created ON messages(shipment_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS (allow all authenticated users to read/write messages for now)
CREATE POLICY "Enable read access for all users" ON messages
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for message sender" ON messages
  FOR UPDATE USING (sender_id::text = current_setting('app.current_user_id', true));

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating updated_at
DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();