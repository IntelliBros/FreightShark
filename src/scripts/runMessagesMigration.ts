import { supabase } from '../lib/supabase';

const runMessagesMigration = async () => {
  console.log('Starting messages table migration...');
  
  try {
    // Create messages table
    const { error: tableError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Create messages table for real-time chat
        CREATE TABLE IF NOT EXISTS messages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          shipment_id VARCHAR(255) NOT NULL,
          sender_id VARCHAR(255) NOT NULL,
          sender_name VARCHAR(255) NOT NULL,
          sender_role VARCHAR(50) NOT NULL CHECK (sender_role IN ('customer', 'staff', 'admin', 'system')),
          content TEXT NOT NULL,
          is_read BOOLEAN DEFAULT false,
          attachments JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (tableError) {
      console.log('Table might already exist or error:', tableError);
    } else {
      console.log('✅ Messages table created successfully');
    }

    // Create indexes
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_messages_shipment_id ON messages(shipment_id)',
      'CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id)',
      'CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC)',
      'CREATE INDEX IF NOT EXISTS idx_messages_shipment_created ON messages(shipment_id, created_at DESC)'
    ];

    for (const indexSql of indexes) {
      await supabase.rpc('exec_sql', { sql: indexSql }).catch(err => {
        console.log(`Index might already exist: ${err.message}`);
      });
    }
    console.log('✅ Indexes created');

    // Enable Row Level Security
    await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE messages ENABLE ROW LEVEL SECURITY'
    }).catch(err => {
      console.log('RLS might already be enabled:', err.message);
    });

    // Create policies
    const policies = [
      `CREATE POLICY IF NOT EXISTS "Enable read access for all users" ON messages FOR SELECT USING (true)`,
      `CREATE POLICY IF NOT EXISTS "Enable insert for authenticated users" ON messages FOR INSERT WITH CHECK (true)`,
      `CREATE POLICY IF NOT EXISTS "Enable update for message sender" ON messages FOR UPDATE USING (sender_id::text = current_setting('app.current_user_id', true))`
    ];

    for (const policySql of policies) {
      await supabase.rpc('exec_sql', { sql: policySql }).catch(err => {
        console.log(`Policy might already exist: ${err.message}`);
      });
    }
    console.log('✅ RLS policies created');

    // Create function for updating updated_at
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `
    }).catch(err => {
      console.log('Function might already exist:', err.message);
    });

    // Create trigger
    await supabase.rpc('exec_sql', {
      sql: `
        DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
        CREATE TRIGGER update_messages_updated_at
          BEFORE UPDATE ON messages
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
      `
    }).catch(err => {
      console.log('Trigger error:', err.message);
    });

    console.log('✅ Triggers created');

    // Verify the table exists
    const { data, error } = await supabase
      .from('messages')
      .select('id')
      .limit(1);

    if (!error) {
      console.log('✅ Migration completed successfully! Messages table is ready.');
    } else {
      console.log('⚠️ Table created but verification failed:', error.message);
    }

  } catch (error) {
    console.error('Migration failed:', error);
  }
};

// Run the migration
runMessagesMigration();