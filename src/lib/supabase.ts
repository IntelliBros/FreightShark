import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://isvuolzqqjutrfytebtl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzdnVvbHpxcWp1dHJmeXRlYnRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNzMzMDksImV4cCI6MjA3Mjk0OTMwOX0.-TXgy5LNMMpjSSTq78P4QvQAO1QXJia07cdVBHchHRU';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Initialize database tables
export const initializeDatabase = async () => {
  try {
    // Create users table
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(50) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          company VARCHAR(255),
          role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'staff', 'user')),
          amazon_seller_id VARCHAR(255),
          ein_tax_id VARCHAR(50),
          staff_position VARCHAR(100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `
    }).catch(() => {
      // Table might already exist
    });

    // Create sessions table
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS sessions (
          token VARCHAR(255) PRIMARY KEY,
          user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `
    }).catch(() => {});

    // Create quote_requests table
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS quote_requests (
          id VARCHAR(50) PRIMARY KEY,
          customer_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
          pickup_location TEXT NOT NULL,
          delivery_warehouses JSONB NOT NULL,
          cargo_ready_date DATE NOT NULL,
          total_weight DECIMAL(10,2),
          total_volume DECIMAL(10,2),
          total_cartons INTEGER,
          status VARCHAR(50) DEFAULT 'Pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `
    }).catch(() => {});

    // Create quotes table
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS quotes (
          id VARCHAR(50) PRIMARY KEY,
          request_id VARCHAR(50) REFERENCES quote_requests(id) ON DELETE CASCADE,
          customer_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
          freight_cost DECIMAL(10,2) NOT NULL,
          insurance_cost DECIMAL(10,2),
          additional_charges JSONB,
          total_cost DECIMAL(10,2) NOT NULL,
          valid_until DATE NOT NULL,
          status VARCHAR(50) DEFAULT 'Pending',
          per_warehouse_costs JSONB,
          commission_rate_per_kg DECIMAL(10,2),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `
    }).catch(() => {});

    // Create shipments table
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS shipments (
          id VARCHAR(50) PRIMARY KEY,
          quote_id VARCHAR(50) REFERENCES quotes(id) ON DELETE SET NULL,
          customer_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
          status VARCHAR(50) DEFAULT 'Created',
          origin TEXT NOT NULL,
          destination TEXT NOT NULL,
          cargo_details JSONB,
          estimated_weight DECIMAL(10,2),
          actual_weight DECIMAL(10,2),
          tracking_events JSONB DEFAULT '[]',
          documents JSONB DEFAULT '[]',
          delivery_date TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `
    }).catch(() => {});

    // Create announcements table
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS announcements (
          id VARCHAR(50) PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          content TEXT NOT NULL,
          type VARCHAR(20) CHECK (type IN ('info', 'warning', 'success', 'error')),
          created_by VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `
    }).catch(() => {});

    // Create system_settings table
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS system_settings (
          key VARCHAR(100) PRIMARY KEY,
          value JSONB NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `
    }).catch(() => {});

    // Create suppliers table - USER SPECIFIC
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS suppliers (
          id VARCHAR(50) PRIMARY KEY,
          user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          address TEXT NOT NULL,
          city VARCHAR(100),
          country VARCHAR(100) DEFAULT 'China',
          contact_name VARCHAR(255),
          contact_phone VARCHAR(50),
          contact_email VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `
    }).catch(() => {});

    // Create user_carton_templates table
    await supabase.rpc('exec_sql', {
      sql: `
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
        )
      `
    }).catch(() => {});

    // Create id_sequences table
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS id_sequences (
          type VARCHAR(20) PRIMARY KEY,
          current_value INTEGER DEFAULT 0
        )
      `
    }).catch(() => {});

    console.log('Database tables initialization attempted');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

// Helper function to get next ID
export const getNextSequenceId = async (type: 'quote' | 'shipment'): Promise<string> => {
  // First try to update
  const { data: updateData, error: updateError } = await supabase
    .rpc('increment_sequence', { seq_type: type })
    .single();
  
  if (updateData) {
    const paddedNumber = updateData.toString().padStart(5, '0');
    return type === 'quote' ? `Q-${paddedNumber}` : `FS-${paddedNumber}`;
  }
  
  // If no row exists, create one
  const { data, error } = await supabase
    .from('id_sequences')
    .insert({ type, current_value: 1 })
    .select('current_value')
    .single();
  
  if (data) {
    const paddedNumber = data.current_value.toString().padStart(5, '0');
    return type === 'quote' ? `Q-${paddedNumber}` : `FS-${paddedNumber}`;
  }
  
  // Fallback to timestamp-based ID
  const timestamp = Date.now().toString().slice(-5);
  return type === 'quote' ? `Q-${timestamp}` : `FS-${timestamp}`;
};