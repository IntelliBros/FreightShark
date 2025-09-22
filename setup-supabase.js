import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

// Supabase configuration
const supabaseUrl = 'https://isvuolzqqjutrfytebtl.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzdnVvbHpxcWp1dHJmeXRlYnRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNzMzMDksImV4cCI6MjA3Mjk0OTMwOX0.-TXgy5LNMMpjSSTq78P4QvQAO1QXJia07cdVBHchHRU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  console.log('🚀 Setting up Supabase database using Supabase client...');
  
  try {
    // Test connection
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    console.log('Testing connection...', testError ? 'No users table yet' : 'Connected');

    // Create demo users
    console.log('👥 Creating demo users...');
    const defaultPassword = 'Password123!';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const users = [
      {
        id: 'admin-1',
        name: 'John Admin',
        email: 'admin@freightshark.com',
        password_hash: passwordHash,
        company: 'FreightShark',
        role: 'admin',
        amazon_seller_id: null,
        ein_tax_id: null,
        staff_position: null
      },
      {
        id: 'user-1',
        name: 'Demo Customer',
        email: 'customer@example.com',
        password_hash: passwordHash,
        company: 'Acme Imports',
        role: 'user',
        amazon_seller_id: 'A1B2C3D4E5',
        ein_tax_id: '12-3456789',
        staff_position: null
      },
      {
        id: 'staff-1',
        name: 'Sarah Chen',
        email: 'staff@freightshark.com',
        password_hash: passwordHash,
        company: 'FreightShark',
        role: 'staff',
        amazon_seller_id: null,
        ein_tax_id: null,
        staff_position: 'Shipping Agent'
      }
    ];

    // Try to insert users using Supabase client
    for (const user of users) {
      const { data, error } = await supabase
        .from('users')
        .upsert(user, { 
          onConflict: 'email',
          ignoreDuplicates: true 
        });
      
      if (error) {
        console.log(`⚠️ Could not insert ${user.email}:`, error.message);
      } else {
        console.log(`✅ Created/Updated user: ${user.email} (role: ${user.role})`);
      }
    }

    // Check if users exist
    const { data: allUsers, error: fetchError } = await supabase
      .from('users')
      .select('id, email, role');
    
    if (fetchError) {
      console.log('❌ Could not fetch users:', fetchError.message);
      console.log('\n⚠️ Tables might not exist in Supabase yet.');
      console.log('Please create the tables manually in Supabase SQL Editor with the schema from backend/src/db/schema.sql');
    } else {
      console.log('\n✅ Users in database:', allUsers);
    }

    // Skip creating mock announcements - keeping database clean
    console.log('⏭️ Skipping mock announcements - keeping database clean');

    console.log('\n🎉 Setup attempt complete!');
    console.log('\n📝 Login credentials (if users were created):');
    console.log('------------------------');
    console.log('Customer Portal:');
    console.log('  Email: customer@example.com');
    console.log('  Password: Password123!');
    console.log('\nStaff Portal:');
    console.log('  Email: staff@freightshark.com');
    console.log('  Password: Password123!');
    console.log('\nAdmin Portal:');
    console.log('  Email: admin@freightshark.com');
    console.log('  Password: Password123!');
    console.log('------------------------\n');

  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

setupDatabase();