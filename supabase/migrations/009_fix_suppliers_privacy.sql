-- Add user_id to suppliers table to make them user-specific
ALTER TABLE suppliers
ADD COLUMN IF NOT EXISTS user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE;

-- Update existing suppliers to belong to a default user if needed
-- (In production, you'd want to handle this more carefully)

-- Create index for faster user-specific queries
CREATE INDEX IF NOT EXISTS idx_suppliers_user ON suppliers(user_id);

-- Enable Row Level Security
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Anyone can view suppliers" ON suppliers;
DROP POLICY IF EXISTS "Authenticated users can create suppliers" ON suppliers;
DROP POLICY IF EXISTS "Authenticated users can update suppliers" ON suppliers;

-- Create RLS policies - SUPPLIERS ARE NOW USER-SPECIFIC
-- Users can only see their own suppliers
CREATE POLICY "Users can view own suppliers" ON suppliers
    FOR SELECT USING (auth.uid()::text = user_id);

-- Users can only create suppliers for themselves
CREATE POLICY "Users can create own suppliers" ON suppliers
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Users can only update their own suppliers
CREATE POLICY "Users can update own suppliers" ON suppliers
    FOR UPDATE USING (auth.uid()::text = user_id);

-- Users can only delete their own suppliers
CREATE POLICY "Users can delete own suppliers" ON suppliers
    FOR DELETE USING (auth.uid()::text = user_id);

-- Grant permissions
GRANT ALL ON suppliers TO authenticated;