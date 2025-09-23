import { supabase } from '../lib/supabase';

export interface SampleRequest {
  id: string;
  user_id: string;
  product_name: string;
  expected_samples: number;
  received_samples: number;
  status: 'pending' | 'partially_received' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface ReceivedSample {
  id: string;
  sample_request_id: string;
  barcode: string;
  received_by: string;
  received_at: string;
  status: 'in_warehouse' | 'consolidated' | 'shipped';
  notes?: string;
  photo?: string; // Base64 encoded image
  created_at: string;
  updated_at: string;
}

class SampleService {
  // Create a new sample request
  async createSampleRequest(request: Omit<SampleRequest, 'created_at' | 'updated_at' | 'received_samples' | 'status'>): Promise<SampleRequest | null> {
    try {
      console.log('Creating sample request:', request);

      // Get user details from localStorage first
      const storedUsers = localStorage.getItem('freight_shark_users');
      const users = storedUsers ? JSON.parse(storedUsers) : [];
      const localUser = users.find((u: any) => u.id === request.user_id);

      if (localUser) {
        // Always try to upsert the user to ensure they exist
        console.log('Ensuring user exists in database:', request.user_id);

        const { error: upsertError } = await supabase
          .from('users')
          .upsert({
            id: request.user_id,
            email: localUser.email || 'unknown@example.com',
            name: localUser.name || 'Unknown User',
            role: localUser.role || 'user',
            display_id: localUser.display_id || Math.floor(Math.random() * 10000),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          });

        if (upsertError) {
          console.error('Failed to upsert user:', upsertError);
          // Try to continue anyway
        } else {
          console.log('✅ User ensured in database');
        }
      }

      const { data, error } = await supabase
        .from('sample_requests')
        .insert({
          id: request.id,
          user_id: request.user_id,
          product_name: request.product_name,
          expected_samples: request.expected_samples,
          received_samples: 0,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error creating sample request:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });

        // If table doesn't exist, provide helpful message
        if (error.code === '42P01') {
          console.error('Table does not exist. Please run the migration first.');
        }

        // If foreign key constraint error, user doesn't exist
        if (error.code === '23503') {
          console.error('Foreign key constraint error - user may not exist in database');
          console.error('Attempting to create user and retry...');

          // Get user details from localStorage
          const storedUsers = localStorage.getItem('freight_shark_users');
          const users = storedUsers ? JSON.parse(storedUsers) : [];
          const localUser = users.find((u: any) => u.id === request.user_id);

          if (localUser) {
            // Try to create/upsert the user
            const { error: upsertError } = await supabase
              .from('users')
              .upsert({
                id: request.user_id,
                email: localUser.email || 'unknown@example.com',
                name: localUser.name || 'Unknown User',
                role: localUser.role || 'user',
                display_id: localUser.display_id || Math.floor(Math.random() * 10000),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'id'
              });

            if (!upsertError) {
              console.log('✅ User created/updated, retrying sample request...');

              // Retry the sample request
              const { data: retryData, error: retryError } = await supabase
                .from('sample_requests')
                .insert({
                  id: request.id,
                  user_id: request.user_id,
                  product_name: request.product_name,
                  expected_samples: request.expected_samples,
                  received_samples: 0,
                  status: 'pending'
                })
                .select()
                .single();

              if (!retryError) {
                console.log('✅ Sample request created after user creation');
                return retryData;
              }
            }
          }
        }

        // If duplicate key error (409 conflict), try with a new ID
        if (error.code === '23505' || error.message?.includes('duplicate')) {
          console.log('Duplicate ID detected, generating new ID with timestamp...');
          const timestamp = Date.now().toString().slice(-8);
          const newId = `${request.id}-${timestamp}`;

          // Retry with new ID
          const { data: retryData, error: retryError } = await supabase
            .from('sample_requests')
            .insert({
              id: newId,
              user_id: request.user_id,
              product_name: request.product_name,
              expected_samples: request.expected_samples,
              received_samples: 0,
              status: 'pending'
            })
            .select()
            .single();

          if (retryError) {
            console.error('Retry also failed:', retryError);
            return null;
          }

          console.log('✅ Sample request created with new ID:', newId);
          return retryData;
        }

        return null;
      }

      console.log('Sample request created successfully:', data);
      return data;
    } catch (error) {
      console.error('Exception in createSampleRequest:', error);
      return null;
    }
  }

