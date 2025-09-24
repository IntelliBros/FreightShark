-- Migration: Transfer documents from destination column to documents column
-- Description: Simplified version for direct execution (handles text column type)
-- Date: 2024-01-23

-- Update shipments where destination contains document data
UPDATE shipments
SET
  documents = CASE
    WHEN destination IS NOT NULL
      AND destination LIKE '[%'  -- Starts with array bracket
      AND destination LIKE '%"url"%'
    THEN
      CASE
        WHEN documents IS NULL OR documents = '[]'::jsonb
        THEN destination::jsonb
        ELSE documents || destination::jsonb
      END
    WHEN destination IS NOT NULL
      AND destination LIKE '{%'  -- Starts with object bracket
      AND (destination LIKE '%"url"%' OR destination LIKE '%"name"%' OR destination LIKE '%"type"%')
      AND NOT (destination LIKE '%"fbaWarehouse"%' OR destination LIKE '%"address"%')
    THEN
      CASE
        WHEN documents IS NULL OR documents = '[]'::jsonb
        THEN jsonb_build_array(destination::jsonb)
        ELSE documents || jsonb_build_array(destination::jsonb)
      END
    ELSE documents
  END,
  destination = CASE
    WHEN destination IS NOT NULL
      AND (
        (destination LIKE '[%' AND destination LIKE '%"url"%')
        OR (destination LIKE '{%'
            AND (destination LIKE '%"url"%' OR destination LIKE '%"name"%' OR destination LIKE '%"type"%')
            AND NOT (destination LIKE '%"fbaWarehouse"%' OR destination LIKE '%"address"%'))
      )
    THEN NULL
    ELSE destination
  END,
  updated_at = NOW()
WHERE destination IS NOT NULL;