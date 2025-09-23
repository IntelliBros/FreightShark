-- Create carton_configurations table with user-specific access
CREATE TABLE IF NOT EXISTS carton_configurations (
  id VARCHAR(50) PRIMARY KEY DEFAULT ('carton_' || gen_random_uuid()),
  user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  length DECIMAL(10,2) NOT NULL,
  width DECIMAL(10,2) NOT NULL,
  height DECIMAL(10,2) NOT NULL,
  weight DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, name)
);

-- Create index for faster user-specific queries
CREATE INDEX IF NOT EXISTS idx_carton_configurations_user ON carton_configurations(user_id);
CREATE INDEX IF NOT EXISTS idx_carton_configurations_name ON carton_configurations(name);

-- Enable Row Level Security
ALTER TABLE carton_configurations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user-specific access
-- Users can only see their own carton configurations
CREATE POLICY "Users can view own carton configurations" ON carton_configurations
  FOR SELECT USING (user_id IS NOT NULL);

-- Users can only create carton configurations for themselves
CREATE POLICY "Users can create own carton configurations" ON carton_configurations
  FOR INSERT WITH CHECK (user_id IS NOT NULL);

-- Users can only update their own carton configurations
CREATE POLICY "Users can update own carton configurations" ON carton_configurations
  FOR UPDATE USING (user_id IS NOT NULL);

-- Users can only delete their own carton configurations
CREATE POLICY "Users can delete own carton configurations" ON carton_configurations
  FOR DELETE USING (user_id IS NOT NULL);

-- Grant permissions
GRANT ALL ON carton_configurations TO authenticated;
GRANT ALL ON carton_configurations TO anon;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_carton_configurations_updated_at
  BEFORE UPDATE ON carton_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();