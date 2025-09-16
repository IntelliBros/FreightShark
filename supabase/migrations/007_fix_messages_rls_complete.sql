-- Drop ALL existing policies on messages table
DROP POLICY IF EXISTS "Enable insert for all authenticated users" ON messages;
DROP POLICY IF EXISTS "Enable read for all authenticated users" ON messages;
DROP POLICY IF EXISTS "Enable update for message sender" ON messages;
DROP POLICY IF EXISTS "Enable update for all authenticated users" ON messages;
DROP POLICY IF EXISTS "Enable delete for message sender" ON messages;

-- Create simple, permissive policies for authenticated users
CREATE POLICY "Allow all for authenticated" ON messages
  FOR ALL 
  USING (true)
  WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Grant full permissions
GRANT ALL ON messages TO authenticated;
GRANT ALL ON messages TO anon;
GRANT ALL ON messages TO service_role;