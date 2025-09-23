-- Add wechat_phone column to suppliers table
ALTER TABLE suppliers
ADD COLUMN IF NOT EXISTS wechat_phone VARCHAR(100);

-- Add comment to clarify the column purpose
COMMENT ON COLUMN suppliers.wechat_phone IS 'WeChat ID or Phone Number for supplier contact';