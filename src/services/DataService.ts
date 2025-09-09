import { supabaseService } from './supabaseService';
import { authService } from './authService';
import type { QuoteRequest as BaseQuoteRequest, Quote, Shipment, User } from './supabaseService';

// Extended QuoteRequest with additional fields used in the app
export interface QuoteRequest extends BaseQuoteRequest {
  customerId?: string;
  destinations?: DestinationWarehouse[];
  supplierDetails?: {
    name?: string;
    address?: string;
    city?: string;
    country?: string;
    contactName?: string;
    contactPhone?: string;
  };
  cargoDetails?: any;
}

// Re-export other types from supabaseService
export type { Quote, Shipment, User } from './supabaseService';

// Legacy types for backward compatibility
export type CartonDetail = {
  id: string;
  length: number;
  width: number;
  height: number;
  weight: number;
  quantity: number;
};

export type DestinationWarehouse = {
  id: string;
  fbaWarehouse: string;
  amazonShipmentId: string;
  cartons: number;
  weight: number;
  cartonDetails?: CartonDetail[];
};

export type Announcement = {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'error';
  createdBy: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

// Simulate network delay for development
const simulateDelay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

// Data Service using Supabase
export const DataService = {
  // Authentication methods
  authenticateUser: authService.login,
  registerUser: authService.register,
  validateSession: authService.validate,
  logout: authService.logout,

  // User methods
  async getUsers() {
    await simulateDelay(300);
    return await supabaseService.users.getAll();
  },

  async getUserById(id: string) {
    await simulateDelay(200);
    return await supabaseService.users.getById(id);
  },

  async createUser(userData: any) {
    await simulateDelay(400);
    // Hash password before storing if it's provided as plain text
    if (userData.password && !userData.password_hash) {
      const bcrypt = await import('bcryptjs');
      userData.password_hash = await bcrypt.hash(userData.password, 10);
      delete userData.password; // Remove plain text password
    }
    return await supabaseService.users.create(userData);
  },

  async updateUser(id: string, updates: any) {
    await simulateDelay(300);
    return await supabaseService.users.update(id, updates);
  },

  // Quote Request methods
  async getQuoteRequests(customerId?: string) {
    await simulateDelay(400);
    if (customerId) {
      return await supabaseService.quoteRequests.getByCustomerId(customerId);
    }
    return await supabaseService.quoteRequests.getAll();
  },

  async getQuoteRequestById(id: string) {
    await simulateDelay(200);
    const request = await supabaseService.quoteRequests.getById(id);
    if (request) {
      // Extract extended data from destination_warehouses JSONB
      let destinations = [];
      let supplierDetails = null;
      let cargoDetails = null;
      
      if (typeof request.destination_warehouses === 'object' && request.destination_warehouses) {
        if (request.destination_warehouses.destinations) {
          destinations = request.destination_warehouses.destinations;
        } else if (Array.isArray(request.destination_warehouses)) {
          // Old format - just an array of destinations
          destinations = request.destination_warehouses;
        }
        supplierDetails = request.destination_warehouses.supplierDetails || null;
        cargoDetails = request.destination_warehouses.cargoDetails || null;
      }
      
      // Map customer_id to customerId for compatibility
      return {
        ...request,
        customerId: request.customer_id,
        destinations,
        supplierDetails,
        cargoDetails
      };
    }
    return null;
  },

  async getQuoteRequestsByCustomerId(customerId: string) {
    await simulateDelay(400);
    const requests = await supabaseService.quoteRequests.getByCustomerId(customerId);
    
    // Transform each request to extract extended data from JSONB
    return requests.map(request => {
      let destinations = [];
      let supplierDetails = null;
      let cargoDetails = null;
      
      if (typeof request.destination_warehouses === 'object' && request.destination_warehouses) {
        if (request.destination_warehouses.destinations) {
          destinations = request.destination_warehouses.destinations;
        } else if (Array.isArray(request.destination_warehouses)) {
          // Old format - just an array of destinations
          destinations = request.destination_warehouses;
        }
        supplierDetails = request.destination_warehouses.supplierDetails || null;
        cargoDetails = request.destination_warehouses.cargoDetails || null;
      }
      
      // Map database fields to frontend format
      return {
        ...request,
        customerId: request.customer_id,
        requestedDate: request.cargo_ready_date, // Map cargo_ready_date to requestedDate
        destinations,
        supplierDetails,
        cargoDetails
      };
    });
  },

  async createQuoteRequest(request: any) {
    await simulateDelay(500);
    console.log('Creating quote request:', request);
    
    // Store supplierDetails and cargoDetails in destination_warehouses JSONB
    const extendedData = {
      destinations: request.destinations || [],
      supplierDetails: request.supplierDetails || null,
      cargoDetails: request.cargoDetails || null
    };
    
    // Transform data to match database schema
    const transformedRequest = {
      customer_id: request.customerId || request.customer_id,
      service_type: request.serviceType || 'Air Freight',
      pickup_location: request.supplierDetails ? 
        `${request.supplierDetails.name}, ${request.supplierDetails.address}, ${request.supplierDetails.city}, ${request.supplierDetails.country}` : 
        request.pickup_location || '',
      destination_warehouses: extendedData, // Store all extended data in JSONB
      cargo_ready_date: request.requestedDate || request.cargo_ready_date || new Date().toISOString().split('T')[0],
      total_weight: request.cargoDetails?.grossWeight || request.total_weight,
      total_volume: request.cargoDetails?.cbm || request.total_volume,
      total_cartons: request.cargoDetails?.cartonCount || request.total_cartons,
      special_requirements: request.specialRequirements || request.special_requirements || '',
      status: 'Awaiting Quote'
    };

    const result = await supabaseService.quoteRequests.create(transformedRequest);
    console.log('Quote request created:', result);
    return result;
  },

  async updateQuoteRequest(id: string, updates: any) {
    await simulateDelay(300);
    return await supabaseService.quoteRequests.update(id, updates);
  },

  // Quote methods
  async getQuotes(customerId?: string) {
    await simulateDelay(400);
    let quotes;
    if (customerId) {
      quotes = await supabaseService.quotes.getByCustomerId(customerId);
    } else {
      quotes = await supabaseService.quotes.getAll();
    }
    
    // Transform quotes to match expected frontend format
    return quotes.map(quote => ({
      ...quote,
      requestId: quote.request_id, // Map request_id to requestId
      customerId: quote.customer_id, // Map customer_id to customerId
      staffId: quote.staff_id, // Map staff_id to staffId
      total: quote.total_cost // Map total_cost to total for backwards compatibility
    }));
  },

  async getQuoteById(id: string) {
    await simulateDelay(200);
    return await supabaseService.quotes.getById(id);
  },

  async createQuote(quote: any) {
    await simulateDelay(500);
    console.log('Creating quote for request:', quote.requestId);
    console.log('Quote request customerId:', quote.customerId);
    console.log('Quote object being created:', quote);
    
    // Get current user from localStorage to set staff_id
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    // Transform the quote data to match Supabase schema
    const transformedQuote = {
      request_id: quote.requestId,
      customer_id: quote.customerId,
      staff_id: currentUser.id || 'staff-1',
      status: quote.status || 'Pending',
      rate_type: quote.rateType || 'per-kg',
      freight_cost: quote.subtotal || 0,
      insurance_cost: 0,
      additional_charges: {
        otherCharges: quote.otherCharges || [],
        discounts: quote.discounts || []
      },
      total_cost: quote.total || 0,
      valid_until: quote.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      per_warehouse_costs: quote.warehouseRates || [],
      commission_rate_per_kg: quote.warehouseRates?.[0]?.ratePerKg || 0,
      notes: quote.notes || ''
    };
    
    try {
      const result = await supabaseService.quotes.create(transformedQuote);
      console.log('Quote created successfully:', result);
      return result;
    } catch (error) {
      console.error('Failed to create quote:', error);
      throw error;
    }
  },

  async updateQuote(id: string, updates: any) {
    await simulateDelay(300);
    return await supabaseService.quotes.update(id, updates);
  },

  async acceptQuote(id: string) {
    await simulateDelay(600);
    return await supabaseService.quotes.accept(id);
  },

  // Shipment methods
  async getShipments(customerId?: string) {
    await simulateDelay(400);
    let shipments;
    if (customerId) {
      shipments = await supabaseService.shipments.getByCustomerId(customerId);
    } else {
      shipments = await supabaseService.shipments.getAll();
    }
    
    // Transform shipments to match expected frontend format
    return shipments.map(shipment => {
      // Parse destination data
      let destinations = [];
      if (shipment.destination) {
        try {
          const parsed = typeof shipment.destination === 'string' 
            ? JSON.parse(shipment.destination) 
            : shipment.destination;
          
          if (parsed.destinations && Array.isArray(parsed.destinations)) {
            destinations = parsed.destinations;
          } else if (Array.isArray(parsed)) {
            destinations = parsed;
          }
        } catch (e) {
          console.log('Could not parse destination:', shipment.destination);
        }
      }
      
      // Parse cargo_details if it exists
      let cargoDetails = null;
      if (shipment.cargo_details) {
        try {
          cargoDetails = typeof shipment.cargo_details === 'string'
            ? JSON.parse(shipment.cargo_details)
            : shipment.cargo_details;
        } catch (e) {
          cargoDetails = shipment.cargo_details;
        }
      }
      
      return {
        ...shipment,
        shipmentId: shipment.id,
        customerId: shipment.customer_id,
        quoteId: shipment.quote_id,
        destinations: destinations,
        cargoDetails: cargoDetails,
        estimatedTotal: shipment.quotes?.total_cost || 0,
        invoice: shipment.invoice || null // Only show invoice if explicitly created
      };
    });
  },

  async getShipmentById(id: string) {
    await simulateDelay(200);
    const shipment = await supabaseService.shipments.getById(id);
    
    if (!shipment) return null;
    
    // Parse destination data
    let destinations = [];
    if (shipment.destination) {
      try {
        const parsed = typeof shipment.destination === 'string' 
          ? JSON.parse(shipment.destination) 
          : shipment.destination;
        
        if (parsed.destinations && Array.isArray(parsed.destinations)) {
          destinations = parsed.destinations;
        } else if (Array.isArray(parsed)) {
          destinations = parsed;
        }
      } catch (e) {
        console.log('Could not parse destination:', shipment.destination);
      }
    }
    
    // Transform to match frontend format
    return {
      ...shipment,
      shipmentId: shipment.id,
      customerId: shipment.customer_id,
      quoteId: shipment.quote_id,
      destinations: destinations,
      estimatedTotal: shipment.quotes?.total_cost || 0,
      invoice: shipment.invoice || null // Only show invoice if explicitly created
    };
  },

  async createShipment(shipment: any) {
    await simulateDelay(500);
    return await supabaseService.shipments.create(shipment);
  },

  async updateShipment(id: string, updates: any) {
    await simulateDelay(300);
    return await supabaseService.shipments.update(id, updates);
  },

  // Tracking methods
  async addTrackingEvent(shipmentId: string, event: any) {
    await simulateDelay(300);
    return await supabaseService.tracking.create({
      ...event,
      shipment_id: shipmentId
    });
  },

  async getTrackingEvents(shipmentId: string) {
    await simulateDelay(200);
    return await supabaseService.tracking.getByShipmentId(shipmentId);
  },

  // Document methods
  async addDocument(shipmentId: string, document: any) {
    await simulateDelay(300);
    return await supabaseService.documents.create({
      ...document,
      shipment_id: shipmentId
    });
  },

  async getDocuments(shipmentId: string) {
    await simulateDelay(200);
    return await supabaseService.documents.getByShipmentId(shipmentId);
  },

  async deleteDocument(documentId: string) {
    await simulateDelay(300);
    return await supabaseService.documents.delete(documentId);
  },

  // Announcement methods
  async getAnnouncements() {
    await simulateDelay(200);
    return await supabaseService.announcements.getActive();
  },

  async getAllAnnouncements() {
    await simulateDelay(200);
    return await supabaseService.announcements.getAll();
  },

  async createAnnouncement(announcement: any) {
    await simulateDelay(300);
    return await supabaseService.announcements.create(announcement);
  },

  async updateAnnouncement(id: string, updates: any) {
    await simulateDelay(300);
    return await supabaseService.announcements.update(id, updates);
  },

  async deleteAnnouncement(id: string) {
    await simulateDelay(300);
    return await supabaseService.announcements.delete(id);
  },

  // Convert quote to shipment method
  async convertQuoteToShipment(quoteId: string) {
    await simulateDelay(600);
    try {
      console.log('Converting quote to shipment:', quoteId);
      const result = await supabaseService.quotes.accept(quoteId);
      console.log('Quote acceptance result:', result);
      
      if (result && result.shipment) {
        // Transform shipment data to match frontend format
        const transformedShipment = {
          ...result.shipment,
          shipmentId: result.shipment.id,
          customerId: result.shipment.customer_id,
          quoteId: result.shipment.quote_id
        };
        return transformedShipment;
      }
      return result?.shipment;
    } catch (error) {
      console.error('Failed to convert quote to shipment:', error);
      throw error;
    }
  },

  // Legacy methods for backward compatibility
  async addQuoteRequest(request: any) {
    return this.createQuoteRequest(request);
  },

  async updateQuoteRequestStatus(id: string, status: string) {
    return this.updateQuoteRequest(id, { status });
  },

  async getQuotesByCustomer(customerId: string) {
    return this.getQuotes(customerId);
  },

  async getQuotesByCustomerId(customerId: string) {
    return this.getQuotes(customerId);
  },

  async getShipmentsByCustomer(customerId: string) {
    return this.getShipments(customerId);
  },

  // ID generation methods (keep for compatibility)
  generateQuoteId: () => `Q-${Date.now().toString().slice(-5)}`,
  generateShipmentId: () => `FS-${Date.now().toString().slice(-5)}`
};