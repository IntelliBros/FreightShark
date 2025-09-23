-- Remove unique constraint on barcode column to allow unlimited sample scanning
-- This allows staff to scan the same sample ID multiple times for different consolidation requests

-- Drop the unique constraint on barcode column
ALTER TABLE received_samples DROP CONSTRAINT IF EXISTS received_samples_barcode_key;

-- Keep the index for performance but without uniqueness
DROP INDEX IF EXISTS idx_received_samples_barcode;
CREATE INDEX idx_received_samples_barcode ON received_samples(barcode);

-- Add a comment to document why this change was made
COMMENT ON COLUMN received_samples.barcode IS 'Sample barcode/QR code - can be scanned multiple times for unlimited sample processing';