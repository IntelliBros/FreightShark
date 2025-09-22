-- Create user carton templates table for reusable carton configurations
CREATE TABLE IF NOT EXISTS user_carton_templates (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
    nickname VARCHAR(255) NOT NULL,
    carton_weight DECIMAL(10,2) NOT NULL,
    length DECIMAL(10,2) NOT NULL,
    width DECIMAL(10,2) NOT NULL,
    height DECIMAL(10,2) NOT NULL,
    volumetric_weight DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX idx_user_carton_templates_user ON user_carton_templates(user_id);
CREATE INDEX idx_user_carton_templates_nickname ON user_carton_templates(nickname);

-- Enable Row Level Security
ALTER TABLE user_carton_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see and manage their own carton templates
CREATE POLICY "Users can view own carton templates" ON user_carton_templates
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create own carton templates" ON user_carton_templates
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own carton templates" ON user_carton_templates
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own carton templates" ON user_carton_templates
    FOR DELETE USING (auth.uid()::text = user_id);

-- Grant permissions
GRANT ALL ON user_carton_templates TO authenticated;