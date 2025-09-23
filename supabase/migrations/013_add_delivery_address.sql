-- Add delivery_address field to received_samples table
ALTER TABLE received_samples
ADD COLUMN IF NOT EXISTS delivery_address TEXT;

-- This will store the complete delivery address as a single text field