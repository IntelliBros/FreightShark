import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { FileTextIcon, SearchIcon, FilterIcon, ChevronDownIcon, CheckCircleIcon, DownloadIcon } from 'lucide-react';
import { DataService, Quote, QuoteRequest, User } from '../../../services/DataService';
import { useToast } from '../../../context/ToastContext';
interface ApprovedQuoteDetails {
  quote: Quote;
  request: QuoteRequest | null;
  customer: User | null;
}

export const ApprovedQuotes = () => {
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { addToast } = useToast();
  const [approvedQuotes, setApprovedQuotes] = useState<ApprovedQuoteDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApprovedQuotes = async () => {
      setLoading(true);
      try {
        // Get all quotes with Accepted status (but not Shipped)
        const allQuotes = await DataService.getQuotes();
        const acceptedQuotes = allQuotes.filter(q => q.status === 'Accepted');
        
        // For each accepted quote, get the related request and customer info
        const quotesWithDetails = await Promise.all(
          acceptedQuotes.map(async (quote) => {
            const request = await DataService.getQuoteRequestById(quote.requestId);
            const customer = await DataService.getUserById(quote.customerId);
            return {
              quote,
              request,
              customer
            };
          })
        );
        
        setApprovedQuotes(quotesWithDetails);
      } catch (error) {
        console.error('Error fetching approved quotes:', error);
        addToast('Failed to load approved quotes', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchApprovedQuotes();
  }, [addToast]);

  const filteredQuotes = approvedQuotes.filter(item => {
    if (searchTerm === '') return true;
    const searchLower = searchTerm.toLowerCase();
    const customerName = item.customer?.company || item.customer?.name || '';
    const supplierName = item.request?.supplierDetails?.name || '';
    
    return (
      item.quote.id.toLowerCase().includes(searchLower) ||
      customerName.toLowerCase().includes(searchLower) ||
      supplierName.toLowerCase().includes(searchLower)
    );
  });
  return <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Approved Quotes</h1>
      </div>
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative flex-grow max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input type="text" className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="Search quotes by ID, customer, supplier..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setFilterOpen(!filterOpen)} className="flex items-center">
              <FilterIcon className="h-4 w-4 mr-1" />
              Filter
              <ChevronDownIcon className={`h-4 w-4 ml-1 transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
            </Button>
          </div>
        </div>
        {filterOpen && <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date Range
                </label>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-gray-500">From</label>
                    <input type="date" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500">To</label>
                    <input type="date" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shipping Mode
                </label>
                <div className="space-y-2">
                  {['Air Express', 'Air Freight', 'Sea Freight'].map(mode => <label key={mode} className="flex items-center">
                      <input type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                      <span className="ml-2 text-sm text-gray-700">{mode}</span>
                    </label>)}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Approved By
                </label>
                <select className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                  <option value="">All Staff</option>
                  <option>Sarah Chen</option>
                  <option>David Johnson</option>
                  <option>Michael Smith</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="tertiary" className="mr-2">
                Reset Filters
              </Button>
              <Button variant="primary">Apply Filters</Button>
            </div>
          </div>}
      </Card>
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredQuotes.length > 0 ? filteredQuotes.map(item => <div key={item.quote.id} className="bg-white border border-gray-200 hover:border-blue-300 rounded-lg shadow-sm transition p-5">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-2">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-3">
                      <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircleIcon className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center">
                        <h3 className="text-lg font-medium text-gray-900 mr-2">
                          {item.quote.id}
                        </h3>
                        <Badge variant="success">{item.quote.status}</Badge>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {item.customer?.company || item.customer?.name || 'Unknown Company'} • {item.customer?.email || 'No email'}
                      </p>
                      {item.request && (
                        <>
                          <div className="mt-2 text-sm text-gray-700">
                            <span className="text-gray-500">Supplier:</span>{' '}
                            {item.request.supplierDetails?.name || 'Unknown Supplier'}
                          </div>
                          <div className="mt-1 text-sm text-gray-700">
                            <span className="text-gray-500">Destinations:</span>{' '}
                            {item.request.destinations?.map(d => d.fbaWarehouse).join(', ') || 'No destinations'}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-sm">
                    <span className="text-gray-500 block">Created:</span>
                    <span className="text-gray-900">{item.quote.created_at ? new Date(item.quote.created_at).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="text-sm mt-2">
                    <span className="text-gray-500 block">Expires:</span>
                    <span className="text-gray-900">{item.quote.valid_until ? new Date(item.quote.valid_until).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
                <div>
                  <div className="text-sm">
                    <span className="text-gray-500 block">
                      Estimated Weight:
                    </span>
                    <span className="text-gray-900">
                      {item.request?.cargoDetails?.grossWeight || 0} kg
                    </span>
                  </div>
                  <div className="text-sm mt-2">
                    <span className="text-gray-500 block">Total Cost:</span>
                    <span className="font-medium text-blue-600">
                      ${item.quote.total.toFixed(2)}
                    </span>
                  </div>
                  <div className="mt-4 flex space-x-2">
                    <Link to={`/staff/quotes/${item.quote.id}`}>
                      <Button variant="primary">View Details</Button>
                    </Link>
                    <Button variant="secondary">
                      <DownloadIcon className="h-4 w-4 mr-1" />
                      PDF
                    </Button>
                  </div>
                </div>
              </div>
            </div>) : <Card>
            <div className="text-center py-12">
              <FileTextIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                No approved quotes found
              </h3>
              <p className="text-gray-500 mb-4">
                No approved quotes match your search criteria
              </p>
              <Button variant="primary" onClick={() => setSearchTerm('')}>
                Clear Search
              </Button>
            </div>
          </Card>}
      </div>
    </div>;
};