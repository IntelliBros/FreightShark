import { createClient } from '@supabase/supabase-js';

// Use the same configuration as in src/lib/supabase.ts
const supabaseUrl = 'https://isvuolzqqjutrfytebtl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzdnVvbHpxcWp1dHJmeXRlYnRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNzMzMDksImV4cCI6MjA3Mjk0OTMwOX0.-TXgy5LNMMpjSSTq78P4QvQAO1QXJia07cdVBHchHRU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function updateSampleQuoteRequest() {
  try {
    console.log('Updating QR-00001 with product details...');
    
    // Get the existing quote request
    const { data: existingRequest, error: fetchError } = await supabase
      .from('quote_requests')
      .select('*')
      .eq('id', 'QR-00001')
      .single();

    if (fetchError) {
      console.error('Error fetching quote request:', fetchError);
      return;
    }

    // Update the destination_warehouses JSONB to include product details in cargoDetails
    const updatedDestinationWarehouses = {
      ...existingRequest.destination_warehouses,
      cargoDetails: {
        ...existingRequest.destination_warehouses?.cargoDetails,
        cartonCount: 100,
        grossWeight: 1000,
        cbm: 20,
        productDescription: 'Educational toys and building blocks for children ages 3-10. Products include wooden puzzles, plastic building sets, and interactive learning games.',
        competitorASIN: 'B08XYZ12345',
        regulatedGoods: 'none',
        notes: 'Products are CE certified and meet all US toy safety standards. Please ensure careful handling during transport.'
      }
    };

    // Update the quote request
    const { data, error } = await supabase
      .from('quote_requests')
      .update({
        destination_warehouses: updatedDestinationWarehouses,
        special_requirements: 'Fragile items - toys. Products are CE certified and meet all US toy safety standards.'
      })
      .eq('id', 'QR-00001')
      .select();

    if (error) {
      console.error('Error updating quote request:', error);
    } else {
      console.log('✅ Successfully updated QR-00001 with product details');
      console.log('Product details added:', updatedDestinationWarehouses.cargoDetails);
    }

    // Also update QR-00003 with different product details
    console.log('\nUpdating QR-00003 with product details...');
    
    const { data: request3, error: fetch3Error } = await supabase
      .from('quote_requests')
      .select('*')
      .eq('id', 'QR-00003')
      .single();

    if (!fetch3Error && request3) {
      const updated3 = {
        ...request3.destination_warehouses,
        cargoDetails: {
          ...request3.destination_warehouses?.cargoDetails,
          cartonCount: 80,
          grossWeight: 800,
          cbm: 12,
          productDescription: 'Consumer electronics including wireless headphones, bluetooth speakers, and smart home devices.',
          competitorASIN: 'B09ABC67890',
          regulatedGoods: 'batteries-hazmat',
          notes: 'Contains lithium batteries. Requires proper hazmat documentation and handling.'
        }
      };

      const { data: data3, error: error3 } = await supabase
        .from('quote_requests')
        .update({
          destination_warehouses: updated3,
          special_requirements: 'Handle with care - electronic items. Contains lithium batteries.'
        })
        .eq('id', 'QR-00003')
        .select();

      if (error3) {
        console.error('Error updating QR-00003:', error3);
      } else {
        console.log('✅ Successfully updated QR-00003 with product details');
      }
    }

  } catch (error) {
    console.error('Error updating sample quote request:', error);
  }
}

updateSampleQuoteRequest();