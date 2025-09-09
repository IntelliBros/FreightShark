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

    // Create sample announcements
    console.log('📢 Creating sample announcements...');
    await createSampleAnnouncements();
    console.log('✅ Sample announcements created');

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

const createSampleAnnouncements = async () => {
  const announcements = [
    {
      id: 'ANN-001',
      title: 'Shipping Agent Update',
      content: 'Some Amazon warehouses are experiencing delays due to capacity issues. Please check your shipment status regularly.',
      type: 'warning',
      createdBy: 'staff-1'
    },
    {
      id: 'ANN-002',
      title: 'Holiday Schedule Notice',
      content: 'Our offices will be closed on December 25th and January 1st. Please plan your shipments accordingly.',
      type: 'info',
      createdBy: 'staff-1'
    },
    {
      id: 'ANN-003',
      title: 'New Feature: Real-time Tracking',
      content: 'We have enhanced our tracking system with real-time updates. Check your shipment status for live location data.',
      type: 'success',
      createdBy: 'staff-1'
    }
  ];

  for (const announcement of announcements) {
    await pool.query(
      `INSERT INTO announcements (id, title, content, type, created_by)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO NOTHING`,
      [announcement.id, announcement.title, announcement.content, announcement.type, announcement.createdBy]
    );
  }
};

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