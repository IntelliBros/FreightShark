const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.isvuolzqqjutrfytebtl:0DxiZLBUJRe8dJ2w@aws-0-us-west-1.pooler.supabase.com:6543/postgres',
  ssl: {
    rejectUnauthorized: false
  }
});

async function createSuppliersTable() {
  console.log('🚀 Creating suppliers table...');

  try {
    // Test connection
    const testResult = await pool.query('SELECT NOW()');
    console.log('✅ Connected to database:', testResult.rows[0].now);

    // Check if suppliers table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'suppliers'
      );
    `);

    if (tableCheck.rows[0].exists) {
      console.log('⚠️ Suppliers table already exists');
      const countResult = await pool.query('SELECT COUNT(*) FROM suppliers');
      console.log(`📊 Current suppliers count: ${countResult.rows[0].count}`);
    } else {
      // Create suppliers table
      await pool.query(`
        CREATE TABLE suppliers (
          id VARCHAR(50) PRIMARY KEY,
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
      `);
      console.log('✅ Suppliers table created');

      // Create index
      await pool.query('CREATE INDEX idx_suppliers_name ON suppliers(name)');
      console.log('✅ Index created on suppliers.name');

      // Enable RLS (Row Level Security)
      await pool.query('ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY');
      console.log('✅ RLS enabled on suppliers table');

      // Create RLS policies - suppliers are accessible to all authenticated users
      await pool.query(`
        CREATE POLICY "Anyone can view suppliers" ON suppliers
          FOR SELECT USING (true)
      `);

      await pool.query(`
        CREATE POLICY "Authenticated users can create suppliers" ON suppliers
          FOR INSERT WITH CHECK (true)
      `);

      await pool.query(`
        CREATE POLICY "Authenticated users can update suppliers" ON suppliers
          FOR UPDATE USING (true)
      `);

      console.log('✅ RLS policies created');
    }

    // Also create user_carton_templates table if it doesn't exist
    const cartonTableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'user_carton_templates'
      );
    `);

    if (!cartonTableCheck.rows[0].exists) {
      await pool.query(`
        CREATE TABLE user_carton_templates (
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
      `);
      console.log('✅ User carton templates table created');

      // Create indexes
      await pool.query('CREATE INDEX idx_user_carton_templates_user ON user_carton_templates(user_id)');
      await pool.query('CREATE INDEX idx_user_carton_templates_nickname ON user_carton_templates(nickname)');
      console.log('✅ Indexes created for user_carton_templates');

      // Enable RLS
      await pool.query('ALTER TABLE user_carton_templates ENABLE ROW LEVEL SECURITY');

      // Create RLS policies - users can only see their own templates
      await pool.query(`
        CREATE POLICY "Users can view own carton templates" ON user_carton_templates
          FOR SELECT USING (user_id = current_user)
      `);

      await pool.query(`
        CREATE POLICY "Users can create own carton templates" ON user_carton_templates
          FOR INSERT WITH CHECK (user_id = current_user)
      `);

      await pool.query(`
        CREATE POLICY "Users can update own carton templates" ON user_carton_templates
          FOR UPDATE USING (user_id = current_user)
      `);

      await pool.query(`
        CREATE POLICY "Users can delete own carton templates" ON user_carton_templates
          FOR DELETE USING (user_id = current_user)
      `);

      console.log('✅ RLS policies created for user_carton_templates');
    } else {
      console.log('⚠️ User carton templates table already exists');
    }

    console.log('\n✨ Database setup complete!');

  } catch (error) {
    console.error('❌ Error setting up database:', error);
  } finally {
    await pool.end();
  }
}

createSuppliersTable();