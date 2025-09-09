import { v4 as uuidv4 } from 'uuid';
import { hashPassword, verifyPassword, generateSessionToken } from '../utils/auth';
// Types
export type User = {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  company: string;
  role: 'admin' | 'user' | 'staff';
  amazonSellerId?: string;
  einTaxId?: string;
  staffPosition?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Session = {
  token: string;
  userId: string;
  expiresAt: string;
};
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
export type QuoteRequest = {
  id: string;
  customerId: string;
  customer: {
    id: string;
    name: string;
    email: string;
    company: string;
  };
  status: 'Awaiting Quote' | 'Quote Provided' | 'Quote Accepted' | 'Quote Rejected';
  serviceType: 'Air Express' | 'Air Freight' | 'Ocean FCL' | 'Ocean LCL';
  requestedDate: string;
  dueBy: string;
  cargoDetails: {
    cartonCount: number;
    grossWeight: number;
    cbm: number;
    hazardous: boolean;
    notes: string;
  };
  destinations: DestinationWarehouse[];
  supplierDetails: {
    name: string;
    address: string;
    city: string;
    country: string;
    contactName: string;
    contactPhone: string;
  };
  specialRequirements: string;
  createdAt: string;
  updatedAt: string;
};
export type Quote = {
  id: string;
  requestId: string;
  customerId: string;
  staffId: string;
  status: 'Pending' | 'Accepted' | 'Rejected' | 'Expired' | 'Shipped';
  rateType: 'per-kg' | 'flat-rate';
  warehouseRates: {
    warehouseId: string;
    ratePerKg: number;
  }[];
  otherCharges: {
    id: string;
    description: string;
    amount: number;
  }[];
  discounts: {
    id: string;
    description: string;
    amount: number;
  }[];
  subtotal: number;
  total: number;
  notes: string;
  createdAt: string;
  expiresAt: string;
};
export type Announcement = {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
};

export type Shipment = {
  id: string;
  quoteId: string;
  customerId: string;
  status: 'Awaiting Pickup' | 'In Transit' | 'Customs' | 'Delivered';
  estimatedTotal: number;
  destinations: {
    id: string;
    fbaWarehouse: string;
    amazonShipmentId: string;
    amazonReferenceId?: string;
    soNumber?: string;
    cartons: number;
    estimatedWeight: number;
    actualWeight?: number;
  }[];
  cargoDetails: {
    estimatedCartonCount: number;
    estimatedWeight: number;
    actualCartonCount?: number;
    actualWeight?: number;
    dimensionChanges?: boolean;
  };
  trackingEvents: {
    id: string;
    date: string;
    status: string;
    location: string;
    description: string;
  }[];
  documents?: {
    id: string;
    name: string;
    type: string;
    size: number;
    uploadedAt: string;
    uploadedBy: string;
    warehouseId?: string;
    url?: string;
  }[];
  createdAt: string;
  updatedAt: string;
  estimatedDelivery: string;
};
// Function to create seed users with hashed passwords
const createSeedUsers = async (): Promise<User[]> => {
  // Pre-hashed passwords for demo accounts
  // Default password for all demo users: "Password123!"
  const defaultPasswordHash = '$2b$10$JQYNkdcI/nLXtbPT7/Ae0OG7IrcR5JvWRCGlY/eQ5H8rJAqwkHKiq';
  
  return [{
    id: 'admin-1',
    name: 'John Admin',
    email: 'admin@freightshark.com',
    passwordHash: defaultPasswordHash,
    company: 'FreightShark',
    role: 'admin' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }, {
    id: 'user-1',
    name: 'Demo Customer',
    email: 'customer@example.com',
    passwordHash: defaultPasswordHash,
    company: 'Acme Imports',
    role: 'user' as const,
    amazonSellerId: 'A1B2C3D4E5',
    einTaxId: '12-3456789',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }, {
    id: 'staff-1',
    name: 'Sarah Chen',
    email: 'staff@freightshark.com',
    passwordHash: defaultPasswordHash,
    company: 'FreightShark',
    role: 'staff' as const,
    staffPosition: 'Shipping Agent',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }];
};

// Initial seed data - only keeping users
const seedUsers: User[] = [{
  id: 'user-1',
  name: 'John Doe',
  email: 'john@acmeimports.com',
  company: 'Acme Imports',
  role: 'admin',
  amazonSellerId: 'A1B2C3D4E5',
  einTaxId: '12-3456789'
}, {
  id: 'user-2',
  name: 'Lisa Wong',
  email: 'lisa@globaltraders.com',
  company: 'Global Traders Inc',
  role: 'user',
  amazonSellerId: 'F6G7H8I9J0',
  einTaxId: '98-7654321'
}, {
  id: 'staff-1',
  name: 'Sarah Chen',
  email: 'sarah@ddpfreight.com',
  company: 'DDP Freight',
  role: 'staff',
  staffPosition: 'Shipping Agent'
}, {
  id: 'staff-2',
  name: 'Mike Johnson',
  email: 'mike@ddpfreight.com',
  company: 'DDP Freight',
  role: 'staff',
  staffPosition: 'Account Manager'
}];
// Helper functions to simulate API delays
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const simulateNetworkDelay = () => delay(Math.random() * 500 + 500); // 500-1000ms delay

// Helper function to generate next ID in sequence
const getNextId = (type: 'quote' | 'shipment'): string => {
  const sequences = JSON.parse(localStorage.getItem(STORAGE_KEYS.ID_SEQUENCES) || '{}');
  sequences[type] = (sequences[type] || 0) + 1;
  localStorage.setItem(STORAGE_KEYS.ID_SEQUENCES, JSON.stringify(sequences));
  
  const paddedNumber = sequences[type].toString().padStart(5, '0');
  return type === 'quote' ? `Q-${paddedNumber}` : `FS-${paddedNumber}`;
};

// Helper function to extract sequence number from quote ID
const getSequenceFromQuoteId = (quoteId: string): number => {
  const match = quoteId.match(/Q-(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
};
// LocalStorage keys
const STORAGE_KEYS = {
  USERS: 'ddp_users',
  SESSIONS: 'ddp_sessions',
  QUOTE_REQUESTS: 'ddp_quote_requests',
  QUOTES: 'ddp_quotes',
  SHIPMENTS: 'ddp_shipments',
  ANNOUNCEMENTS: 'ddp_announcements',
  SYSTEM_SETTINGS: 'ddp_system_settings',
  ID_SEQUENCES: 'ddp_id_sequences'
};
// Initialize localStorage with seed data if not already set
const initializeStorage = async () => {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    const seedUsers = await createSeedUsers();
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(seedUsers));
  }
  
  // Initialize sessions storage
  if (!localStorage.getItem(STORAGE_KEYS.SESSIONS)) {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify([]));
  }
  // Initialize empty arrays for quote requests, quotes, and shipments
  if (!localStorage.getItem(STORAGE_KEYS.QUOTE_REQUESTS)) {
    localStorage.setItem(STORAGE_KEYS.QUOTE_REQUESTS, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.QUOTES)) {
    localStorage.setItem(STORAGE_KEYS.QUOTES, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SHIPMENTS)) {
    localStorage.setItem(STORAGE_KEYS.SHIPMENTS, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SYSTEM_SETTINGS)) {
    localStorage.setItem(STORAGE_KEYS.SYSTEM_SETTINGS, JSON.stringify({
      commissionRatePerKg: 0.50 // Default commission rate $0.50 per kg
    }));
  }
  
  // Initialize ID sequences for quotes and shipments
  if (!localStorage.getItem(STORAGE_KEYS.ID_SEQUENCES)) {
    localStorage.setItem(STORAGE_KEYS.ID_SEQUENCES, JSON.stringify({
      quote: 0,
      shipment: 0
    }));
  }
  
  if (!localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS)) {
    // Initialize with some seed announcements
    const seedAnnouncements: Announcement[] = [
      {
        id: 'ANN-001',
        title: 'Shipping Agent Update',
        content: 'Some Amazon warehouses are experiencing delays due to capacity issues. Please check your shipment status regularly.',
        type: 'warning',
        createdBy: 'STAFF-001',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        isActive: true
      },
      {
        id: 'ANN-002',
        title: 'Holiday Schedule Notice',
        content: 'Our offices will be closed on December 25th and January 1st. Please plan your shipments accordingly.',
        type: 'info',
        createdBy: 'STAFF-001',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // yesterday
        updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        isActive: true
      },
      {
        id: 'ANN-003',
        title: 'New Feature: Real-time Tracking',
        content: 'We\'ve enhanced our tracking system with real-time updates. Check your shipment status for live location data.',
        type: 'success',
        createdBy: 'STAFF-001',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true
      }
    ];
    localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(seedAnnouncements));
  }
};
// Data service methods
export const DataService = {
  // Initialize data
  initialize: async () => {
    await initializeStorage();
  },
  // User methods
  getUsers: async (): Promise<User[]> => {
    await simulateNetworkDelay();
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    return users;
  },
  getUserById: async (userId: string): Promise<User | null> => {
    await simulateNetworkDelay();
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    return users.find((user: User) => user.id === userId) || null;
  },
  
  // Authentication methods
  authenticateUser: async (email: string, password: string): Promise<{ user: User; token: string } | null> => {
    await simulateNetworkDelay();
    console.log('Authenticating:', email);
    
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    console.log('Users in storage:', users.length);
    
    const user = users.find((u: User) => u.email.toLowerCase() === email.toLowerCase());
    console.log('Found user:', user);
    
    if (!user) {
      console.error('User not found for email:', email);
      return null;
    }
    
    if (!user.passwordHash) {
      console.error('User has no password hash!');
      return null;
    }
    
    // Verify password
    console.log('Verifying password...');
    const isValidPassword = await verifyPassword(password, user.passwordHash);
    console.log('Password valid?', isValidPassword);
    
    if (!isValidPassword) {
      console.error('Invalid password');
      return null;
    }
    
    // Create session
    const token = generateSessionToken();
    const session: Session = {
      token,
      userId: user.id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    };
    
    // Store session
    const sessions = JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSIONS) || '[]');
    sessions.push(session);
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    
    // Return user without password hash
    const { passwordHash, ...userWithoutPassword } = user;
    return { user: userWithoutPassword as User, token };
  },
  
  registerUser: async (userData: {
    name: string;
    email: string;
    password: string;
    company: string;
    role: 'admin' | 'user' | 'staff';
    amazonSellerId?: string;
    einTaxId?: string;
    staffPosition?: string;
  }): Promise<User> => {
    await simulateNetworkDelay();
    
    // Hash the password
    const passwordHash = await hashPassword(userData.password);
    
    // Create user
    const newUser: User = {
      id: `user-${uuidv4()}`,
      name: userData.name,
      email: userData.email,
      passwordHash,
      company: userData.company,
      role: userData.role,
      amazonSellerId: userData.amazonSellerId,
      einTaxId: userData.einTaxId,
      staffPosition: userData.staffPosition,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Save user
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    
    return newUser;
  },
  
  validateSession: async (token: string): Promise<User | null> => {
    await simulateNetworkDelay();
    
    const sessions = JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSIONS) || '[]');
    const session = sessions.find((s: Session) => s.token === token);
    
    if (!session || new Date(session.expiresAt) < new Date()) {
      return null;
    }
    
    return DataService.getUserById(session.userId);
  },
  
  logout: async (token: string): Promise<void> => {
    await simulateNetworkDelay();
    const sessions = JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSIONS) || '[]');
    const filteredSessions = sessions.filter((s: Session) => s.token !== token);
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(filteredSessions));
  },
  // Quote request methods
  getQuoteRequests: async (): Promise<QuoteRequest[]> => {
    await simulateNetworkDelay();
    const requests = JSON.parse(localStorage.getItem(STORAGE_KEYS.QUOTE_REQUESTS) || '[]');
    return requests;
  },
  getQuoteRequestById: async (requestId: string): Promise<QuoteRequest | null> => {
    await simulateNetworkDelay();
    const requests = JSON.parse(localStorage.getItem(STORAGE_KEYS.QUOTE_REQUESTS) || '[]');
    return requests.find((req: QuoteRequest) => req.id === requestId) || null;
  },
  getQuoteRequestsByCustomerId: async (customerId: string): Promise<QuoteRequest[]> => {
    await simulateNetworkDelay();
    const requests = JSON.parse(localStorage.getItem(STORAGE_KEYS.QUOTE_REQUESTS) || '[]');
    return requests.filter((req: QuoteRequest) => req.customerId === customerId);
  },
  createQuoteRequest: async (request: Omit<QuoteRequest, 'id' | 'createdAt' | 'updatedAt' | 'customer'>): Promise<QuoteRequest> => {
    await simulateNetworkDelay();
    const requests = JSON.parse(localStorage.getItem(STORAGE_KEYS.QUOTE_REQUESTS) || '[]');
    // Get user information
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const user = users.find((u: User) => u.id === request.customerId);
    const newRequest: QuoteRequest = {
      ...request,
      id: getNextId('quote'),
      customer: {
        id: user?.id || request.customerId,
        name: user?.name || 'Unknown User',
        email: user?.email || 'unknown@example.com',
        company: user?.company || 'Unknown Company'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    requests.push(newRequest);
    localStorage.setItem(STORAGE_KEYS.QUOTE_REQUESTS, JSON.stringify(requests));
    return newRequest;
  },
  updateQuoteRequest: async (requestId: string, updates: Partial<QuoteRequest>): Promise<QuoteRequest | null> => {
    await simulateNetworkDelay();
    const requests = JSON.parse(localStorage.getItem(STORAGE_KEYS.QUOTE_REQUESTS) || '[]');
    const index = requests.findIndex((req: QuoteRequest) => req.id === requestId);
    if (index === -1) return null;
    const updatedRequest = {
      ...requests[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    requests[index] = updatedRequest;
    localStorage.setItem(STORAGE_KEYS.QUOTE_REQUESTS, JSON.stringify(requests));
    return updatedRequest;
  },
  // Quote methods
  getQuotes: async (): Promise<Quote[]> => {
    await simulateNetworkDelay();
    const quotes = JSON.parse(localStorage.getItem(STORAGE_KEYS.QUOTES) || '[]');
    return quotes;
  },
  getQuoteById: async (quoteId: string): Promise<Quote | null> => {
    await simulateNetworkDelay();
    const quotes = JSON.parse(localStorage.getItem(STORAGE_KEYS.QUOTES) || '[]');
    return quotes.find((quote: Quote) => quote.id === quoteId) || null;
  },
  getQuotesByCustomerId: async (customerId: string): Promise<Quote[]> => {
    await simulateNetworkDelay();
    const quotes = JSON.parse(localStorage.getItem(STORAGE_KEYS.QUOTES) || '[]');
    return quotes.filter((quote: Quote) => quote.customerId === customerId);
  },
  getQuoteByRequestId: async (requestId: string): Promise<Quote | null> => {
    await simulateNetworkDelay();
    const quotes = JSON.parse(localStorage.getItem(STORAGE_KEYS.QUOTES) || '[]');
    return quotes.find((quote: Quote) => quote.requestId === requestId) || null;
  },
  createQuote: async (quote: Omit<Quote, 'id' | 'createdAt'>): Promise<Quote> => {
    await simulateNetworkDelay();
    const quotes = JSON.parse(localStorage.getItem(STORAGE_KEYS.QUOTES) || '[]');
    const newQuote: Quote = {
      ...quote,
      id: getNextId('quote'),
      createdAt: new Date().toISOString()
    };
    quotes.push(newQuote);
    localStorage.setItem(STORAGE_KEYS.QUOTES, JSON.stringify(quotes));
    // Update the quote request status
    await DataService.updateQuoteRequest(quote.requestId, {
      status: 'Quote Provided'
    });
    return newQuote;
  },
  updateQuote: async (quoteId: string, updates: Partial<Quote>): Promise<Quote | null> => {
    await simulateNetworkDelay();
    const quotes = JSON.parse(localStorage.getItem(STORAGE_KEYS.QUOTES) || '[]');
    const index = quotes.findIndex((quote: Quote) => quote.id === quoteId);
    if (index === -1) return null;
    const updatedQuote = {
      ...quotes[index],
      ...updates
    };
    quotes[index] = updatedQuote;
    localStorage.setItem(STORAGE_KEYS.QUOTES, JSON.stringify(quotes));
    return updatedQuote;
  },
  // Shipment methods
  getShipments: async (): Promise<Shipment[]> => {
    await simulateNetworkDelay();
    const shipments = JSON.parse(localStorage.getItem(STORAGE_KEYS.SHIPMENTS) || '[]');
    return shipments;
  },
  getShipmentById: async (shipmentId: string): Promise<Shipment | null> => {
    await simulateNetworkDelay();
    const shipments = JSON.parse(localStorage.getItem(STORAGE_KEYS.SHIPMENTS) || '[]');
    return shipments.find((shipment: Shipment) => shipment.id === shipmentId) || null;
  },
  getShipmentsByCustomerId: async (customerId: string): Promise<Shipment[]> => {
    await simulateNetworkDelay();
    const shipments = JSON.parse(localStorage.getItem(STORAGE_KEYS.SHIPMENTS) || '[]');
    return shipments.filter((shipment: Shipment) => shipment.customerId === customerId);
  },
  createShipment: async (shipment: Omit<Shipment, 'id' | 'createdAt' | 'updatedAt' | 'trackingEvents'>): Promise<Shipment> => {
    await simulateNetworkDelay();
    const shipments = JSON.parse(localStorage.getItem(STORAGE_KEYS.SHIPMENTS) || '[]');
    // Use the same sequence number from the quote ID if converting from quote
    let shipmentId: string;
    if (shipment.quoteId) {
      const quoteSequence = getSequenceFromQuoteId(shipment.quoteId);
      if (quoteSequence > 0) {
        shipmentId = `FS-${quoteSequence.toString().padStart(5, '0')}`;
      } else {
        shipmentId = getNextId('shipment');
      }
    } else {
      shipmentId = getNextId('shipment');
    }
    
    const newShipment: Shipment = {
      ...shipment,
      id: shipmentId,
      trackingEvents: [{
        id: `event-${uuidv4()}`,
        date: new Date().toISOString(),
        status: 'Created',
        location: 'System',
        description: 'Shipment created in system'
      }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    shipments.push(newShipment);
    localStorage.setItem(STORAGE_KEYS.SHIPMENTS, JSON.stringify(shipments));
    return newShipment;
  },
  updateShipment: async (shipmentId: string, updates: Partial<Shipment>): Promise<Shipment | null> => {
    await simulateNetworkDelay();
    const shipments = JSON.parse(localStorage.getItem(STORAGE_KEYS.SHIPMENTS) || '[]');
    const index = shipments.findIndex((shipment: Shipment) => shipment.id === shipmentId);
    if (index === -1) return null;
    const updatedShipment = {
      ...shipments[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    shipments[index] = updatedShipment;
    localStorage.setItem(STORAGE_KEYS.SHIPMENTS, JSON.stringify(shipments));
    return updatedShipment;
  },
  addTrackingEvent: async (shipmentId: string, event: Omit<Shipment['trackingEvents'][0], 'id'>): Promise<Shipment | null> => {
    await simulateNetworkDelay();
    const shipments = JSON.parse(localStorage.getItem(STORAGE_KEYS.SHIPMENTS) || '[]');
    const index = shipments.findIndex((shipment: Shipment) => shipment.id === shipmentId);
    if (index === -1) return null;
    const newEvent = {
      id: `event-${uuidv4()}`,
      ...event
    };
    const updatedShipment = {
      ...shipments[index],
      trackingEvents: [...shipments[index].trackingEvents, newEvent],
      updatedAt: new Date().toISOString()
    };
    shipments[index] = updatedShipment;
    localStorage.setItem(STORAGE_KEYS.SHIPMENTS, JSON.stringify(shipments));
    return updatedShipment;
  },
  // Convert approved quote to shipment
  convertQuoteToShipment: async (quoteId: string): Promise<Shipment | null> => {
    await simulateNetworkDelay();
    
    // Get the quote
    const quote = await DataService.getQuoteById(quoteId);
    if (!quote || quote.status !== 'Accepted') {
      throw new Error('Quote not found or not approved');
    }
    
    // Get the quote request
    const quoteRequest = await DataService.getQuoteRequestById(quote.requestId);
    if (!quoteRequest) {
      throw new Error('Quote request not found');
    }
    
    // Create shipment from quote data
    const shipmentData = {
      quoteId: quote.id,
      customerId: quote.customerId,
      status: 'Awaiting Pickup' as const,
      estimatedTotal: quote.total,
      destinations: quoteRequest.destinations.map(dest => ({
        id: dest.id,
        fbaWarehouse: dest.fbaWarehouse,
        amazonShipmentId: dest.amazonShipmentId,
        cartons: dest.cartons,
        estimatedWeight: dest.weight
      })),
      cargoDetails: {
        estimatedCartonCount: quoteRequest.cargoDetails.cartonCount,
        estimatedWeight: quoteRequest.cargoDetails.grossWeight
      },
      estimatedDelivery: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 14 days from now
    };
    
    // Create the shipment
    const shipment = await DataService.createShipment(shipmentData);
    
    // Update quote status to indicate it's been converted to shipment
    await DataService.updateQuote(quoteId, {
      status: 'Shipped'
    });
    
    // Update quote request status
    await DataService.updateQuoteRequest(quoteRequest.id, {
      status: 'Quote Accepted'
    });
    
    return shipment;
  },
  // Process invoice payment
  processInvoicePayment: async (shipmentId: string, paymentDetails: {
    cardNumber: string;
    cardHolder: string;
    expiryDate: string;
    cvv: string;
    amount: number;
  }): Promise<boolean> => {
    await simulateNetworkDelay();
    
    // Get the shipment
    const shipments = JSON.parse(localStorage.getItem(STORAGE_KEYS.SHIPMENTS) || '[]');
    const shipmentIndex = shipments.findIndex((s: Shipment) => s.id === shipmentId);
    
    if (shipmentIndex === -1) {
      throw new Error('Shipment not found');
    }
    
    const shipment = shipments[shipmentIndex];
    
    if (!shipment.invoice) {
      throw new Error('No invoice found for this shipment');
    }
    
    if (shipment.invoice.status === 'Paid') {
      throw new Error('Invoice has already been paid');
    }
    
    // Validate payment amount matches invoice amount
    if (Math.abs(paymentDetails.amount - shipment.invoice.amount) > 0.01) {
      throw new Error('Payment amount does not match invoice amount');
    }
    
    // Update invoice status to Paid
    const paymentDate = new Date().toISOString();
    const transactionId = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    shipment.invoice.status = 'Paid';
    shipment.invoice.paidDate = paymentDate;
    shipment.invoice.paymentDetails = {
      method: 'Credit Card',
      last4: paymentDetails.cardNumber.slice(-4),
      transactionId: transactionId,
      processedAt: paymentDate
    };
    
    // Add payment event to tracking timeline
    if (!shipment.trackingEvents) {
      shipment.trackingEvents = [];
    }
    
    shipment.trackingEvents.push({
      timestamp: paymentDate,
      status: 'Payment Received',
      location: 'System',
      description: `Invoice payment of $${paymentDetails.amount.toFixed(2)} received. Transaction ID: ${transactionId}`,
      type: 'payment'
    });
    
    // Save updated shipment
    shipments[shipmentIndex] = shipment;
    localStorage.setItem(STORAGE_KEYS.SHIPMENTS, JSON.stringify(shipments));
    
    return true;
  },
  
  // Update SO Number for a specific warehouse destination
  updateWarehouseSoNumber: async (shipmentId: string, warehouseId: string, soNumber: string): Promise<Shipment | null> => {
    await simulateNetworkDelay();
    const shipments = JSON.parse(localStorage.getItem(STORAGE_KEYS.SHIPMENTS) || '[]');
    const shipmentIndex = shipments.findIndex((s: Shipment) => s.id === shipmentId);
    
    if (shipmentIndex === -1) return null;
    
    const shipment = shipments[shipmentIndex];
    const destinationIndex = shipment.destinations.findIndex((d: any) => d.id === warehouseId);
    
    if (destinationIndex === -1) return null;
    
    // Update SO number for the specific destination
    shipment.destinations[destinationIndex].soNumber = soNumber;
    shipment.updatedAt = new Date().toISOString();
    
    // Save updated shipment
    shipments[shipmentIndex] = shipment;
    localStorage.setItem(STORAGE_KEYS.SHIPMENTS, JSON.stringify(shipments));
    
    return shipment;
  },
  
  // Add document to shipment
  addDocumentToShipment: async (shipmentId: string, document: {
    name: string;
    type: string;
    size: number;
    warehouseId?: string;
    uploadedBy: string;
  }): Promise<Shipment | null> => {
    await simulateNetworkDelay();
    const shipments = JSON.parse(localStorage.getItem(STORAGE_KEYS.SHIPMENTS) || '[]');
    const shipmentIndex = shipments.findIndex((s: Shipment) => s.id === shipmentId);
    
    if (shipmentIndex === -1) return null;
    
    const shipment = shipments[shipmentIndex];
    
    // Initialize documents array if it doesn't exist
    if (!shipment.documents) {
      shipment.documents = [];
    }
    
    // Add new document
    const newDocument = {
      id: `DOC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...document,
      uploadedAt: new Date().toISOString(),
      url: `/documents/${shipmentId}/${document.name}` // Mock URL
    };
    
    shipment.documents.push(newDocument);
    shipment.updatedAt = new Date().toISOString();
    
    // Save updated shipment
    shipments[shipmentIndex] = shipment;
    localStorage.setItem(STORAGE_KEYS.SHIPMENTS, JSON.stringify(shipments));
    
    return shipment;
  },
  
  // Clear all data (for testing)
  clearAllData: async () => {
    await simulateNetworkDelay();
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.QUOTE_REQUESTS);
    localStorage.removeItem(STORAGE_KEYS.QUOTES);
    localStorage.removeItem(STORAGE_KEYS.SHIPMENTS);
    localStorage.removeItem(STORAGE_KEYS.ANNOUNCEMENTS);
    initializeStorage();
  },

  // Announcement methods
  getAnnouncements: async (): Promise<Announcement[]> => {
    await simulateNetworkDelay();
    const announcements = JSON.parse(localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS) || '[]');
    // Return only active announcements, sorted by date
    return announcements
      .filter((a: Announcement) => a.isActive)
      .sort((a: Announcement, b: Announcement) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  },

  getAllAnnouncements: async (): Promise<Announcement[]> => {
    await simulateNetworkDelay();
    const announcements = JSON.parse(localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS) || '[]');
    // Return all announcements for staff view
    return announcements.sort((a: Announcement, b: Announcement) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  createAnnouncement: async (announcement: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'>): Promise<Announcement> => {
    await simulateNetworkDelay();
    const announcements = JSON.parse(localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS) || '[]');
    
    const newAnnouncement: Announcement = {
      ...announcement,
      id: `ANN-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    announcements.push(newAnnouncement);
    localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(announcements));
    
    return newAnnouncement;
  },

  updateAnnouncement: async (id: string, updates: Partial<Omit<Announcement, 'id' | 'createdAt' | 'createdBy'>>): Promise<Announcement | null> => {
    await simulateNetworkDelay();
    const announcements = JSON.parse(localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS) || '[]');
    const index = announcements.findIndex((a: Announcement) => a.id === id);
    
    if (index === -1) return null;
    
    announcements[index] = {
      ...announcements[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(announcements));
    return announcements[index];
  },

  deleteAnnouncement: async (id: string): Promise<boolean> => {
    await simulateNetworkDelay();
    const announcements = JSON.parse(localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS) || '[]');
    const filteredAnnouncements = announcements.filter((a: Announcement) => a.id !== id);
    
    if (filteredAnnouncements.length === announcements.length) return false;
    
    localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(filteredAnnouncements));
    return true;
  },
  
  // System settings methods
  getCommissionRate: async (): Promise<number> => {
    await simulateNetworkDelay();
    const settings = JSON.parse(localStorage.getItem(STORAGE_KEYS.SYSTEM_SETTINGS) || '{}');
    return settings.commissionRatePerKg || 0.50;
  },
  
  updateCommissionRate: async (ratePerKg: number): Promise<void> => {
    await simulateNetworkDelay();
    const settings = JSON.parse(localStorage.getItem(STORAGE_KEYS.SYSTEM_SETTINGS) || '{}');
    settings.commissionRatePerKg = ratePerKg;
    localStorage.setItem(STORAGE_KEYS.SYSTEM_SETTINGS, JSON.stringify(settings));
  }
};