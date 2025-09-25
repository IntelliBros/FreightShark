-- Add payee_details column to quotes table
-- This stores the payee information collected when a customer accepts a quote

ALTER TABLE quotes
ADD COLUMN IF NOT EXISTS payee_details JSONB;

-- Add comment for documentation
COMMENT ON COLUMN quotes.payee_details IS 'Stores payee information including email, name, company, country, and state/province collected during quote acceptance';

-- Example structure of payee_details:
-- {
--   "email": "john.doe@example.com",
--   "fullName": "John Doe",
--   "companyName": "Acme Corp",
--   "country": "United States",
--   "stateOrProvince": "California"
-- }