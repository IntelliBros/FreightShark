import { supabase } from '../lib/supabase';

const testMessagesTable = async () => {
  console.log('Testing messages table...');
  
  try {
    // First, try to check if the table exists by querying it
    const { data: existingMessages, error: checkError } = await supabase
      .from('messages')
      .select('*')
      .limit(1);

    if (checkError) {
      if (checkError.code === '42P01') {
        console.log('❌ Messages table does not exist');
        console.log('\n📋 To create the messages table, please:');
        console.log('1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/isvuolzqqjutrfytebtl/sql/new');
        console.log('2. Copy and run the SQL from: src/scripts/applyMessagesMigration.sql');
        console.log('3. Click "Run" to execute the migration');
        return;
      } else {
        console.log('⚠️ Error checking table:', checkError.message);
      }
    } else {
      console.log('✅ Messages table exists!');
      console.log('Current message count:', existingMessages?.length || 0);
    }

    // Try to insert a test message
    console.log('\nTesting message insertion...');
    const testMessage = {
      shipment_id: 'TEST-001',
      sender_id: 'system',
      sender_name: 'System Test',
      sender_role: 'system',
      content: 'This is a test message to verify the messages table is working.',
      is_read: false
    };

    const { data: insertedMessage, error: insertError } = await supabase
      .from('messages')
      .insert(testMessage)
      .select()
      .single();

    if (insertError) {
      console.log('❌ Failed to insert test message:', insertError.message);
    } else {
      console.log('✅ Test message inserted successfully!');
      console.log('Message ID:', insertedMessage.id);
      
      // Clean up test message
      const { error: deleteError } = await supabase
        .from('messages')
        .delete()
        .eq('id', insertedMessage.id);
      
      if (!deleteError) {
        console.log('✅ Test message cleaned up');
      }
    }

    // Check real-time subscription
    console.log('\n Testing real-time subscription...');
    const channel = supabase
      .channel('test-messages')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages'
      }, (payload) => {
        console.log('Real-time event received:', payload);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time subscription working!');
          channel.unsubscribe();
        }
      });

  } catch (error) {
    console.error('Test failed:', error);
  }
};

// Run the test
testMessagesTable();