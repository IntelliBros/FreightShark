import fs from 'fs';
import path from 'path';
import { pool, testConnection } from './database';
import bcrypt from 'bcryptjs';

const initDatabase = async () => {
  console.log('🚀 Initializing database...');
  
  // Test connection
  const connected = await testConnection();
  if (!connected) {
    console.error('Failed to connect to database');
    process.exit(1);
  }

  try {
    // Read and execute schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📋 Creating database schema...');
    await pool.query(schema);
    console.log('✅ Schema created successfully');

    // Create demo users
    console.log('👥 Creating demo users...');
    await createDemoUsers();
    console.log('✅ Demo users created');

    // Skip creating sample announcements - keeping database clean
    console.log('⏭️ Skipping sample announcements - keeping database clean');

    console.log('🎉 Database initialization complete!');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
};

const createDemoUsers = async () => {
  const defaultPassword = 'Password123!';
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  const users = [
    {
      id: 'admin-1',
      name: 'John Admin',
      email: 'admin@freightshark.com',
      passwordHash,
      company: 'FreightShark',
      role: 'admin'
    },
    {
      id: 'user-1',
      name: 'Demo Customer',
      email: 'customer@example.com',
      passwordHash,
      company: 'Acme Imports',
      role: 'user',
      amazonSellerId: 'A1B2C3D4E5',
      einTaxId: '12-3456789'
    },
    {
      id: 'staff-1',
      name: 'Sarah Chen',
      email: 'staff@freightshark.com',
      passwordHash,
      company: 'FreightShark',
      role: 'staff',
      staffPosition: 'Shipping Agent'
    }
  ];

  for (const user of users) {
    await pool.query(
      `INSERT INTO users (id, name, email, password_hash, company, role, amazon_seller_id, ein_tax_id, staff_position)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO NOTHING`,
      [
        user.id,
        user.name,
        user.email,
        user.passwordHash,
        user.company,
        user.role,
        user.amazonSellerId || null,
        user.einTaxId || null,
        user.staffPosition || null
      ]
    );
  }
};

// Removed createSampleAnnouncements function - no longer creating mock announcements

// Run initialization if this file is executed directly
if (require.main === module) {
  initDatabase().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export default initDatabase;