import React, { useEffect, useState, createContext, useContext } from 'react';
import { DataService } from '../services/DataService';
import type { QuoteRequest, Quote, Shipment, User } from '../services/DataService';
type DataContextType = {
  initialized: boolean;
  quoteRequests: QuoteRequest[];
  quotes: Quote[];
  shipments: Shipment[];
  refreshData: () => Promise<void>;
  isLoading: boolean;
};
const DataContext = createContext<DataContextType | undefined>(undefined);
export const DataProvider: React.FC<{
  children: React.ReactNode;
}> = ({
  children
}) => {
  const [initialized, setInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [quoteRequests, setQuoteRequests] = useState<QuoteRequest[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [fetchedRequests, fetchedQuotes, fetchedShipments] = await Promise.all([DataService.getQuoteRequests(), DataService.getQuotes(), DataService.getShipments()]);
      setQuoteRequests(fetchedRequests);
      setQuotes(fetchedQuotes);
      setShipments(fetchedShipments);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    const initializeData = async () => {
      try {
        await fetchAllData();
        setInitialized(true);
      } catch (error) {
        console.error('Failed to initialize data:', error);
        setInitialized(true); // Still allow app to work
      }
    };
    initializeData();
  }, []);
  const refreshData = async () => {
    await fetchAllData();
  };
  return <DataContext.Provider value={{
    initialized,
    quoteRequests,
    quotes,
    shipments,
    refreshData,
    isLoading
  }}>
      {children}
    </DataContext.Provider>;
};
export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};