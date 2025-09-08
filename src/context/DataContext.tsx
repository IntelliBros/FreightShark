import React, { useEffect, useState, createContext, useContext } from 'react';
import { DataService, User, QuoteRequest, Quote, Shipment } from '../services/DataService';
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
      DataService.initialize();
      await fetchAllData();
      setInitialized(true);
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