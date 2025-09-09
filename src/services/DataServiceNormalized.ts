// DataService for Normalized Database Schema
// This service handles the new normalized quote structure with individual columns for each field

export interface Supplier {
  id: string;
  name: string;
  address: string;
  city?: string;
  country?: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CartonConfiguration {
  id: string;
  quote_request_id: string;
  nickname: string;
  carton_weight: number;
  length: number;
  width: number;
  height: number;
  dimension_unit: 'cm' | 'in';
  volumetric_weight: number;
  created_at?: string;
}

export interface QuoteDestination {
  id: string;
  quote_request_id: string;
  is_amazon: boolean;
  fba_warehouse_code?: string;
  fba_warehouse_name?: string;
  warehouse_address?: string;
  warehouse_city?: string;
  warehouse_state?: string;
  warehouse_zip?: string;
  custom_address?: string;
  total_cartons: number;
  gross_weight: number;
  volumetric_weight: number;
  chargeable_weight: number;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface CartonAssignment {
  id: string;
  destination_id: string;
  carton_config_id: string;
  quantity: number;
  created_at?: string;
}

export interface NormalizedQuoteRequest {
  id: string;
  customer_id: string;
  
  // Supplier Information
  supplier_id?: string;
  supplier_name?: string;
  supplier_address?: string;
  supplier_city?: string;
  supplier_country?: string;
  supplier_contact_name?: string;
  supplier_contact_phone?: string;
  
  // Shipment Details
  shipment_date?: string;
  service_type: string;
  requested_date: string;
  due_by: string;
  
  // Product Information
  product_description?: string;
  competitor_asin?: string;
  regulated_goods?: 'fda' | 'wood-bamboo-animal' | 'batteries-hazmat' | 'cream-liquids-powders' | 'none';
  
  // Master Cargo Summary
  total_carton_count: number;
  total_gross_weight: number;
  total_volumetric_weight: number;
  total_chargeable_weight: number;
  total_cbm: number;
  dimension_unit: 'cm' | 'in';
  
  // Special Instructions
  special_instructions?: string;
  
  // Status and Metadata
  status: string;
  created_at?: string;
  updated_at?: string;
  
  // Related data (loaded separately)
  destinations?: QuoteDestination[];
  carton_configurations?: CartonConfiguration[];
}

export interface NormalizedQuote {
  id: string;
  request_id: string;
  customer_id: string;
  staff_id?: string;
  
  // Base Pricing
  freight_cost: number;
  insurance_cost: number;
  customs_clearance_fee: number;
  fuel_surcharge: number;
  handling_fee: number;
  documentation_fee: number;
  
  // Per-Destination Costs (JSON)
  per_destination_costs?: any;
  
  // Commission
  commission_rate_per_kg?: number;
  total_commission: number;
  
  // Totals
  subtotal: number;
  tax_amount: number;
  total_cost: number;
  
  // Quote Details
  valid_until: string;
  payment_terms?: string;
  delivery_terms?: string;
  status: string;
  notes?: string;
  
  created_at?: string;
  updated_at?: string;
}

class DataServiceNormalized {
  private static readonly STORAGE_PREFIX = 'freightshark_normalized_';
  private static readonly DELAY_MS = 500;

