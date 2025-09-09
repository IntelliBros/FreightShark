-- Add rate_type column to quotes table
ALTER TABLE quotes 
ADD COLUMN IF NOT EXISTS rate_type VARCHAR(20) DEFAULT 'per-kg';

-- Add check constraint for rate_type values
ALTER TABLE quotes 
ADD CONSTRAINT check_rate_type 
CHECK (rate_type IN ('per-kg', 'flat-rate', 'per-cbm'));