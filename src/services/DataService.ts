import { supabaseService } from './supabaseService';
import { authService } from './authService';

// Re-export types from supabaseService
export type { QuoteRequest, Quote, Shipment, User } from './supabaseService';

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
    return await supabaseService.quoteRequests.getById(id);
  },

  async getQuoteRequestsByCustomerId(customerId: string) {
    await simulateDelay(400);
    return await supabaseService.quoteRequests.getByCustomerId(customerId);
  },

  async createQuoteRequest(request: any) {
    await simulateDelay(500);
    console.log('Creating quote request:', request);
    
    // Transform data to match database schema
    const transformedRequest = {
      customer_id: request.customerId || request.customer_id,
      service_type: request.serviceType || 'Air Freight',
      pickup_location: request.supplierDetails ? 
        `${request.supplierDetails.name}, ${request.supplierDetails.address}, ${request.supplierDetails.city}, ${request.supplierDetails.country}` : 
        request.pickup_location || '',
      destination_warehouses: request.destinations || request.destination_warehouses || [],
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
    if (customerId) {
      return await supabaseService.quotes.getByCustomerId(customerId);
    }
    return await supabaseService.quotes.getAll();
  },

  async getQuoteById(id: string) {
    await simulateDelay(200);
    return await supabaseService.quotes.getById(id);
  },

  async createQuote(quote: any) {
    await simulateDelay(500);
    return await supabaseService.quotes.create(quote);
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
    if (customerId) {
      return await supabaseService.shipments.getByCustomerId(customerId);
    }
    return await supabaseService.shipments.getAll();
  },

  async getShipmentById(id: string) {
    await simulateDelay(200);
    return await supabaseService.shipments.getById(id);
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
    const result = await supabaseService.quotes.accept(quoteId);
    return result.shipment;
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