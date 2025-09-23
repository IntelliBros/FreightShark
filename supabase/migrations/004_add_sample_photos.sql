-- Add photo field to received_samples table
ALTER TABLE received_samples
ADD COLUMN IF NOT EXISTS photo TEXT;

-- This will store the photo as base64 encoded string
-- In production, you might want to use Supabase Storage instead