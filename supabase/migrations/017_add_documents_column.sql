-- Migration: Add documents column to shipments table
-- Description: Creates a dedicated documents column and migrates any documents data from destinations column
-- Date: 2024-01-23

-- Step 1: Add the documents column to shipments table
ALTER TABLE shipments
ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '[]'::jsonb;

-- Step 2: Note - Documents are currently stored in the 'documents' column already
-- No migration from destination needed as destination is for location data
-- This step is kept for documentation purposes only

-- Step 3: Ensure documents column has proper default value
-- No cleanup needed for destination column as it stores location data

-- Step 4: Create an index on the documents column for better query performance
CREATE INDEX IF NOT EXISTS idx_shipments_documents ON shipments USING gin (documents);

-- Step 5: Add a comment to document the column
COMMENT ON COLUMN shipments.documents IS 'Stores document metadata for shipment-related files (invoices, customs docs, etc.)';

-- Optional: If you want to ensure documents is always an array
ALTER TABLE shipments
ALTER COLUMN documents SET DEFAULT '[]'::jsonb;

-- Add a constraint to ensure documents is always an array
ALTER TABLE shipments
ADD CONSTRAINT check_documents_is_array
CHECK (jsonb_typeof(documents) = 'array' OR documents IS NULL);