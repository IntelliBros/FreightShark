import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

// Types
export interface QuoteRequest {
  id: string;
  customer_id: string;
  service_type: string;
  pickup_location: string;
  destination_warehouses: any;
  cargo_ready_date: string;
  total_weight?: number;
  total_volume?: number;
  total_cartons?: number;
  special_requirements?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export interface Quote {
  id: string;
  request_id: string;
  customer_id: string;
  staff_id?: string;
  freight_cost: number;
  insurance_cost?: number;
  additional_charges?: any;
  total_cost: number;
  valid_until: string;
  status: string;
  per_warehouse_costs?: any;
  commission_rate_per_kg?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Shipment {
  id: string;
  quote_id?: string;
  customer_id: string;
  status: string;
  origin: string;
  destination: string;
  cargo_details?: any;
  estimated_weight?: number;
  actual_weight?: number;
  estimated_delivery?: string;
  actual_delivery?: string;
  created_at?: string;
  updated_at?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password_hash?: string;
  company: string;
  role: 'admin' | 'user' | 'staff';
  amazon_seller_id?: string;
  ein_tax_id?: string;
  staff_position?: string;
  created_at?: string;
  updated_at?: string;
}

// Helper function to get next sequence ID
async function getNextSequenceId(type: 'quote' | 'shipment'): Promise<string> {
  const { data, error } = await supabase.rpc('increment_sequence', { seq_type: type });
  
  if (error || !data) {
    // Fallback to timestamp-based ID
    const timestamp = Date.now().toString().slice(-5);
    return type === 'quote' ? `Q-${timestamp}` : `FS-${timestamp}`;
  }
  
  const paddedNumber = data.toString().padStart(5, '0');
  return type === 'quote' ? `Q-${paddedNumber}` : `FS-${paddedNumber}`;
}

// Supabase Service
export const supabaseService = {
  // User methods
  users: {
    async getAll() {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },

    async getById(id: string) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },

    async getByEmail(email: string) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .ilike('email', email)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },

    async create(user: Partial<User>) {
      const newUser = {
        ...user,
        id: user.id || `user-${uuidv4()}`
      };

      const { data, error } = await supabase
        .from('users')
        .insert(newUser)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    async update(id: string, updates: Partial<User>) {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
  },

  // Quote Request methods
  quoteRequests: {
    async getAll() {
      const { data, error } = await supabase
        .from('quote_requests')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },

    async getByCustomerId(customerId: string) {
      const { data, error } = await supabase
        .from('quote_requests')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },

    async getById(id: string) {
      const { data, error } = await supabase
        .from('quote_requests')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },

    async create(request: Partial<QuoteRequest>) {
      // Generate ID
      const requestId = `QR-${Date.now().toString().slice(-5)}`;
      
      const newRequest = {
        ...request,
        id: requestId,
        status: request.status || 'Awaiting Quote'
      };

      const { data, error } = await supabase
        .from('quote_requests')
        .insert(newRequest)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    async update(id: string, updates: Partial<QuoteRequest>) {
      const { data, error } = await supabase
        .from('quote_requests')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
  },

  // Quote methods
  quotes: {
    async getAll() {
      const { data, error } = await supabase
        .from('quotes')
        .select(`
          *,
          quote_requests (
            service_type,
            pickup_location,
            destination_warehouses
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },

    async getByCustomerId(customerId: string) {
      const { data, error } = await supabase
        .from('quotes')
        .select(`
          *,
          quote_requests (
            service_type,
            pickup_location,
            destination_warehouses
          )
        `)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },

    async getById(id: string) {
      const { data, error } = await supabase
        .from('quotes')
        .select(`
          *,
          quote_requests (
            service_type,
            pickup_location,
            destination_warehouses
          )
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },

    async create(quote: Partial<Quote>) {
      const quoteId = await getNextSequenceId('quote');
      
      const newQuote = {
        ...quote,
        id: quoteId,
        status: quote.status || 'Pending'
      };

      const { data, error } = await supabase
        .from('quotes')
        .insert(newQuote)
        .select()
        .single();
      
      if (error) throw error;
      
      // Update quote request status
      if (quote.request_id) {
        await supabaseService.quoteRequests.update(quote.request_id, {
          status: 'Quoted'
        });
      }
      
      return data;
    },

    async update(id: string, updates: Partial<Quote>) {
      const { data, error } = await supabase
        .from('quotes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    async accept(id: string) {
      // Get quote details
      const quote = await this.getById(id);
      if (!quote) throw new Error('Quote not found');
      
      // Update quote status
      await this.update(id, { status: 'Accepted' });
      
      // Create shipment
      const shipmentId = await getNextSequenceId('shipment');
      const shipment = await supabaseService.shipments.create({
        id: shipmentId,
        quote_id: id,
        customer_id: quote.customer_id,
        status: 'Booking Confirmed',
        origin: quote.quote_requests?.pickup_location || '',
        destination: JSON.stringify(quote.quote_requests?.destination_warehouses || {}),
        estimated_delivery: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      });
      
      return { quote, shipment };
    }
  },

  // Shipment methods
  shipments: {
    async getAll() {
      const { data, error } = await supabase
        .from('shipments')
        .select(`
          *,
          quotes (
            total_cost
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },

    async getByCustomerId(customerId: string) {
      const { data, error } = await supabase
        .from('shipments')
        .select(`
          *,
          quotes (
            total_cost
          )
        `)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },

    async getById(id: string) {
      const { data, error } = await supabase
        .from('shipments')
        .select(`
          *,
          quotes (
            total_cost
          ),
          tracking_events (
            *
          ),
          documents (
            *
          )
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },

    async create(shipment: Partial<Shipment>) {
      const { data, error } = await supabase
        .from('shipments')
        .insert(shipment)
        .select()
        .single();
      
      if (error) throw error;
      
      // Create initial tracking event
      await supabaseService.tracking.create({
        id: `TE-${uuidv4()}`,
        shipment_id: data.id,
        date: new Date().toISOString(),
        status: 'Booking Confirmed',
        location: shipment.origin,
        description: 'Shipment booking has been confirmed'
      });
      
      return data;
    },

    async update(id: string, updates: Partial<Shipment>) {
      const { data, error } = await supabase
        .from('shipments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
  },

  // Tracking events
  tracking: {
    async create(event: any) {
      const { data, error } = await supabase
        .from('tracking_events')
        .insert(event)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    async getByShipmentId(shipmentId: string) {
      const { data, error } = await supabase
        .from('tracking_events')
        .select('*')
        .eq('shipment_id', shipmentId)
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  },

  // Documents
  documents: {
    async create(document: any) {
      const { data, error } = await supabase
        .from('documents')
        .insert({
          ...document,
          id: document.id || `DOC-${uuidv4()}`
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    async getByShipmentId(shipmentId: string) {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('shipment_id', shipmentId)
        .order('uploaded_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },

    async delete(id: string) {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    }
  },

  // Announcements
  announcements: {
    async getActive() {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },

    async getAll() {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },

    async create(announcement: any) {
      const { data, error } = await supabase
        .from('announcements')
        .insert({
          ...announcement,
          id: announcement.id || `ANN-${uuidv4().substring(0, 8).toUpperCase()}`
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    async update(id: string, updates: any) {
      const { data, error } = await supabase
        .from('announcements')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    async delete(id: string) {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    }
  }
};