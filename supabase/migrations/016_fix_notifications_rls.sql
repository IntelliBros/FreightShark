-- Fix notifications table RLS policies for non-authenticated access
-- Since we're not using Supabase Auth, we need to modify the policies

-- Drop existing policies
DROP POLICY IF EXISTS notifications_select_policy ON notifications;
DROP POLICY IF EXISTS notifications_insert_policy ON notifications;
DROP POLICY IF EXISTS notifications_update_policy ON notifications;
DROP POLICY IF EXISTS notifications_delete_policy ON notifications;

-- Option 1: Disable RLS (simplest for development)
-- This allows all operations without authentication
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Option 2: If you want to keep RLS but make it more permissive:
-- Uncomment the following lines and comment out the DISABLE RLS line above
/*
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Allow all reads (notifications are user-specific by user_id anyway)
CREATE POLICY notifications_select_all ON notifications
FOR SELECT USING (true);

-- Allow all inserts (the app controls who can insert)
CREATE POLICY notifications_insert_all ON notifications
FOR INSERT WITH CHECK (true);

-- Allow updates to own notifications or by staff
CREATE POLICY notifications_update_all ON notifications
FOR UPDATE USING (true);

-- Only allow deletes by admin (optional)
CREATE POLICY notifications_delete_none ON notifications
FOR DELETE USING (false);
*/