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
  rate_type?: string;
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
async function getNextSequenceId(type: 'quote' | 'shipment' | 'quote_request'): Promise<string> {
  const { data, error } = await supabase.rpc('increment_sequence', { seq_type: type });
  
  if (error || !data) {
    // Fallback to timestamp-based ID
    const timestamp = Date.now().toString().slice(-5);
    if (type === 'quote') return `Q-${timestamp}`;
    if (type === 'shipment') return `FS-${timestamp}`;
    return `QR-${timestamp}`;
  }
  
  const paddedNumber = data.toString().padStart(5, '0');
  if (type === 'quote') return `Q-${paddedNumber}`;
  if (type === 'shipment') return `FS-${paddedNumber}`;
  return `QR-${paddedNumber}`;
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
      // Validate ID before making the request
      if (!id || id === 'undefined' || id === 'null') {
        console.warn('Invalid quote request ID provided:', id);
        return null;
      }
      
      const { data, error } = await supabase
        .from('quote_requests')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },

    async create(request: Partial<QuoteRequest>) {
      // Generate sequential ID
      const requestId = await getNextSequenceId('quote_request');
      
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
      // Validate ID before making the request
      if (!id || id === 'undefined' || id === 'null') {
        console.warn('Invalid quote ID provided:', id);
        return null;
      }
      
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
      
      // Ensure all required fields are present and properly formatted
      const newQuote = {
        id: quoteId,
        request_id: quote.request_id,
        customer_id: quote.customer_id,
        staff_id: quote.staff_id || null,
        rate_type: quote.rate_type || 'per-kg',
        freight_cost: quote.freight_cost || 0,
        insurance_cost: quote.insurance_cost || 0,
        additional_charges: quote.additional_charges || null,
        total_cost: quote.total_cost || 0,
        valid_until: quote.valid_until || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: quote.status || 'Pending',
        per_warehouse_costs: quote.per_warehouse_costs || null,
        commission_rate_per_kg: quote.commission_rate_per_kg || null,
        notes: quote.notes || null
      };

      console.log('Supabase quote insert:', newQuote);

      const { data, error } = await supabase
        .from('quotes')
        .insert(newQuote)
        .select()
        .single();
      
      if (error) {
        console.error('Supabase quote creation error:', error);
        throw error;
      }
      
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
      // Get quote details with request information
      const quote = await this.getById(id);
      if (!quote) throw new Error('Quote not found');
      
      console.log('Accepting quote:', quote);
      
      // Check if already accepted
      if (quote.status === 'Accepted') {
        console.log('Quote already accepted, checking for existing shipment');
        // Check if shipment already exists
        const existingShipments = await supabaseService.shipments.getByQuoteId(id);
        if (existingShipments && existingShipments.length > 0) {
          console.log('Shipment already exists for this quote');
          return { quote, shipment: existingShipments[0] };
        }
      }
      
      // Update quote status
      await this.update(id, { status: 'Accepted' });
      
      // Get the quote request details if not already loaded
      let quoteRequest = quote.quote_requests;
      if (!quoteRequest && quote.request_id) {
        quoteRequest = await supabaseService.quoteRequests.getById(quote.request_id);
      }
      
      // Generate unique shipment ID with timestamp to avoid duplicates
      const timestamp = Date.now().toString().slice(-5);
      const shipmentId = `FS-${timestamp}`;
      
      // Prepare destination data
      let destinationData = '';
      if (quoteRequest) {
        if (quoteRequest.destination_warehouses) {
          destinationData = typeof quoteRequest.destination_warehouses === 'string' 
            ? quoteRequest.destination_warehouses 
            : JSON.stringify(quoteRequest.destination_warehouses);
        }
      }
      
      const shipmentData = {
        id: shipmentId,
        quote_id: id,
        customer_id: quote.customer_id,
        status: 'Booking Confirmed',
        origin: quoteRequest?.pickup_location || 'Unknown Origin',
        destination: destinationData || 'Unknown Destination',
        estimated_delivery: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        cargo_details: quoteRequest?.destination_warehouses || null
      };
      
      console.log('Creating shipment with data:', shipmentData);
      const shipment = await supabaseService.shipments.create(shipmentData);
      
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
      // Validate ID before making the request
      if (!id || id === 'undefined' || id === 'null') {
        console.warn('Invalid shipment ID provided:', id);
        return null;
      }
      
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

    async getByQuoteId(quoteId: string) {
      const { data, error } = await supabase
        .from('shipments')
        .select('*')
        .eq('quote_id', quoteId);
      
      if (error) throw error;
      return data;
    },

    async create(shipment: Partial<Shipment>) {
      console.log('Creating shipment in database:', shipment);
      
      const { data, error } = await supabase
        .from('shipments')
        .insert(shipment)
        .select()
        .single();
      
      if (error) {
        console.error('Failed to create shipment:', error);
        throw error;
      }
      
      console.log('Shipment created successfully:', data);
      
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