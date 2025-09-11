import { createClient } from '@supabase/supabase-js';

// Use the same configuration as in src/lib/supabase.ts
const supabaseUrl = 'https://isvuolzqqjutrfytebtl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzdnVvbHpxcWp1dHJmeXRlYnRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNzMzMDksImV4cCI6MjA3Mjk0OTMwOX0.-TXgy5LNMMpjSSTq78P4QvQAO1QXJia07cdVBHchHRU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function addSampleQuoteRequests() {
  try {
    console.log('Connecting to Supabase...');
    
    // Get a customer user
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'user')
      .limit(1);

    if (userError) {
      console.error('Error fetching users:', userError);
      return;
    }

    if (!users || users.length === 0) {
      console.log('No customer users found. Creating a test customer...');
      
      // Create a test customer
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          id: 'test-customer-001',
          name: 'Test Customer',
          email: 'customer@example.com',
          password_hash: '$2a$10$PKeVBhoUNYj/flE2oAu0E.K0JAVGNWzkCYLhVj.GH8xCsI5O0jDPG', // Password123!
          company: 'Test Company Inc.',
          role: 'user',
          amazon_seller_id: 'TEST123',
          ein_tax_id: '12-3456789'
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating test customer:', createError);
        return;
      }
      
      console.log('Created test customer:', newUser.name);
    }

    // Get the customer ID (either existing or newly created)
    const { data: customer } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'user')
      .limit(1)
      .single();

    if (!customer) {
      console.error('Still no customer found after creation attempt');
      return;
    }

    const customerId = customer.id;
    console.log('Using customer:', customer.name, customer.email);

    // Sample quote requests
    const sampleRequests = [
      {
        id: 'QR-00003',
        customer_id: customerId,
        service_type: 'Air Freight',
        pickup_location: 'Shanghai, China',
        destination_warehouses: {
          destinations: [
            {
              id: '1',
              fbaWarehouse: 'LAX9',
              amazonShipmentId: 'FBA15G8K9L2M',
              cartons: 50,
              weight: 500
            },
            {
              id: '2',
              fbaWarehouse: 'PHX6',
              amazonShipmentId: 'FBA15H9K0M3N',
              cartons: 30,
              weight: 300
            }
          ],
          supplierDetails: {
            name: 'Shanghai Electronics Co.',
            address: '123 Industrial Park',
            city: 'Shanghai',
            country: 'China',
            contactName: 'Li Wei',
            contactPhone: '+86 21 1234 5678'
          },
          cargoDetails: {
            cartonCount: 80,
            grossWeight: 800,
            cbm: 12
          }
        },
        cargo_ready_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        total_weight: 800,
        total_volume: 12,
        total_cartons: 80,
        special_requirements: 'Handle with care - electronic items',
        status: 'Awaiting Quote'
      },
      {
        id: 'QR-00002',
        customer_id: customerId,
        service_type: 'Sea Freight',
        pickup_location: 'Shenzhen, China',
        destination_warehouses: {
          destinations: [
            {
              id: '1',
              fbaWarehouse: 'ONT8',
              amazonShipmentId: 'FBA15J2K4M6P',
              cartons: 200,
              weight: 2000
            }
          ],
          supplierDetails: {
            name: 'Shenzhen Textiles Ltd.',
            address: '456 Export Zone',
            city: 'Shenzhen',
            country: 'China',
            contactName: 'Zhang Ming',
            contactPhone: '+86 755 8765 4321'
          },
          cargoDetails: {
            cartonCount: 200,
            grossWeight: 2000,
            cbm: 40
          }
        },
        cargo_ready_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        total_weight: 2000,
        total_volume: 40,
        total_cartons: 200,
        special_requirements: 'Standard shipping',
        status: 'Awaiting Quote'
      },
      {
        id: 'QR-00001',
        customer_id: customerId,
        service_type: 'Air Freight',
        pickup_location: 'Guangzhou, China',
        destination_warehouses: {
          destinations: [
            {
              id: '1',
              fbaWarehouse: 'BFI4',
              amazonShipmentId: 'FBA15K3L5N7Q',
              cartons: 100,
              weight: 1000
            }
          ],
          supplierDetails: {
            name: 'Guangzhou Toys Factory',
            address: '789 Manufacturing District',
            city: 'Guangzhou',
            country: 'China',
            contactName: 'Chen Hong',
            contactPhone: '+86 20 9876 5432'
          },
          cargoDetails: {
            cartonCount: 100,
            grossWeight: 1000,
            cbm: 20
          }
        },
        cargo_ready_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        total_weight: 1000,
        total_volume: 20,
        total_cartons: 100,
        special_requirements: 'Fragile items - toys',
        status: 'Awaiting Quote'
      },
      {
        id: 'QR-85608',
        customer_id: customerId,
        service_type: 'Air Freight Express',
        pickup_location: 'Beijing, China',
        destination_warehouses: {
          destinations: [
            {
              id: '1',
              fbaWarehouse: 'JFK8',
              amazonShipmentId: 'FBA15M4N6P8R',
              cartons: 25,
              weight: 250
            },
            {
              id: '2',
              fbaWarehouse: 'EWR4',
              amazonShipmentId: 'FBA15N5P7Q9S',
              cartons: 25,
              weight: 250
            }
          ],
          supplierDetails: {
            name: 'Beijing Fashion Co.',
            address: '321 Commerce Street',
            city: 'Beijing',
            country: 'China',
            contactName: 'Wang Jun',
            contactPhone: '+86 10 5555 1234'
          },
          cargoDetails: {
            cartonCount: 50,
            grossWeight: 500,
            cbm: 8
          }
        },
        cargo_ready_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        total_weight: 500,
        total_volume: 8,
        total_cartons: 50,
        special_requirements: 'Urgent delivery required',
        status: 'Awaiting Quote'
      }
    ];

    console.log('\nAdding sample quote requests...');
    
    // Insert sample quote requests
    for (const request of sampleRequests) {
      const { data, error } = await supabase
        .from('quote_requests')
        .upsert(request, { onConflict: 'id' })
        .select();

      if (error) {
        console.error(`Error inserting quote request ${request.id}:`, error.message);
      } else {
        console.log(`✅ Added quote request: ${request.id}`);
      }
    }

    // Verify the data was added
    const { data: allRequests, error: fetchError } = await supabase
      .from('quote_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching quote requests:', fetchError);
    } else {
      console.log(`\n✅ Total quote requests in database: ${allRequests.length}`);
    }

  } catch (error) {
    console.error('Error adding sample quote requests:', error);
  }
}

addSampleQuoteRequests();