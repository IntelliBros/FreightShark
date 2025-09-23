import { supabase } from '../lib/supabase';

export interface SampleShipmentRequest {
  id: string;
  user_id: string;
  sample_ids: string[]; // Array of received_samples IDs
  delivery_address: string;
  quantity: number;
  status: 'pending' | 'payment_pending' | 'paid' | 'shipped' | 'delivered';
  package_photo?: string;
  payment_link?: string;
  tracking_number?: string;
  shipped_at?: string;
  created_at: string;
  updated_at: string;
}

class SampleShipmentService {
  // Create a new shipment request
  async createShipmentRequest(request: Omit<SampleShipmentRequest, 'created_at' | 'updated_at'>): Promise<SampleShipmentRequest | null> {
    try {
      console.log('Creating sample shipment request:', request);

      const { data, error } = await supabase
        .from('sample_shipment_requests')
        .insert({
          id: request.id,
          user_id: request.user_id,
          sample_ids: request.sample_ids,
          delivery_address: request.delivery_address,
          quantity: request.quantity,
          status: request.status || 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating shipment request:', error);
        return null;
      }

      console.log('Shipment request created successfully:', data);
      return data;
    } catch (error) {
      console.error('Exception in createShipmentRequest:', error);
      return null;
    }
  }

  // Get shipment requests for a user
  async getUserShipmentRequests(userId: string): Promise<SampleShipmentRequest[]> {
    try {
      const { data, error } = await supabase
        .from('sample_shipment_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user shipment requests:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserShipmentRequests:', error);
      return [];
    }
  }

  // Get all shipment requests (for staff)
  async getAllShipmentRequests(): Promise<SampleShipmentRequest[]> {
    try {
      const { data, error } = await supabase
        .from('sample_shipment_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all shipment requests:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllShipmentRequests:', error);
      return [];
    }
  }

  // Update shipment request with package photo
  async updatePackagePhoto(requestId: string, photo: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('sample_shipment_requests')
        .update({
          package_photo: photo,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) {
        console.error('Error updating package photo:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updatePackagePhoto:', error);
      return false;
    }
  }

  // Update shipment request with payment link
  async updatePaymentLink(requestId: string, paymentLink: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('sample_shipment_requests')
        .update({
          payment_link: paymentLink,
          status: 'payment_pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) {
        console.error('Error updating payment link:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updatePaymentLink:', error);
      return false;
    }
  }

  // Mark as paid
  async markAsPaid(requestId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('sample_shipment_requests')
        .update({
          status: 'paid',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) {
        console.error('Error marking as paid:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in markAsPaid:', error);
      return false;
    }
  }

  // Mark as shipped with tracking number
  async markAsShipped(requestId: string, trackingNumber: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('sample_shipment_requests')
        .update({
          tracking_number: trackingNumber,
          status: 'shipped',
          shipped_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) {
        console.error('Error marking as shipped:', error);
        return false;
      }

      // Update the status of samples to 'shipped'
      const { data: shipmentData } = await supabase
        .from('sample_shipment_requests')
        .select('sample_ids')
        .eq('id', requestId)
        .single();

      if (shipmentData && shipmentData.sample_ids) {
        await supabase
          .from('received_samples')
          .update({ status: 'shipped' })
          .in('id', shipmentData.sample_ids);
      }

      return true;
    } catch (error) {
      console.error('Error in markAsShipped:', error);
      return false;
    }
  }
}

export const sampleShipmentService = new SampleShipmentService();