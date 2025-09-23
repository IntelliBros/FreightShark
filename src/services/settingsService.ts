import { supabase } from '../lib/supabase';

export interface SystemSettings {
  id: string;
  sample_delivery_address?: string;
  created_at: string;
  updated_at: string;
}

class SettingsService {
  // Get system settings
  async getSettings(): Promise<SystemSettings | null> {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .single();

      if (error) {
        // If no settings exist yet, return default settings
        if (error.code === 'PGRST116') {
          return {
            id: 'default',
            sample_delivery_address: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        }
        console.error('Error fetching system settings:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Exception in getSettings:', error);
      return null;
    }
  }

  // Update sample delivery address
  async updateSampleDeliveryAddress(address: string): Promise<boolean> {
    try {
      // First check if settings exist
      const { data: existing } = await supabase
        .from('system_settings')
        .select('id')
        .single();

      if (existing) {
        // Update existing settings
        const { error } = await supabase
          .from('system_settings')
          .update({
            sample_delivery_address: address,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (error) {
          console.error('Error updating sample delivery address:', error);
          return false;
        }
      } else {
        // Create new settings
        const { error } = await supabase
          .from('system_settings')
          .insert({
            id: 'default',
            sample_delivery_address: address
          });

        if (error) {
          console.error('Error creating system settings:', error);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Exception in updateSampleDeliveryAddress:', error);
      return false;
    }
  }
}

export const settingsService = new SettingsService();