-- Direct SQL script to run in Supabase SQL Editor
-- This script analyzes and transfers documents from destination to documents column

-- Step 1: First, let's see what data we have
SELECT
  id,
  substring(destination::text, 1, 100) as destination_preview,
  pg_typeof(destination) as destination_type,
  documents,
  CASE
    WHEN destination::text LIKE '%"url"%' THEN 'Has URL field'
    WHEN destination::text LIKE '%"name"%' THEN 'Has name field'
    WHEN destination::text LIKE '%"fbaWarehouse"%' THEN 'Has FBA warehouse (location data)'
    ELSE 'Other'
  END as data_type
FROM shipments
WHERE destination IS NOT NULL
LIMIT 10;

-- Step 2: Count what needs to be transferred
SELECT
  COUNT(*) as total,
  COUNT(CASE WHEN destination::text LIKE '%"url"%' THEN 1 END) as with_url,
  COUNT(CASE WHEN destination::text LIKE '%"name"%' THEN 1 END) as with_name,
  COUNT(CASE WHEN destination::text LIKE '%"fbaWarehouse"%' THEN 1 END) as with_fba
FROM shipments
WHERE destination IS NOT NULL;

-- Step 3: ACTUAL TRANSFER - Run this after reviewing the above results
-- This handles text columns containing JSON strings
DO $$
DECLARE
  r RECORD;
  doc_count INTEGER := 0;
  success_count INTEGER := 0;
  error_count INTEGER := 0;
BEGIN
  -- Loop through each shipment with destination data
  FOR r IN
    SELECT id, destination, documents
    FROM shipments
    WHERE destination IS NOT NULL
      AND destination != ''
  LOOP
    BEGIN
      -- Check if destination looks like it contains documents (has url or name fields)
      IF r.destination::text LIKE '%"url"%' OR
         r.destination::text LIKE '%"name"%' OR
         r.destination::text LIKE '%"type"%' THEN

        -- Skip if it's location data (has FBA or address info)
        IF r.destination::text LIKE '%"fbaWarehouse"%' OR
           r.destination::text LIKE '%"address"%' THEN
          CONTINUE;
        END IF;

        -- Try to transfer the documents
        UPDATE shipments
        SET
          documents = CASE
            WHEN documents IS NULL OR documents = '[]'::jsonb
            THEN
              -- Parse destination as JSON
              CASE
                WHEN r.destination::text LIKE '[%' THEN r.destination::jsonb
                WHEN r.destination::text LIKE '{%' THEN jsonb_build_array(r.destination::jsonb)
                ELSE documents
              END
            ELSE
              -- Append to existing documents
              CASE
                WHEN r.destination::text LIKE '[%' THEN documents || r.destination::jsonb
                WHEN r.destination::text LIKE '{%' THEN documents || jsonb_build_array(r.destination::jsonb)
                ELSE documents
              END
          END,
          destination = NULL,
          updated_at = NOW()
        WHERE id = r.id;

        success_count := success_count + 1;

      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- Log error but continue processing
      error_count := error_count + 1;
      RAISE NOTICE 'Error processing shipment %: %', r.id, SQLERRM;
    END;
  END LOOP;

  RAISE NOTICE 'Transfer complete: % successful, % errors', success_count, error_count;
END $$;

-- Step 4: Verify the results
SELECT
  COUNT(*) as total_shipments,
  COUNT(CASE WHEN documents IS NOT NULL AND documents != '[]'::jsonb THEN 1 END) as with_documents,
  COUNT(CASE WHEN destination IS NOT NULL THEN 1 END) as still_with_destination
FROM shipments;

-- Step 5: Show sample of transferred documents
SELECT
  id,
  jsonb_array_length(COALESCE(documents, '[]'::jsonb)) as document_count,
  jsonb_pretty(documents) as documents_formatted
FROM shipments
WHERE documents IS NOT NULL
  AND documents != '[]'::jsonb
ORDER BY updated_at DESC
LIMIT 5;