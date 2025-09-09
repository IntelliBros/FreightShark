import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://isvuolzqqjutrfytebtl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzdnVvbHpxcWp1dHJmeXRlYnRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNzMzMDksImV4cCI6MjA3Mjk0OTMwOX0.-TXgy5LNMMpjSSTq78P4QvQAO1QXJia07cdVBHchHRU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabaseConnection() {
  console.log('🧪 Testing Supabase connection...');
  
  try {
    // Test 1: Check if tables exist
    console.log('\n1. Testing table access...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (usersError) {
      console.log('❌ Users table error:', usersError.message);
      console.log('💡 You need to run the SQL migrations in Supabase Dashboard');
      return false;
    }
    
    console.log('✅ Tables are accessible');
    
    // Test 2: Check demo users
    console.log('\n2. Checking demo users...');
    const { data: allUsers, error: fetchError } = await supabase
      .from('users')
      .select('id, email, role');
    
    if (fetchError) {
      console.log('❌ Could not fetch users:', fetchError.message);
      return false;
    }
    
    console.log('✅ Demo users found:', allUsers.length);
    allUsers.forEach(user => {
      console.log(`   - ${user.email} (${user.role})`);
    });
    
    // Test 3: Test quote request creation
    console.log('\n3. Testing quote request creation...');
    const testCustomer = allUsers.find(u => u.role === 'user');
    
    if (!testCustomer) {
      console.log('❌ No customer user found for testing');
      return false;
    }
    
    const testQuoteRequest = {
      id: `TEST-${Date.now()}`,
      customer_id: testCustomer.id,
      service_type: 'Air Freight',
      pickup_location: 'Test Supplier, 123 Test St, Test City, Test Country',
      destination_warehouses: [{
        id: 'test-warehouse',
        fbaWarehouse: 'FTW1',
        amazonShipmentId: 'FBA123TEST',
        cartons: 10,
        weight: 100
      }],
      cargo_ready_date: new Date().toISOString().split('T')[0],
      total_weight: 100,
      total_volume: 5.5,
      total_cartons: 10,
      special_requirements: 'Test quote request',
      status: 'Awaiting Quote'
    };
    
    const { data: newRequest, error: createError } = await supabase
      .from('quote_requests')
      .insert(testQuoteRequest)
      .select()
      .single();
    
    if (createError) {
      console.log('❌ Failed to create quote request:', createError.message);
      return false;
    }
    
    console.log('✅ Quote request created successfully!');
    console.log('   ID:', newRequest.id);
    
    // Clean up test data
    await supabase
      .from('quote_requests')
      .delete()
      .eq('id', newRequest.id);
    
    console.log('✅ Test data cleaned up');
    
    console.log('\n🎉 All tests passed! Supabase is ready for production use.');
    console.log('\n📝 Next steps:');
    console.log('   1. Make sure you ran both SQL migrations in Supabase Dashboard');
    console.log('   2. Login with: customer@example.com / Password123!');
    console.log('   3. Try creating a quote request in the app');
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

testSupabaseConnection();