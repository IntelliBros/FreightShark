-- Drop existing update policy if it exists
DROP POLICY IF EXISTS "Enable update for message sender" ON messages;

-- Create a more permissive update policy that allows anyone to update messages
-- This is needed for marking messages as read
CREATE POLICY "Enable update for all authenticated users" ON messages
  FOR UPDATE USING (true)
  WITH CHECK (true);

-- Alternative: If you want to be more restrictive, use this instead:
-- CREATE POLICY "Enable update for marking as read" ON messages
--   FOR UPDATE USING (true)
--   WITH CHECK (
--     -- Allow updates only to read status fields
--     (OLD.content = NEW.content) AND 
--     (OLD.sender_id = NEW.sender_id) AND
--     (OLD.sender_role = NEW.sender_role)
--   );

-- Ensure all policies are enabled
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON messages TO authenticated;
GRANT ALL ON messages TO anon;