import React, { useEffect, useState, createContext, useContext } from 'react';
import { DataService } from '../services/DataService';
import { supabaseDataService } from '../services/SupabaseDataService';
import type { QuoteRequest, Quote, Shipment, Invoice } from '../services/SupabaseDataService';
import { DATABASE_CONFIG } from '../config/database';

// Use configuration from database.ts
const USE_SUPABASE = DATABASE_CONFIG.USE_SUPABASE;

type DataContextType = {
  initialized: boolean;
  quoteRequests: QuoteRequest[];
  quotes: Quote[];
  shipments: Shipment[];
  invoices: Invoice[];
  refreshData: () => Promise<void>;
  isLoading: boolean;
  dataSource: 'localStorage' | 'supabase';
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [initialized, setInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [quoteRequests, setQuoteRequests] = useState<QuoteRequest[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [dataSource] = useState<'localStorage' | 'supabase'>(USE_SUPABASE ? 'supabase' : 'localStorage');

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      if (USE_SUPABASE) {
        // Use Supabase-backed service
        console.log('📊 Using Supabase database for data storage');

        const [fetchedRequests, fetchedQuotes, fetchedShipments, fetchedInvoices] = await Promise.all([
          supabaseDataService.getAllQuoteRequests(),
          supabaseDataService.getAllQuotes(),
          supabaseDataService.getAllShipments(),
          supabaseDataService.getAllInvoices()
        ]);

        setQuoteRequests(fetchedRequests);
        setQuotes(fetchedQuotes);
        // Map shipments to ensure invoice and documents fields are included
        setShipments(fetchedShipments.map(shipment => ({
          ...shipment,
          documents: shipment.documents || [],
          invoice: shipment.invoice || null,
          destinations: shipment.destinations || [],
          photos: shipment.photos || []
        })));
        setInvoices(fetchedInvoices);
      } else {
        // Use localStorage-backed service (fallback)
        console.log('💾 Using localStorage for data storage (fallback mode)');

        const [fetchedRequests, fetchedQuotes, fetchedShipments] = await Promise.all([
          DataService.getQuoteRequests(),
          DataService.getQuotes(),
          DataService.getShipments()
        ]);

        // Convert old format to new format for compatibility
        const convertedRequests = fetchedRequests.map(req => ({
          ...req,
          customerId: req.customerId,
          serviceType: req.serviceType || 'Air Freight',
          pickupLocation: req.pickupLocation,
          destinationWarehouses: req.destinationWarehouses,
          cargoReadyDate: req.cargoReadyDate,
          totalWeight: req.totalWeight || 0,
          totalVolume: req.totalVolume || 0,
          totalCartons: req.totalCartons || 0,
          specialRequirements: req.specialRequirements,
          status: req.status,
          createdAt: req.createdAt,
          updatedAt: req.updatedAt
        }));

        const convertedQuotes = fetchedQuotes.map(quote => ({
          id: quote.id,
          requestId: quote.requestId,
          customerId: quote.customerId,
          staffId: quote.staffId,
          freightCost: quote.freightCost || 0,
          insuranceCost: quote.insuranceCost || 0,
          additionalCharges: quote.additionalCharges || [],
          totalAmount: quote.totalAmount,
          validUntil: quote.validUntil,
          status: quote.status as 'Pending' | 'Accepted' | 'Rejected' | 'Expired',
          perWarehouseCosts: quote.perWarehouseCosts,
          commissionRatePerKg: quote.commissionRatePerKg,
          notes: quote.notes,
          createdAt: quote.createdAt,
          updatedAt: quote.updatedAt
        }));

        const convertedShipments = fetchedShipments.map(shipment => ({
          id: shipment.id,
          quoteId: shipment.quoteId,
          customerId: shipment.customerId,
          status: shipment.status,
          origin: shipment.origin,
          destination: shipment.destination,
          cargoDetails: shipment.cargoDetails,
          estimatedWeight: shipment.estimatedWeight || 0,
          actualWeight: shipment.actualWeight,
          estimatedDelivery: shipment.estimatedDelivery,
          actualDelivery: shipment.actualDelivery,
          trackingNumber: shipment.trackingNumber,
          createdAt: shipment.createdAt,
          updatedAt: shipment.updatedAt,
          // Include documents and invoice fields
          documents: shipment.documents || [],
          invoice: shipment.invoice || null,
          destinations: shipment.destinations || [],
          photos: shipment.photos || []
        }));

        setQuoteRequests(convertedRequests);
        setQuotes(convertedQuotes);
        setShipments(convertedShipments);
        setInvoices([]); // localStorage doesn't have invoices yet
      }
    } catch (error) {
      console.error('Error fetching data:', error);

      // If Supabase fails, try localStorage as fallback
      if (USE_SUPABASE) {
        console.warn('Supabase failed, falling back to localStorage');
        try {
          const [fetchedRequests, fetchedQuotes, fetchedShipments] = await Promise.all([
            DataService.getQuoteRequests(),
            DataService.getQuotes(),
            DataService.getShipments()
          ]);

          // Convert and set data as above
          setQuoteRequests(fetchedRequests.map(req => ({
            ...req,
            customerId: req.customerId,
            serviceType: req.serviceType || 'Air Freight',
            pickupLocation: req.pickupLocation,
            destinationWarehouses: req.destinationWarehouses,
            cargoReadyDate: req.cargoReadyDate,
            totalWeight: req.totalWeight || 0,
            totalVolume: req.totalVolume || 0,
            totalCartons: req.totalCartons || 0,
            specialRequirements: req.specialRequirements,
            status: req.status,
            createdAt: req.createdAt,
            updatedAt: req.updatedAt
          })));

          setQuotes(fetchedQuotes.map(quote => ({
            id: quote.id,
            requestId: quote.requestId,
            customerId: quote.customerId,
            staffId: quote.staffId,
            freightCost: quote.freightCost || 0,
            insuranceCost: quote.insuranceCost || 0,
            additionalCharges: quote.additionalCharges || [],
            totalAmount: quote.totalAmount,
            validUntil: quote.validUntil,
            status: quote.status as 'Pending' | 'Accepted' | 'Rejected' | 'Expired',
            perWarehouseCosts: quote.perWarehouseCosts,
            commissionRatePerKg: quote.commissionRatePerKg,
            notes: quote.notes,
            createdAt: quote.createdAt,
            updatedAt: quote.updatedAt
          })));

          setShipments(fetchedShipments.map(shipment => ({
            id: shipment.id,
            quoteId: shipment.quoteId,
            customerId: shipment.customerId,
            status: shipment.status,
            origin: shipment.origin,
            destination: shipment.destination,
            cargoDetails: shipment.cargoDetails,
            estimatedWeight: shipment.estimatedWeight || 0,
            actualWeight: shipment.actualWeight,
            estimatedDelivery: shipment.estimatedDelivery,
            actualDelivery: shipment.actualDelivery,
            trackingNumber: shipment.trackingNumber,
            createdAt: shipment.createdAt,
            updatedAt: shipment.updatedAt,
            // Include documents and invoice fields
            documents: shipment.documents || [],
            invoice: shipment.invoice || null,
            destinations: shipment.destinations || [],
            photos: shipment.photos || []
          })));

          setInvoices([]);
        } catch (fallbackError) {
          console.error('Fallback to localStorage also failed:', fallbackError);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      try {
        await fetchAllData();
        setInitialized(true);

        // Log data source on initialization
        if (USE_SUPABASE) {
          console.log('✅ FreightShark is now using Supabase database');
          console.log('📍 Data is stored in the cloud and synchronized across sessions');
        } else {
          console.log('💾 FreightShark is using localStorage (offline mode)');
          console.log('⚠️ Data is stored locally and not synchronized');
        }
      } catch (error) {
        console.error('Failed to initialize data:', error);
        setInitialized(true); // Still allow app to work
      }
    };

    initializeData();
  }, []);

  const refreshData = async () => {
    await fetchAllData();

    // Clear cache if using Supabase
    if (USE_SUPABASE) {
      supabaseDataService.clearCache();
    }
  };

  return (
    <DataContext.Provider
      value={{
        initialized,
        quoteRequests,
        quotes,
        shipments,
        invoices,
        refreshData,
        isLoading,
        dataSource
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};