  // Helper method to simulate async operations
  private static async delay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, this.DELAY_MS));
  }

  // Generate unique IDs
  private static generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Storage helpers
  private static getStorageKey(entity: string): string {
    return `${this.STORAGE_PREFIX}${entity}`;
  }

  private static async getFromStorage<T>(key: string): Promise<T[]> {
    await this.delay();
    const data = localStorage.getItem(this.getStorageKey(key));
    return data ? JSON.parse(data) : [];
  }

  private static async saveToStorage<T>(key: string, data: T[]): Promise<void> {
    localStorage.setItem(this.getStorageKey(key), JSON.stringify(data));
    await this.delay();
  }

  // Supplier methods
  static async getSuppliers(): Promise<Supplier[]> {
    return this.getFromStorage<Supplier>('suppliers');
  }

  static async createSupplier(supplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>): Promise<Supplier> {
    const suppliers = await this.getSuppliers();
    const newSupplier: Supplier = {
      ...supplier,
      id: this.generateId('supplier'),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    suppliers.push(newSupplier);
    await this.saveToStorage('suppliers', suppliers);
    return newSupplier;
  }

  // Quote Request methods
  static async createNormalizedQuoteRequest(
    request: Omit<NormalizedQuoteRequest, 'id' | 'created_at' | 'updated_at'>,
    destinations: Omit<QuoteDestination, 'id' | 'quote_request_id' | 'created_at' | 'updated_at'>[],
    cartonConfigs: Omit<CartonConfiguration, 'id' | 'quote_request_id' | 'created_at'>[],
    cartonAssignments: { destinationIndex: number; configIndex: number; quantity: number }[]
  ): Promise<NormalizedQuoteRequest> {
    const requestId = this.generateId('qr');
    
    // Create quote request
    const newRequest: NormalizedQuoteRequest = {
      ...request,
      id: requestId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Create carton configurations
    const savedConfigs: CartonConfiguration[] = [];
    for (const config of cartonConfigs) {
      const newConfig: CartonConfiguration = {
        ...config,
        id: this.generateId('cc'),
        quote_request_id: requestId,
        created_at: new Date().toISOString()
      };
      savedConfigs.push(newConfig);
    }
    
    // Create destinations
    const savedDestinations: QuoteDestination[] = [];
    for (let i = 0; i < destinations.length; i++) {
      const newDest: QuoteDestination = {
        ...destinations[i],
        id: this.generateId('dest'),
        quote_request_id: requestId,
        display_order: i,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      savedDestinations.push(newDest);
    }
    
    // Create carton assignments
    const savedAssignments: CartonAssignment[] = [];
    for (const assignment of cartonAssignments) {
      const newAssignment: CartonAssignment = {
        id: this.generateId('ca'),
        destination_id: savedDestinations[assignment.destinationIndex].id,
        carton_config_id: savedConfigs[assignment.configIndex].id,
        quantity: assignment.quantity,
        created_at: new Date().toISOString()
      };
      savedAssignments.push(newAssignment);
    }
    
    // Save all entities
    const requests = await this.getFromStorage<NormalizedQuoteRequest>('quote_requests');
    requests.push(newRequest);
    await this.saveToStorage('quote_requests', requests);
    
    const configs = await this.getFromStorage<CartonConfiguration>('carton_configs');
    configs.push(...savedConfigs);
    await this.saveToStorage('carton_configs', configs);
    
    const dests = await this.getFromStorage<QuoteDestination>('destinations');
    dests.push(...savedDestinations);
    await this.saveToStorage('destinations', dests);
    
    const assigns = await this.getFromStorage<CartonAssignment>('carton_assignments');
    assigns.push(...savedAssignments);
    await this.saveToStorage('carton_assignments', assigns);
    
    // Return the complete request with related data
    newRequest.destinations = savedDestinations;
    newRequest.carton_configurations = savedConfigs;
    
    return newRequest;
  }

  static async getNormalizedQuoteRequests(): Promise<NormalizedQuoteRequest[]> {
    const requests = await this.getFromStorage<NormalizedQuoteRequest>('quote_requests');
    const destinations = await this.getFromStorage<QuoteDestination>('destinations');
    const configs = await this.getFromStorage<CartonConfiguration>('carton_configs');
    
    // Attach related data to each request
    for (const request of requests) {
      request.destinations = destinations.filter(d => d.quote_request_id === request.id);
      request.carton_configurations = configs.filter(c => c.quote_request_id === request.id);
    }
    
    return requests;
  }

  static async getNormalizedQuoteRequestById(id: string): Promise<NormalizedQuoteRequest | null> {
    const requests = await this.getNormalizedQuoteRequests();
    return requests.find(r => r.id === id) || null;
  }

  static async getNormalizedQuoteRequestsByCustomerId(customerId: string): Promise<NormalizedQuoteRequest[]> {
    const requests = await this.getNormalizedQuoteRequests();
    return requests.filter(r => r.customer_id === customerId);
  }

  static async updateNormalizedQuoteRequest(
    id: string, 
    updates: Partial<NormalizedQuoteRequest>
  ): Promise<NormalizedQuoteRequest | null> {
    const requests = await this.getFromStorage<NormalizedQuoteRequest>('quote_requests');
    const index = requests.findIndex(r => r.id === id);
    
    if (index === -1) return null;
    
    requests[index] = {
      ...requests[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    await this.saveToStorage('quote_requests', requests);
    return requests[index];
  }

  // Quote methods
  static async createNormalizedQuote(quote: Omit<NormalizedQuote, 'id' | 'created_at' | 'updated_at'>): Promise<NormalizedQuote> {
    const quotes = await this.getFromStorage<NormalizedQuote>('quotes');
    const newQuote: NormalizedQuote = {
      ...quote,
      id: this.generateId('q'),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    quotes.push(newQuote);
    await this.saveToStorage('quotes', quotes);
    return newQuote;
  }

  static async getNormalizedQuotes(): Promise<NormalizedQuote[]> {
    return this.getFromStorage<NormalizedQuote>('quotes');
  }

  static async getNormalizedQuotesByCustomerId(customerId: string): Promise<NormalizedQuote[]> {
    const quotes = await this.getNormalizedQuotes();
    return quotes.filter(q => q.customer_id === customerId);
  }

  static async updateNormalizedQuote(id: string, updates: Partial<NormalizedQuote>): Promise<NormalizedQuote | null> {
    const quotes = await this.getFromStorage<NormalizedQuote>('quotes');
    const index = quotes.findIndex(q => q.id === id);
    
    if (index === -1) return null;
    
    quotes[index] = {
      ...quotes[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    await this.saveToStorage('quotes', quotes);
    return quotes[index];
  }

  // Get carton assignments for a destination
  static async getCartonAssignmentsByDestination(destinationId: string): Promise<CartonAssignment[]> {
    const assignments = await this.getFromStorage<CartonAssignment>('carton_assignments');
    return assignments.filter(a => a.destination_id === destinationId);
  }

  // Update destination totals (called after carton assignments change)
  static async updateDestinationTotals(destinationId: string): Promise<void> {
    const destinations = await this.getFromStorage<QuoteDestination>('destinations');
    const assignments = await this.getCartonAssignmentsByDestination(destinationId);
    const configs = await this.getFromStorage<CartonConfiguration>('carton_configs');
    
    const destIndex = destinations.findIndex(d => d.id === destinationId);
    if (destIndex === -1) return;
    
    let totalCartons = 0;
    let grossWeight = 0;
    let volumetricWeight = 0;
    
    for (const assignment of assignments) {
      const config = configs.find(c => c.id === assignment.carton_config_id);
      if (config) {
        totalCartons += assignment.quantity;
        grossWeight += assignment.quantity * config.carton_weight;
        volumetricWeight += assignment.quantity * config.volumetric_weight;
      }
    }
    
    destinations[destIndex] = {
      ...destinations[destIndex],
      total_cartons: totalCartons,
      gross_weight: grossWeight,
      volumetric_weight: volumetricWeight,
      chargeable_weight: Math.max(grossWeight, volumetricWeight),
      updated_at: new Date().toISOString()
    };
    
    await this.saveToStorage('destinations', destinations);
    
    // Update quote request totals
    await this.updateQuoteRequestTotals(destinations[destIndex].quote_request_id);
  }

  // Update quote request totals (called after destination totals change)
  static async updateQuoteRequestTotals(requestId: string): Promise<void> {
    const requests = await this.getFromStorage<NormalizedQuoteRequest>('quote_requests');
    const destinations = await this.getFromStorage<QuoteDestination>('destinations');
    
    const requestIndex = requests.findIndex(r => r.id === requestId);
    if (requestIndex === -1) return;
    
    const requestDestinations = destinations.filter(d => d.quote_request_id === requestId);
    
    const totals = requestDestinations.reduce((acc, dest) => ({
      cartons: acc.cartons + dest.total_cartons,
      grossWeight: acc.grossWeight + dest.gross_weight,
      volumetricWeight: acc.volumetricWeight + dest.volumetric_weight,
      chargeableWeight: acc.chargeableWeight + dest.chargeable_weight
    }), { cartons: 0, grossWeight: 0, volumetricWeight: 0, chargeableWeight: 0 });
    
    requests[requestIndex] = {
      ...requests[requestIndex],
      total_carton_count: totals.cartons,
      total_gross_weight: totals.grossWeight,
      total_volumetric_weight: totals.volumetricWeight,
      total_chargeable_weight: totals.chargeableWeight,
      total_cbm: totals.volumetricWeight / 167, // Convert to CBM
      updated_at: new Date().toISOString()
    };
    
    await this.saveToStorage('quote_requests', requests);
  }

  // Initialize with sample data if empty
  static async initializeSampleData(): Promise<void> {
    const suppliers = await this.getSuppliers();
    if (suppliers.length === 0) {
      await this.createSupplier({
        name: 'Shanghai Electronics Co.',
        address: '123 Huaihai Road, Shanghai',
        city: 'Shanghai',
        country: 'China',
        contact_name: 'Li Wei',
        contact_phone: '+86 21 1234 5678'
      });
      
      await this.createSupplier({
        name: 'Guangzhou Manufacturing Ltd.',
        address: '456 Pearl River Avenue',
        city: 'Guangzhou',
        country: 'China',
        contact_name: 'Chen Ming',
        contact_phone: '+86 20 8765 4321'
      });
      
      await this.createSupplier({
        name: 'Shenzhen Tech Solutions',
        address: '789 Innovation Park',
        city: 'Shenzhen',
        country: 'China',
        contact_name: 'Wang Xiaoming',
        contact_phone: '+86 755 9876 5432'
      });
    }
  }
}

export default DataServiceNormalized;