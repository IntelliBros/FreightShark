-- Migration: Transfer documents from destination column to documents column
-- Description: Moves any document data stored in destination column to the proper documents column
-- Date: 2024-01-23
-- This can be run directly in Supabase SQL Editor

-- Step 1: Create a backup of current data (optional but recommended)
CREATE TABLE IF NOT EXISTS shipments_backup_before_transfer AS 
SELECT * FROM shipments;

-- Step 2: Update shipments where destination contains document data
-- This identifies documents by looking for typical document fields
WITH documents_to_transfer AS (
  SELECT 
    id,
    destination,
    documents,
    CASE 
      -- Check if destination is an array of documents
      WHEN jsonb_typeof(destination) = 'array' 
        AND destination::text LIKE '%"url"%' 
        AND destination::text LIKE '%"name"%'
      THEN destination
      -- Check if destination is a single document object
      WHEN jsonb_typeof(destination) = 'object'
        AND (destination ? 'url' OR destination ? 'name' OR destination ? 'type')
        AND NOT (destination ? 'fbaWarehouse' OR destination ? 'address')
      THEN jsonb_build_array(destination)
      ELSE NULL
    END as docs_from_destination
  FROM shipments
  WHERE destination IS NOT NULL
)
UPDATE shipments s
SET 
  documents = COALESCE(
    CASE 
      WHEN s.documents IS NULL OR s.documents = '[]'::jsonb 
      THEN dt.docs_from_destination
      ELSE s.documents || dt.docs_from_destination
    END,
    s.documents
  ),
  destination = NULL,  -- Clear destination after transfer
  updated_at = NOW()
FROM documents_to_transfer dt
WHERE s.id = dt.id
  AND dt.docs_from_destination IS NOT NULL;

-- Step 3: Report results
SELECT 
  COUNT(*) FILTER (WHERE documents IS NOT NULL AND documents != '[]'::jsonb) as shipments_with_documents,
  COUNT(*) FILTER (WHERE destination IS NOT NULL) as shipments_still_with_destination,
  COUNT(*) as total_shipments
FROM shipments;

-- Step 4: Verify transferred documents
SELECT 
  id,
  jsonb_array_length(COALESCE(documents, '[]'::jsonb)) as document_count,
  documents
FROM shipments
WHERE documents IS NOT NULL 
  AND documents != '[]'::jsonb
LIMIT 10;