  // Get all sample requests for a user
  async getUserSampleRequests(userId: string): Promise<SampleRequest[]> {
    try {
      console.log('🔍 Fetching sample requests for user:', userId);

      const { data, error } = await supabase
        .from('sample_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching user sample requests:', error);
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          details: error.details
        });

        if (error.code === '42P01') {
          console.error('⚠️ sample_requests table does not exist!');
          console.error('Please run the migration to create the table.');
        }
        return [];
      }

      console.log('✅ Found sample requests:', data?.length || 0);
      console.log('Sample requests data:', data);

      return data || [];
    } catch (error) {
      console.error('Exception in getUserSampleRequests:', error);
      return [];
    }
  }

  // Get all sample requests (for staff)
  async getAllSampleRequests(): Promise<SampleRequest[]> {
    try {
      const { data, error } = await supabase
        .from('sample_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all sample requests:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllSampleRequests:', error);
      return [];
    }
  }

  // Get a single sample request by ID
  async getSampleRequest(requestId: string): Promise<SampleRequest | null> {
    try {
      const { data, error } = await supabase
        .from('sample_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (error) {
        console.error('Error fetching sample request:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getSampleRequest:', error);
      return null;
    }
  }

  // Record a received sample (for staff)
  async recordReceivedSample(sample: Omit<ReceivedSample, 'created_at' | 'updated_at'>): Promise<ReceivedSample | null> {
    try {
      console.log('📸 Recording received sample with photo:', {
        id: sample.id,
        hasPhoto: !!sample.photo,
        photoSize: sample.photo?.length || 0
      });

      const { data, error } = await supabase
        .from('received_samples')
        .insert({
          id: sample.id,
          sample_request_id: sample.sample_request_id,
          barcode: sample.barcode,
          received_by: sample.received_by,
          received_at: sample.received_at,
          status: sample.status,
          notes: sample.notes,
          photo: sample.photo
        })
        .select()
        .single();

      if (error) {
        console.error('Error recording received sample:', error);
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          details: error.details
        });
        return null;
      }

      console.log('✅ Received sample recorded successfully with photo');
      return data;
    } catch (error) {
      console.error('Error in recordReceivedSample:', error);
      return null;
    }
  }

  // Get received samples for a request
  async getReceivedSamples(requestId: string): Promise<ReceivedSample[]> {
    try {
      const { data, error } = await supabase
        .from('received_samples')
        .select('*')
        .eq('sample_request_id', requestId)
        .order('received_at', { ascending: false });

      if (error) {
        console.error('Error fetching received samples:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getReceivedSamples:', error);
      return [];
    }
  }

  // Get all received samples (for staff)
  async getAllReceivedSamples(): Promise<ReceivedSample[]> {
    try {
      const { data, error } = await supabase
        .from('received_samples')
        .select('*')
        .order('received_at', { ascending: false });

      if (error) {
        console.error('Error fetching all received samples:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllReceivedSamples:', error);
      return [];
    }
  }

  // Check if a barcode has already been scanned
  async checkBarcodeExists(barcode: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('received_samples')
        .select('id')
        .eq('barcode', barcode)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
        console.error('Error checking barcode:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error in checkBarcodeExists:', error);
      return false;
    }
  }

  // Update received sample status
  async updateReceivedSampleStatus(sampleId: string, status: ReceivedSample['status']): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('received_samples')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', sampleId);

      if (error) {
        console.error('Error updating sample status:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateReceivedSampleStatus:', error);
      return false;
    }
  }

  // Get a single received sample by ID
  async getSampleById(sampleId: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('received_samples')
        .select(`
          *,
          sample_requests:sample_request_id (
            id,
            product_name
          )
        `)
        .eq('id', sampleId)
        .single();

      if (error) {
        console.error('Error fetching sample by ID:', error);
        return null;
      }

      // Transform the data to match expected format
      if (data) {
        return {
          id: data.id,
          product_name: data.sample_requests?.product_name || 'Unknown Product',
          received_at: data.received_at,
          consolidation_id: data.sample_request_id, // Use sample_request_id as consolidation ID
          photos: data.photo ? [data.photo] : [],
          status: data.status,
          barcode: data.barcode,
          notes: data.notes
        };
      }

      return null;
    } catch (error) {
      console.error('Error in getSampleById:', error);
      return null;
    }
  }
}

export const sampleService = new SampleService();