-- Run this script in your Supabase SQL Editor to fix the quote creation issue

-- Add rate_type column to quotes table if it doesn't exist
ALTER TABLE quotes 
ADD COLUMN IF NOT EXISTS rate_type VARCHAR(20) DEFAULT 'per-kg';

-- Add check constraint for rate_type values (if not already exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_rate_type'
  ) THEN
    ALTER TABLE quotes 
    ADD CONSTRAINT check_rate_type 
    CHECK (rate_type IN ('per-kg', 'flat-rate', 'per-cbm'));
  END IF;
END $$;