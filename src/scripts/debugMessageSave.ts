import { supabase } from '../lib/supabase';
import { supabaseService } from '../services/supabaseService';

const debugMessageSave = async () => {
  console.log('=== Debugging Message Save ===\n');
  
  // Test message data
  const testMessage = {
    shipment_id: 'FS-00013',  // Using a real shipment ID
    sender_id: 'demo-customer',
    sender_name: 'Demo Customer',
    sender_role: 'customer' as const,
    content: 'Test message from debug script at ' + new Date().toLocaleTimeString(),
  };

  console.log('Attempting to save message:', testMessage);

  try {
    // Method 1: Using supabaseService
    console.log('\n1. Testing with supabaseService.messages.create()...');
    const result1 = await supabaseService.messages.create(testMessage);
    console.log('✅ Success! Message saved with ID:', result1.id);
    console.log('Full message data:', result1);
    
  } catch (error: any) {
    console.log('❌ supabaseService.messages.create() failed:', error.message);
    
    // Method 2: Direct Supabase insert
    console.log('\n2. Testing with direct supabase insert...');
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert(testMessage)
        .select()
        .single();
      
      if (error) {
        console.log('❌ Direct insert failed:', error.message);
        console.log('Error details:', error);
      } else {
        console.log('✅ Direct insert succeeded! Message ID:', data.id);
        console.log('Full message data:', data);
      }
    } catch (directError: any) {
      console.log('❌ Direct insert threw error:', directError.message);
    }
  }

  // Check if we can read messages
  console.log('\n3. Testing if we can read messages...');
  try {
    const { data: allMessages, error: readError } = await supabase
      .from('messages')
      .select('*')
      .eq('shipment_id', 'FS-00013')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (readError) {
      console.log('❌ Read failed:', readError.message);
    } else {
      console.log('✅ Read successful! Found', allMessages?.length || 0, 'messages');
      if (allMessages && allMessages.length > 0) {
        console.log('Latest message:', allMessages[0]);
      }
    }
  } catch (readException: any) {
    console.log('❌ Read threw exception:', readException.message);
  }

  // Check table structure
  console.log('\n4. Checking table structure...');
  try {
    const { data: tableInfo, error: structError } = await supabase
      .from('messages')
      .select('*')
      .limit(0);
    
    if (structError) {
      console.log('❌ Cannot access table structure:', structError.message);
    } else {
      console.log('✅ Table is accessible');
    }
  } catch (structException: any) {
    console.log('❌ Structure check exception:', structException.message);
  }

  console.log('\n=== Debug Complete ===');
};

// Run the debug
debugMessageSave();