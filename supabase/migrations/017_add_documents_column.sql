-- Migration: Add documents column to shipments table
-- Description: Creates a dedicated documents column and migrates any documents data from destinations column
-- Date: 2024-01-23

-- Step 1: Add the documents column to shipments table
ALTER TABLE shipments
ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '[]'::jsonb;

-- Step 2: Migrate documents from destinations column if they exist there
-- This checks if destinations contains document-like data and moves it
UPDATE shipments
SET documents = destinations
WHERE destinations IS NOT NULL
  AND jsonb_typeof(destinations) = 'array'
  AND EXISTS (
    SELECT 1
    FROM jsonb_array_elements(destinations) AS elem
    WHERE elem ? 'name'
       OR elem ? 'type'
       OR elem ? 'url'
       OR elem ? 'uploadedAt'
       OR elem ? 'size'
  );

-- Step 3: Clean up destinations column by removing document data
-- Only remove if the data looks like documents (has document fields)
UPDATE shipments
SET destinations = '[]'::jsonb
WHERE destinations IS NOT NULL
  AND jsonb_typeof(destinations) = 'array'
  AND EXISTS (
    SELECT 1
    FROM jsonb_array_elements(destinations) AS elem
    WHERE elem ? 'name'
       AND elem ? 'type'
       AND elem ? 'url'
       AND NOT (elem ? 'fbaWarehouse' OR elem ? 'amazonShipmentId')
  );

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