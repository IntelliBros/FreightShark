/**
 * Supabase-backed Data Service
 * This service replaces localStorage with Supabase database for all data operations
 * localStorage is only used for caching to improve performance
 */

import { supabase } from '../lib/supabase';
import { notificationService } from './NotificationService';

export interface User {
  id: string;
  name: string;
  email: string;
  company: string;
  role: 'admin' | 'user' | 'staff';
  amazonSellerId?: string;
  einTaxId?: string;
  staffPosition?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface QuoteRequest {
  id: string;
  customerId: string;
  serviceType: string;
  pickupLocation: string;
  destinationWarehouses: Array<{
    id: string;
    name: string;
    address: string;
    cartons: number;
    weight: number;
    volume: number;
  }>;
  cargoReadyDate: string;
  totalWeight: number;
  totalVolume: number;
  totalCartons: number;
  specialRequirements?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Quote {
  id: string;
  requestId: string;
  customerId: string;
  staffId?: string;
  freightCost: number;
  insuranceCost: number;
  additionalCharges: Array<{
    description: string;
    amount: number;
  }>;
  totalAmount: number;
  validUntil: string;
  status: 'Pending' | 'Accepted' | 'Rejected' | 'Expired';
  perWarehouseCosts?: Array<{
    warehouseId: string;
    name: string;
    rate: number;
    cartons: number;
    weight: number;
    cost: number;
  }>;
  commissionRatePerKg?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Shipment {
  id: string;
  quoteId: string;
  customerId: string;
  status: string;
  origin: string;
  destination: string;
  cargoDetails: any;
  estimatedWeight: number;
  actualWeight?: number;
  estimatedDelivery?: string;
  actualDelivery?: string;
  trackingNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  shipmentId: string;
  customerId: string;
  invoiceNumber: string;
  amount: number;
  status: 'Pending' | 'Paid' | 'Overdue' | 'Cancelled';
  dueDate: string;
  paidDate?: string;
  paymentMethod?: string;
  paymentReference?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrackingEvent {
  id: string;
  shipmentId: string;
  date: string;
  status: string;
  location: string;
  description: string;
  createdAt: string;
}

export interface Document {
  id: string;
  shipmentId: string;
  name: string;
  type: string;
  url: string;
  uploadedBy: string;
  uploadedAt: string;
}

class SupabaseDataService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private CACHE_DURATION = 5000; // 5 seconds cache

  // Helper function to get cached data
  private getCached<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data as T;
    }
    return null;
  }

  // Helper function to set cache
  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
    // Also store in localStorage for offline support
    try {
      localStorage.setItem(`cache_${key}`, JSON.stringify({ data, timestamp: Date.now() }));
    } catch (error: any) {
      // If quota exceeded, try to clear old cache and retry
      if (error.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded, clearing old cache...');
        this.clearOldCache();
        try {
          // Try one more time after clearing
          localStorage.setItem(`cache_${key}`, JSON.stringify({ data, timestamp: Date.now() }));
        } catch (retryError) {
          console.warn('Failed to cache even after clearing:', retryError);
        }
      } else {
        console.warn('Failed to cache in localStorage:', error);
      }
    }
  }

  // Helper function to clear old cache entries
  private clearOldCache(): void {
    const cacheKeys = Object.keys(localStorage).filter(k => k.startsWith('cache_'));

    // Clear ALL cache entries when quota is exceeded
    // This ensures we have maximum space available
    console.log(`Clearing ${cacheKeys.length} cache entries to free up space...`);
    for (const key of cacheKeys) {
      localStorage.removeItem(key);
    }

    // Also clear any other large data that might be taking up space
    const keysToCheck = ['notifications_', 'last_checked_', 'quoteRequests', 'quotes', 'shipments'];
    for (const prefix of keysToCheck) {
      const keys = Object.keys(localStorage).filter(k => k.includes(prefix));
      for (const key of keys) {
        try {
          const item = localStorage.getItem(key);
          if (item && item.length > 10000) { // Remove large items over 10KB
            localStorage.removeItem(key);
            console.log(`Removed large item: ${key} (${item.length} bytes)`);
          }
        } catch (e) {
          // Ignore errors
        }
      }
    }
  }

