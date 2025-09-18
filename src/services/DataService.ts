import { supabaseService } from './supabaseService';
import { authService } from './authService';
import { emailService } from './EmailService';
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

// Remove all artificial delays for production
const simulateDelay = (ms: number = 0) => Promise.resolve();

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
    
    try {
      const newUser = await supabaseService.users.create(userData);
      
      // Send welcome email to new user
      if (newUser && newUser.email) {
        try {
          await emailService.sendNotification(
            newUser.email,
            'welcome',
            {
              customerName: newUser.name || 'Valued Customer'
            }
          );
          console.log(`Welcome email sent to ${newUser.email}`);
        } catch (error) {
          console.error('Failed to send welcome email:', error);
          // Don't fail user creation if email fails
        }
      }
      
      return newUser;
    } catch (error: any) {
      // Handle duplicate user error (409 Conflict)
      if (error.message?.includes('duplicate') || error.code === '23505' || error.status === 409) {
        throw new Error('An account with this email already exists. Please login or use a different email.');
      }
      throw error;
    }
  },

  async updateUser(id: string, updates: any) {
    await simulateDelay(300);
    return await supabaseService.users.update(id, updates);
  },

  // Quote Request methods
  async getQuoteRequests(customerId?: string) {
    await simulateDelay(400);
    let requests;
    if (customerId) {
      requests = await supabaseService.quoteRequests.getByCustomerId(customerId);
    } else {
      requests = await supabaseService.quoteRequests.getAll();
    }
    
    // Get all users to map customer details
    const users = await supabaseService.users.getAll();
    const userMap = new Map(users.map(u => [u.id, u]));
    
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
      
      // Get customer details
      const customer = userMap.get(request.customer_id);
      
      // Map database fields to frontend format
      return {
        ...request,
        id: request.id,
        customerId: request.customer_id,
        customer: customer ? { 
          id: customer.id,
          name: customer.name,
          company: customer.company,
          email: customer.email
        } : null,
        requestedDate: request.cargo_ready_date || request.created_at, // Map cargo_ready_date to requestedDate
        dueBy: request.cargo_ready_date ? 
          new Date(new Date(request.cargo_ready_date).getTime() + 3 * 24 * 60 * 60 * 1000).toISOString() : // Add 3 days for due date
          new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        destinations,
        supplierDetails,
        cargoDetails: cargoDetails || {
          cartonCount: request.total_cartons || 0,
          grossWeight: request.total_weight || 0,
          cbm: request.total_volume || 0
        },
        status: request.status || 'Awaiting Quote'
      };
    });
  },

  async getQuoteRequestById(id: string) {
    const startTime = Date.now();
    console.log('getQuoteRequestById START:', id, new Date().toISOString());
    await simulateDelay(200);
    console.log('About to fetch quote request after:', Date.now() - startTime, 'ms');
    const request = await supabaseService.quoteRequests.getById(id);
    console.log('Quote request fetched after:', Date.now() - startTime, 'ms');
    if (request) {
      // Skip fetching customer details - not needed and causing 20-second delay
      // console.log('About to fetch customer after:', Date.now() - startTime, 'ms');
      // const customer = await supabaseService.users.getById(request.customer_id);
      // console.log('Customer fetched after:', Date.now() - startTime, 'ms');
      const customer = null; // We don't actually use this in the response
      
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
      
      // Map database fields to frontend format
      return {
        ...request,
        id: request.id,
        customerId: request.customer_id,
        customer: customer ? { 
          id: customer.id,
          name: customer.name,
          company: customer.company,
          email: customer.email
        } : null,
        requestedDate: request.cargo_ready_date || request.created_at,
        dueBy: request.cargo_ready_date ? 
          new Date(new Date(request.cargo_ready_date).getTime() + 3 * 24 * 60 * 60 * 1000).toISOString() :
          new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        destinations,
        supplierDetails,
        cargoDetails: cargoDetails || {
          cartonCount: request.total_cartons || 0,
          grossWeight: request.total_weight || 0,
          cbm: request.total_volume || 0
        },
        status: request.status || 'Awaiting Quote'
      };
    }
    return null;
  },

  async getQuoteRequestsByCustomerId(customerId: string) {
    await simulateDelay(400);
    const requests = await supabaseService.quoteRequests.getByCustomerId(customerId);
    
    // Get customer details
    const customer = await supabaseService.users.getById(customerId);
    
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
        id: request.id,
        customerId: request.customer_id,
        customer: customer ? { 
          id: customer.id,
          name: customer.name,
          company: customer.company,
          email: customer.email
        } : null,
        requestedDate: request.cargo_ready_date || request.created_at,
        dueBy: request.cargo_ready_date ? 
          new Date(new Date(request.cargo_ready_date).getTime() + 3 * 24 * 60 * 60 * 1000).toISOString() :
          new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        destinations,
        supplierDetails,
        cargoDetails: cargoDetails || {
          cartonCount: request.total_cartons || 0,
          grossWeight: request.total_weight || 0,
          cbm: request.total_volume || 0
        },
        status: request.status || 'Awaiting Quote'
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
    
    // Send email notification if SMTP is configured
    try {
      const currentUser = await authService.getCurrentUser();
      if (currentUser?.email) {
        await emailService.sendNotification(
          currentUser.email,
          'quote-requested',
          {
            quoteId: result.id,
            customerName: currentUser.name || 'Customer'
          }
        );
      }
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
      // Don't fail the request if email fails
    }
    
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
      total: quote.total_cost, // Map total_cost to total for backwards compatibility
      commissionRatePerKg: quote.commission_rate_per_kg || 0.50, // Include commission rate
      warehouseRates: quote.per_warehouse_costs || [], // Map per_warehouse_costs to warehouseRates
      otherCharges: quote.additional_charges?.otherCharges || [],
      discounts: quote.additional_charges?.discounts || []
    }));
  },

  async getQuoteById(id: string) {
    await simulateDelay(200);
    const quote = await supabaseService.quotes.getById(id);
    if (!quote) return null;
    
    // Transform quote to match expected frontend format
    return {
      ...quote,
      requestId: quote.request_id, // Map request_id to requestId
      customerId: quote.customer_id, // Map customer_id to customerId
      staffId: quote.staff_id, // Map staff_id to staffId
      total: quote.total_cost, // Map total_cost to total for backwards compatibility
      commissionRatePerKg: quote.commission_rate_per_kg || 0.50, // Include commission rate
      warehouseRates: quote.per_warehouse_costs || [], // Ensure warehouseRates exists
      otherCharges: quote.additional_charges?.otherCharges || [],
      discounts: quote.additional_charges?.discounts || []
    };
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
      commission_rate_per_kg: quote.commissionRatePerKg || 0.50,
      notes: quote.notes || ''
    };
    
    try {
      const result = await supabaseService.quotes.create(transformedQuote);
      console.log('Quote created successfully:', result);
      
      // Send email notification to customer if SMTP is configured
      try {
        // Get customer details
        const customer = await supabaseService.users.getById(quote.customerId);
        if (customer?.email) {
          await emailService.sendNotification(
            customer.email,
            'quote-ready',
            {
              quoteId: result.id,
              customerName: customer.name || 'Customer',
              amount: `$${quote.total.toFixed(2)}`
            }
          );
        }
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
        // Don't fail the quote creation if email fails
      }
      
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
      // Parse destination data - now includes invoice, masterCargo, and documents
      let destinations = [];
      let invoice = null;
      let masterCargo = shipment.master_cargo || {};
      let documents = [];

      if (shipment.destination) {
        try {
          const parsed = typeof shipment.destination === 'string'
            ? JSON.parse(shipment.destination)
            : shipment.destination;

          // Extract destinations
          if (parsed.destinations && Array.isArray(parsed.destinations)) {
            destinations = parsed.destinations;
          } else if (Array.isArray(parsed)) {
            destinations = parsed;
          }

          // Extract invoice if it exists
          if (parsed.invoice) {
            invoice = parsed.invoice;
          }

          // Extract masterCargo with actual values if it exists
          if (parsed.masterCargo) {
            masterCargo = { ...masterCargo, ...parsed.masterCargo };
          }

          // Extract documents if they exist
          if (parsed.documents && Array.isArray(parsed.documents)) {
            documents = parsed.documents;
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
        masterCargo: masterCargo,
        cargoDetails: cargoDetails,
        estimatedTotal: shipment.quotes?.total_cost || 0,
        invoice: invoice, // Use extracted invoice from destination field
        documents: documents, // Use extracted documents from destination field
        createdAt: shipment.created_at || shipment.createdAt // Map created_at to createdAt
      };
    });
  },

  async getShipmentById(id: string) {
    const startTime = Date.now();
    console.log('DataService.getShipmentById START:', id, new Date().toISOString());
    await simulateDelay(200);
    
    try {
      console.log('About to call supabaseService.shipments.getById at:', Date.now() - startTime, 'ms');
      const shipment = await supabaseService.shipments.getById(id);
      console.log('DataService received shipment after:', Date.now() - startTime, 'ms');
      
      if (!shipment) {
        console.log('No shipment found for id:', id);
        return null;
      }
    
    // Parse destination data - now includes invoice, masterCargo, and documents
    let destinations = [];
    let invoice = null;
    let masterCargo = shipment.master_cargo || {};
    let actualTotal = null;
    let documents = [];

    if (shipment.destination) {
      try {
        const parsed = typeof shipment.destination === 'string'
          ? JSON.parse(shipment.destination)
          : shipment.destination;

        // Extract destinations
        if (parsed.destinations && Array.isArray(parsed.destinations)) {
          destinations = parsed.destinations;
        } else if (Array.isArray(parsed)) {
          destinations = parsed;
        }

        // Extract invoice if it exists
        if (parsed.invoice) {
          invoice = parsed.invoice;
        }

        // Extract masterCargo with actual values if it exists
        if (parsed.masterCargo) {
          masterCargo = { ...masterCargo, ...parsed.masterCargo };
        }

        // Extract actual total if it exists
        if (parsed.actualTotal !== undefined) {
          actualTotal = parsed.actualTotal;
        }

        // Extract documents if they exist
        if (parsed.documents && Array.isArray(parsed.documents)) {
          documents = parsed.documents;
        }
      } catch (e) {
        console.log('Could not parse destination:', shipment.destination);
      }
    }
    
    // Create default tracking events based on shipment status
    const trackingEvents = [];
    const createdDate = shipment.created_at || shipment.createdAt;
    
    // Always add shipment created event
    if (createdDate) {
      trackingEvents.push({
        date: createdDate,
        timestamp: createdDate,
        status: 'Awaiting Pickup',
        location: 'System',
        description: 'Shipment created and awaiting pickup',
        type: 'tracking'
      });
    }
    
    // Add payment event if invoice is paid
    if (shipment.invoice?.status === 'Paid' && shipment.invoice?.paidAt) {
      trackingEvents.push({
        date: shipment.invoice.paidAt,
        timestamp: shipment.invoice.paidAt,
        status: 'Payment Received',
        location: 'System',
        description: 'Invoice payment received',
        type: 'payment'
      });
    }
    
    // Add in progress event if status is beyond awaiting pickup
    if (shipment.status === 'In Progress' || shipment.status === 'In Transit' || shipment.status === 'Customs' || shipment.status === 'Delivered') {
      const progressDate = new Date(createdDate);
      progressDate.setHours(progressDate.getHours() + 24);
      trackingEvents.push({
        date: progressDate.toISOString(),
        timestamp: progressDate.toISOString(),
        status: 'In Progress',
        location: 'Origin Warehouse',
        description: 'Shipment picked up and in progress',
        type: 'tracking'
      });
    }
    
    // Add in transit event if applicable
    if (shipment.status === 'In Transit' || shipment.status === 'Customs' || shipment.status === 'Delivered') {
      const transitDate = new Date(createdDate);
      transitDate.setHours(transitDate.getHours() + 48);
      trackingEvents.push({
        date: transitDate.toISOString(),
        timestamp: transitDate.toISOString(),
        status: 'In Transit',
        location: 'En Route',
        description: 'Shipment in transit to destination',
        type: 'tracking'
      });
    }
    
    // Add delivered event if delivered
    if (shipment.status === 'Delivered') {
      const deliveredDate = new Date(createdDate);
      deliveredDate.setHours(deliveredDate.getHours() + 96);
      trackingEvents.push({
        date: deliveredDate.toISOString(),
        timestamp: deliveredDate.toISOString(),
        status: 'Delivered',
        location: 'Destination Warehouse',
        description: 'Shipment delivered successfully',
        type: 'tracking'
      });
    }
    
    // Transform to match frontend format
    return {
      ...shipment,
      shipmentId: shipment.id,
      customerId: shipment.customer_id,
      quoteId: shipment.quote_id,
      customer: shipment.users || null, // Include customer data from join
      destinations: destinations,
      masterCargo: masterCargo, // Use the merged masterCargo with actual values
      trackingEvents: trackingEvents, // Add tracking events
      estimatedTotal: shipment.quotes?.total_cost || 0,
      actualTotal: actualTotal, // Include actual total from invoice
      invoice: invoice, // Use extracted invoice from destination field
      documents: documents, // Use extracted documents from destination field
      createdAt: shipment.created_at || shipment.createdAt // Map created_at to createdAt
    };
    } catch (error) {
      console.error('Error in getShipmentById:', error);
      throw error;
    }
  },

  async createShipment(shipment: any) {
    await simulateDelay(500);
    return await supabaseService.shipments.create(shipment);
  },

  async updateShipment(id: string, updates: any) {
    await simulateDelay(300);
    const result = await supabaseService.shipments.update(id, updates);
    
    // Send email notification for status changes
    if (updates.status) {
      try {
        const shipment = await this.getShipmentById(id);
        if (shipment && shipment.customerId) {
          const customer = await this.getUserById(shipment.customerId);
          if (customer?.email) {
            if (updates.status === 'Delivered') {
              await emailService.sendNotification(
                customer.email,
                'shipment-delivered',
                {
                  shipmentId: id,
                  customerName: customer.name || 'Customer',
                  deliveryLocation: shipment.destination || '',
                  deliveryDate: new Date().toLocaleString()
                }
              );
            } else {
              await emailService.sendNotification(
                customer.email,
                'shipment-update',
                {
                  shipmentId: id,
                  customerName: customer.name || 'Customer',
                  status: updates.status,
                  trackingInfo: shipment.trackingNumber || '',
                  estimatedDelivery: shipment.estimatedDelivery || ''
                }
              );
            }
          }
        }
      } catch (error) {
        console.error('Failed to send shipment update notification:', error);
      }
    }
    
    return result;
  },

  // Tracking methods
  async addTrackingEvent(shipmentId: string, event: any) {
    await simulateDelay(300);
    // Remove timestamp field as it doesn't exist in the database
    const { timestamp, ...eventWithoutTimestamp } = event;
    const result = await supabaseService.tracking.create({
      id: `TE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...eventWithoutTimestamp,
      shipment_id: shipmentId,
      date: event.date || new Date().toISOString()
    });
    
    // Send notification for tracking updates
    try {
      const shipment = await this.getShipmentById(shipmentId);
      if (shipment && shipment.customerId) {
        const customer = await this.getUserById(shipment.customerId);
        if (customer?.email) {
          await emailService.sendNotification(
            customer.email,
            'shipment-update',
            {
              shipmentId: shipmentId,
              customerName: customer.name || 'Customer',
              status: event.status || shipment.status,
              trackingInfo: `${event.location || ''} - ${event.description || ''}`.trim(),
              estimatedDelivery: shipment.estimatedDelivery || ''
            }
          );
        }
      }
    } catch (error) {
      console.error('Failed to send tracking event notification:', error);
    }
    
    return result;
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

  // Commission rate methods
  async getCommissionRate() {
    await simulateDelay(100);
    // Get from system settings
    const settings = await supabaseService.systemSettings.get('commission_rate');
    return settings ? parseFloat(settings.value) : 0.50;
  },

  async updateCommissionRate(rate: number) {
    await simulateDelay(300);
    return await supabaseService.systemSettings.update('commission_rate', rate.toString());
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