  // Helper function to convert snake_case to camelCase
  private toCamelCase(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(item => this.toCamelCase(item));
    } else if (obj !== null && typeof obj === 'object') {
      return Object.keys(obj).reduce((result, key) => {
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        result[camelKey] = this.toCamelCase(obj[key]);
        return result;
      }, {} as any);
    }
    return obj;
  }

  // Helper function to convert camelCase to snake_case
  private toSnakeCase(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(item => this.toSnakeCase(item));
    } else if (obj !== null && typeof obj === 'object') {
      return Object.keys(obj).reduce((result, key) => {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        result[snakeKey] = this.toSnakeCase(obj[key]);
        return result;
      }, {} as any);
    }
    return obj;
  }

  // User methods
  async getAllUsers(): Promise<User[]> {
    const cached = this.getCached<User[]>('users');
    if (cached) return cached;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const users = this.toCamelCase(data) as User[];
      this.setCache('users', users);
      return users;
    } catch (error) {
      console.error('Error fetching users:', error);
      // Fall back to localStorage cache if available
      const cached = localStorage.getItem('cache_users');
      if (cached) {
        const { data } = JSON.parse(cached);
        return data;
      }
      return [];
    }
  }

  async getUserById(id: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return this.toCamelCase(data) as User;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }

  async createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    try {
      const { data: idData } = await supabase
        .rpc('get_next_id', { entity_type: 'user', prefix: 'USER' });

      const newUser = {
        ...this.toSnakeCase(user),
        id: idData || `USER-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('users')
        .insert(newUser)
        .select()
        .single();

      if (error) throw error;

      // Clear cache
      this.cache.delete('users');

      return this.toCamelCase(data) as User;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Quote Request methods
  async getAllQuoteRequests(): Promise<QuoteRequest[]> {
    const cached = this.getCached<QuoteRequest[]>('quoteRequests');
    if (cached) return cached;

    try {
      const { data, error } = await supabase
        .from('quote_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const requests = this.toCamelCase(data) as QuoteRequest[];
      this.setCache('quoteRequests', requests);
      return requests;
    } catch (error) {
      console.error('Error fetching quote requests:', error);
      const cached = localStorage.getItem('cache_quoteRequests');
      if (cached) {
        const { data } = JSON.parse(cached);
        return data;
      }
      return [];
    }
  }

  async getQuoteRequestsByCustomer(customerId: string): Promise<QuoteRequest[]> {
    try {
      const { data, error } = await supabase
        .from('quote_requests')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return this.toCamelCase(data) as QuoteRequest[];
    } catch (error) {
      console.error('Error fetching customer quote requests:', error);
      return [];
    }
  }

  async createQuoteRequest(request: Omit<QuoteRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<QuoteRequest> {
    try {
      const { data: idData } = await supabase
        .rpc('get_next_id', { entity_type: 'quote', prefix: 'Q' });

      const newRequest = {
        ...this.toSnakeCase(request),
        id: idData || `Q-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('quote_requests')
        .insert(newRequest)
        .select()
        .single();

      if (error) throw error;

      // Clear cache
      this.cache.delete('quoteRequests');

      // Send notification
      const customer = await this.getUserById(request.customerId);
      if (customer) {
        await notificationService.notifyQuoteRequested(
          this.toCamelCase(data) as QuoteRequest,
          customer
        );
      }

      return this.toCamelCase(data) as QuoteRequest;
    } catch (error) {
      console.error('Error creating quote request:', error);
      throw error;
    }
  }

  async updateQuoteRequestStatus(id: string, status: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('quote_requests')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      // Clear cache
      this.cache.delete('quoteRequests');
    } catch (error) {
      console.error('Error updating quote request status:', error);
      throw error;
    }
  }

  // Quote methods
  async getAllQuotes(): Promise<Quote[]> {
    const cached = this.getCached<Quote[]>('quotes');
    if (cached) return cached;

    try {
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const quotes = this.toCamelCase(data) as Quote[];
      this.setCache('quotes', quotes);
      return quotes;
    } catch (error) {
      console.error('Error fetching quotes:', error);
      const cached = localStorage.getItem('cache_quotes');
      if (cached) {
        const { data } = JSON.parse(cached);
        return data;
      }
      return [];
    }
  }

  async getQuotesByCustomer(customerId: string): Promise<Quote[]> {
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return this.toCamelCase(data) as Quote[];
    } catch (error) {
      console.error('Error fetching customer quotes:', error);
      return [];
    }
  }

  async createQuote(quote: Omit<Quote, 'id' | 'createdAt' | 'updatedAt'>): Promise<Quote> {
    try {
      const newQuote = {
        ...this.toSnakeCase(quote),
        id: quote.requestId, // Use same ID as request for simplicity
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('quotes')
        .insert(newQuote)
        .select()
        .single();

      if (error) throw error;

      // Clear cache
      this.cache.delete('quotes');

      // Send notification
      const customer = await this.getUserById(quote.customerId);
      if (customer) {
        await notificationService.notifyQuoteReady(
          this.toCamelCase(data) as Quote,
          customer
        );
      }

      return this.toCamelCase(data) as Quote;
    } catch (error) {
      console.error('Error creating quote:', error);
      throw error;
    }
  }

  async updateQuoteStatus(id: string, status: Quote['status']): Promise<void> {
    try {
      const { error } = await supabase
        .from('quotes')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      // Clear cache
      this.cache.delete('quotes');
    } catch (error) {
      console.error('Error updating quote status:', error);
      throw error;
    }
  }

  // Shipment methods
  async getAllShipments(): Promise<Shipment[]> {
    const cached = this.getCached<Shipment[]>('shipments');
    if (cached) return cached;

    try {
      const { data, error } = await supabase
        .from('shipments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const shipments = this.toCamelCase(data) as Shipment[];
      this.setCache('shipments', shipments);
      return shipments;
    } catch (error) {
      console.error('Error fetching shipments:', error);
      const cached = localStorage.getItem('cache_shipments');
      if (cached) {
        const { data } = JSON.parse(cached);
        return data;
      }
      return [];
    }
  }

  async getShipmentsByCustomer(customerId: string): Promise<Shipment[]> {
    try {
      const { data, error } = await supabase
        .from('shipments')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return this.toCamelCase(data) as Shipment[];
    } catch (error) {
      console.error('Error fetching customer shipments:', error);
      return [];
    }
  }

  async createShipmentFromQuote(quote: Quote): Promise<Shipment> {
    try {
      const { data: idData } = await supabase
        .rpc('get_next_id', { entity_type: 'shipment', prefix: 'FS' });

      const newShipment = {
        id: idData || `FS-${Date.now()}`,
        quote_id: quote.id,
        customer_id: quote.customerId,
        status: 'Created',
        origin: 'China',
        destination: 'USA',
        cargo_details: {},
        estimated_weight: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('shipments')
        .insert(newShipment)
        .select()
        .single();

      if (error) throw error;

      // Clear cache
      this.cache.delete('shipments');

      return this.toCamelCase(data) as Shipment;
    } catch (error) {
      console.error('Error creating shipment:', error);
      throw error;
    }
  }

  async updateShipmentStatus(id: string, status: string, trackingInfo?: string): Promise<void> {
    try {
      const updates: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (trackingInfo) {
        updates.tracking_number = trackingInfo;
      }

      const { error } = await supabase
        .from('shipments')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      // Clear cache
      this.cache.delete('shipments');

      // Send notification
      const { data: shipment } = await supabase
        .from('shipments')
        .select('*')
        .eq('id', id)
        .single();

      if (shipment) {
        const customer = await this.getUserById(shipment.customer_id);
        if (customer) {
          await notificationService.notifyShipmentUpdate(
            this.toCamelCase(shipment) as Shipment,
            customer,
            trackingInfo
          );
        }
      }
    } catch (error) {
      console.error('Error updating shipment status:', error);
      throw error;
    }
  }

  // Invoice methods
  async getAllInvoices(): Promise<Invoice[]> {
    const cached = this.getCached<Invoice[]>('invoices');
    if (cached) return cached;

    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const invoices = this.toCamelCase(data) as Invoice[];
      this.setCache('invoices', invoices);
      return invoices;
    } catch (error) {
      console.error('Error fetching invoices:', error);
      const cached = localStorage.getItem('cache_invoices');
      if (cached) {
        const { data } = JSON.parse(cached);
        return data;
      }
      return [];
    }
  }

  async createInvoice(invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<Invoice> {
    try {
      const { data: idData } = await supabase
        .rpc('get_next_id', { entity_type: 'invoice', prefix: 'INV' });

      const newInvoice = {
        ...this.toSnakeCase(invoice),
        id: idData || `INV-${Date.now()}`,
        invoice_number: idData || `INV-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('invoices')
        .insert(newInvoice)
        .select()
        .single();

      if (error) throw error;

      // Clear cache
      this.cache.delete('invoices');

      // Send notification
      const { data: shipment } = await supabase
        .from('shipments')
        .select('*')
        .eq('id', invoice.shipmentId)
        .single();

      const customer = await this.getUserById(invoice.customerId);
      if (customer && shipment) {
        await notificationService.notifyInvoiceGenerated(
          this.toCamelCase(data) as Invoice,
          this.toCamelCase(shipment) as Shipment,
          customer
        );
      }

      return this.toCamelCase(data) as Invoice;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  }

  async updateInvoiceStatus(id: string, status: Invoice['status'], paymentDetails?: {
    paidDate: string;
    paymentMethod: string;
    paymentReference: string;
  }): Promise<void> {
    try {
      const updates: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (paymentDetails) {
        updates.paid_date = paymentDetails.paidDate;
        updates.payment_method = paymentDetails.paymentMethod;
        updates.payment_reference = paymentDetails.paymentReference;
      }

      const { error } = await supabase
        .from('invoices')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      // Clear cache
      this.cache.delete('invoices');

      // Send payment notification if paid
      if (status === 'Paid' && paymentDetails) {
        const { data: invoice } = await supabase
          .from('invoices')
          .select('*')
          .eq('id', id)
          .single();

        if (invoice) {
          const customer = await this.getUserById(invoice.customer_id);
          if (customer) {
            await notificationService.notifyPaymentReceived(
              this.toCamelCase(invoice) as Invoice,
              customer,
              {
                amount: `$${invoice.amount}`,
                date: paymentDetails.paidDate,
                reference: paymentDetails.paymentReference
              }
            );
          }
        }
      }
    } catch (error) {
      console.error('Error updating invoice status:', error);
      throw error;
    }
  }

  // Tracking methods
  async addTrackingEvent(event: Omit<TrackingEvent, 'id' | 'createdAt'>): Promise<TrackingEvent> {
    try {
      const newEvent = {
        ...this.toSnakeCase(event),
        id: `TRK-${Date.now()}`,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('tracking_events')
        .insert(newEvent)
        .select()
        .single();

      if (error) throw error;

      return this.toCamelCase(data) as TrackingEvent;
    } catch (error) {
      console.error('Error adding tracking event:', error);
      throw error;
    }
  }

  async getTrackingEvents(shipmentId: string): Promise<TrackingEvent[]> {
    try {
      const { data, error } = await supabase
        .from('tracking_events')
        .select('*')
        .eq('shipment_id', shipmentId)
        .order('date', { ascending: false });

      if (error) throw error;
      return this.toCamelCase(data) as TrackingEvent[];
    } catch (error) {
      console.error('Error fetching tracking events:', error);
      return [];
    }
  }

  // Document methods
  async uploadDocument(document: Omit<Document, 'id' | 'uploadedAt'>): Promise<Document> {
    try {
      const newDocument = {
        ...this.toSnakeCase(document),
        id: `DOC-${Date.now()}`,
        uploaded_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('documents')
        .insert(newDocument)
        .select()
        .single();

      if (error) throw error;

      return this.toCamelCase(data) as Document;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  }

  async getDocuments(shipmentId: string): Promise<Document[]> {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('shipment_id', shipmentId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return this.toCamelCase(data) as Document[];
    } catch (error) {
      console.error('Error fetching documents:', error);
      return [];
    }
  }

  async deleteDocument(documentId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  // Clear all caches
  clearCache(): void {
    this.cache.clear();
    // Clear localStorage cache
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('cache_')) {
        localStorage.removeItem(key);
      }
    });
  }

  // Refresh specific data
  async refreshData(dataType: string): Promise<void> {
    this.cache.delete(dataType);
    localStorage.removeItem(`cache_${dataType}`);

    // Pre-fetch to warm the cache
    switch(dataType) {
      case 'users':
        await this.getAllUsers();
        break;
      case 'quoteRequests':
        await this.getAllQuoteRequests();
        break;
      case 'quotes':
        await this.getAllQuotes();
        break;
      case 'shipments':
        await this.getAllShipments();
        break;
      case 'invoices':
        await this.getAllInvoices();
        break;
    }
  }
}

export const supabaseDataService = new SupabaseDataService();
export default supabaseDataService;