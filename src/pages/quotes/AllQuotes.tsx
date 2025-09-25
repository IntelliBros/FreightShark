import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { FileTextIcon, ArrowRightIcon, ClockIcon, DollarSignIcon, SearchIcon, FilterIcon, CheckIcon, XIcon } from 'lucide-react';
import { DataService, QuoteRequest, Quote } from '../../services/DataService';
import { useToast } from '../../context/ToastContext';
import { useData } from '../../context/DataContextV2';
import { useAuth } from '../../context/AuthContext';
import PayeeDetailsModal, { PayeeDetails } from '../../components/PayeeDetailsModal';
type QuoteWithRequest = {
  request: QuoteRequest;
  quote?: Quote;
};
export const AllQuotes = () => {
  const {
    addToast
  } = useToast();
  const { refreshData, quotes: contextQuotes } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [quotes, setQuotes] = useState<QuoteWithRequest[]>([]);
  const [filteredQuotes, setFilteredQuotes] = useState<QuoteWithRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [processingQuotes, setProcessingQuotes] = useState<Set<string>>(new Set());
  const [animatingQuotes, setAnimatingQuotes] = useState<Set<string>>(new Set());
  const [showPayeeModal, setShowPayeeModal] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<{ quoteId: string; requestId: string } | null>(null);
  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        const customerId = user?.id || 'user-1';
        console.log('Fetching quotes for customer:', customerId);
        
        // Get all quote requests for the current user
        const requests = await DataService.getQuoteRequestsByCustomerId(customerId);
        console.log('Quote requests found:', requests.length, requests);
        
        // Get all quotes for the current user
        const userQuotes = await DataService.getQuotesByCustomerId(customerId);
        console.log('Quotes found:', userQuotes.length, userQuotes);
        
        // Combine requests and quotes, filtering out quotes that have been converted to shipments
        const combinedData: QuoteWithRequest[] = requests.map(request => {
          const matchingQuote = userQuotes.find(q => q.requestId === request.id);
          console.log(`Request ${request.id} has quote:`, !!matchingQuote);
          return {
            request,
            quote: matchingQuote
          };
        }).filter(item => {
          // Filter out quotes that have been converted to shipments
          return !item.quote || (item.quote.status !== 'Shipped' && item.quote.status !== 'Accepted');
        });
        
        console.log('Combined data:', combinedData);
        setQuotes(combinedData);
        setFilteredQuotes(combinedData);
      } catch (error) {
        console.error('Error fetching quotes:', error);
        addToast('Failed to load quotes', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuotes();
  }, [addToast, user?.id]);
  
  // Add effect to refetch when component receives focus (e.g., after navigation)
  useEffect(() => {
    const handleFocus = () => {
      const fetchQuotes = async () => {
        const customerId = user?.id || 'user-1';
        const requests = await DataService.getQuoteRequestsByCustomerId(customerId);
        const userQuotes = await DataService.getQuotesByCustomerId(customerId);
        const combinedData: QuoteWithRequest[] = requests.map(request => {
          const matchingQuote = userQuotes.find(q => q.requestId === request.id);
          return {
            request,
            quote: matchingQuote
          };
        }).filter(item => {
          return !item.quote || (item.quote.status !== 'Shipped' && item.quote.status !== 'Accepted');
        });
        setQuotes(combinedData);
        setFilteredQuotes(combinedData);
      };
      fetchQuotes();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user]);
  useEffect(() => {
    // Apply filters when search term or status filter changes
    let filtered = [...quotes];
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.request.id.toLowerCase().includes(search) || 
        (item.request.supplierDetails?.name && item.request.supplierDetails.name.toLowerCase().includes(search)) ||
        (item.request.pickup_location && item.request.pickup_location.toLowerCase().includes(search))
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.request.status === statusFilter);
    }
    setFilteredQuotes(filtered);
  }, [searchTerm, statusFilter, quotes]);
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Date not available';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Date not available';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  const handleAcceptQuote = (quoteId: string, requestId: string) => {
    // Store the selected quote info and show the modal
    setSelectedQuote({ quoteId, requestId });
    setShowPayeeModal(true);
  };

  const handlePayeeDetailsSubmit = async (payeeDetails: PayeeDetails) => {
    if (!selectedQuote) return;

    const { quoteId, requestId } = selectedQuote;
    setShowPayeeModal(false);

    try {
      console.log('Accepting quote with payee details:', quoteId, 'for request:', requestId);

      // Add to processing set to show loading state
      setProcessingQuotes(prev => new Set([...prev, requestId]));

      // Update quote with payee details and status
      await DataService.updateQuote(quoteId, {
        status: 'Accepted',
        payeeDetails: payeeDetails
      });

      // Convert the approved quote to a shipment
      const shipment = await DataService.convertQuoteToShipment(quoteId);
      console.log('Shipment created:', shipment);

      if (shipment) {
        // Add to animating set for fade-out effect
        setAnimatingQuotes(prev => new Set([...prev, requestId]));

        // Show success message immediately
        addToast('Quote accepted successfully! Your shipment has been created and is being processed.', 'success');

        // Wait for animation to complete before removing from list
        setTimeout(async () => {
          // Refresh data context to ensure shipments are updated
          await refreshData();
          // Update local state to remove the quote from the list (since it's now a shipment)
          setQuotes(prev => prev.filter(item => item.request.id !== requestId));
          setAnimatingQuotes(prev => {
            const newSet = new Set(prev);
            newSet.delete(requestId);
            return newSet;
          });
          // Navigate to shipments page
          navigate('/shipments');
        }, 500);
      } else {
        addToast('Failed to create shipment from quote. Please contact support.', 'error');
      }
    } catch (error) {
      console.error('Error accepting quote:', error);
      addToast('Failed to accept quote. Please try again.', 'error');
    } finally {
      // Remove from processing set
      setProcessingQuotes(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
      setSelectedQuote(null);
    }
  };
  const handleRejectQuote = async (quoteId: string, requestId: string) => {
    try {
      // Add to processing set to show loading state
      setProcessingQuotes(prev => new Set([...prev, requestId]));
      
      // Update quote status
      await DataService.updateQuote(quoteId, {
        status: 'Rejected'
      });
      // Update request status
      await DataService.updateQuoteRequest(requestId, {
        status: 'Quote Rejected'
      });
      
      // Add to animating set for fade effect
      setAnimatingQuotes(prev => new Set([...prev, requestId]));
      
      // Wait for animation before updating state
      setTimeout(() => {
        // Update local state
        setQuotes(prev => prev.map(item => {
          if (item.request.id === requestId) {
            return {
              ...item,
              request: {
                ...item.request,
                status: 'Quote Rejected'
              },
              quote: item.quote ? {
                ...item.quote,
                status: 'Rejected'
              } : undefined
            };
          }
          return item;
        }));
        setAnimatingQuotes(prev => {
          const newSet = new Set(prev);
          newSet.delete(requestId);
          return newSet;
        });
      }, 300);
      
      addToast('Quote rejected. You can request a new quote if needed.', 'info');
    } catch (error) {
      addToast('Failed to reject quote. Please try again.', 'error');
    } finally {
      // Remove from processing set
      setProcessingQuotes(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Quotes</h1>
        <p className="text-gray-600 mt-1">
          View and manage all your shipping quotes
        </p>
      </div>
      <div className="mb-6 flex flex-col md:flex-row justify-between gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="Search by ID or supplier" />
        </div>
        <div className="flex items-center space-x-2">
          <FilterIcon className="h-5 w-5 text-gray-400" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="block pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
            <option value="all">All Statuses</option>
            <option value="Awaiting Quote">Awaiting Quote</option>
            <option value="Quote Provided">Quote Provided</option>
            <option value="Quote Accepted">Quote Accepted</option>
            <option value="Quote Rejected">Quote Rejected</option>
          </select>
        </div>
      </div>
      {filteredQuotes.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <FileTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">
              No quotes found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              You don't have any quotes matching your criteria.
            </p>
            <div className="mt-6">
              <Link to="/quotes/new">
                <Button variant="primary">Create New Quote Request</Button>
              </Link>
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredQuotes.map(item => (
            <Card key={item.request.id} className={`p-4 transition-all duration-500 ${animatingQuotes.has(item.request.id) ? 'opacity-0 transform scale-95' : 'opacity-100 transform scale-100'}`}>
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Quote ID and Supplier Info */}
                <div className="flex-shrink-0 lg:w-64">
                  <div className="flex items-start justify-between lg:block">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <FileTextIcon className="h-4 w-4 text-gray-400" />
                        <h3 className="text-base font-semibold text-gray-900">
                          {item.request.id}
                        </h3>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p className="font-medium">
                          {item.request.supplierDetails?.name || 'Unknown Supplier'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.request.supplierDetails?.city ? 
                            `${item.request.supplierDetails.city}, ${item.request.supplierDetails.country}` :
                            item.request.pickup_location || 'Location not specified'
                          }
                        </p>
                      </div>
                    </div>
                    <div className="lg:mt-3">
                      <Badge variant={item.request.status === 'Awaiting Quote' ? 'warning' : item.request.status === 'Quote Provided' ? 'info' : item.request.status === 'Quote Accepted' ? 'success' : 'error'}>
                        {item.request.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Destinations */}
                <div className="flex-1">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Destinations
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {(() => {
                      // Extract destinations array from various possible structures
                      let destinations = [];
                      if (item.request.destinations && Array.isArray(item.request.destinations)) {
                        destinations = item.request.destinations;
                      } else if (item.request.destination_warehouses) {
                        if (Array.isArray(item.request.destination_warehouses)) {
                          destinations = item.request.destination_warehouses;
                        } else if (item.request.destination_warehouses.destinations && Array.isArray(item.request.destination_warehouses.destinations)) {
                          destinations = item.request.destination_warehouses.destinations;
                        }
                      } else if (item.request.quote_request_warehouses && Array.isArray(item.request.quote_request_warehouses)) {
                        destinations = item.request.quote_request_warehouses;
                      }
                      
                      if (destinations.length === 0) {
                        return <p className="text-sm text-gray-500">No destinations specified</p>;
                      }
                      
                      return destinations.map((dest: any, index: number) => (
                        <div key={dest.id || index} className="bg-gray-50 rounded-lg px-3 py-2 min-w-[120px]">
                          <p className="text-sm font-semibold text-gray-900">
                            {dest.fbaWarehouse || dest.fba_warehouse_code || dest.warehouses?.fba_warehouse_code || 'Unnamed'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {dest.cartons || dest.cartons_count || 0} cartons
                          </p>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                {/* Timeline and Actions */}
                <div className="flex-shrink-0 lg:w-56 lg:text-right">
                  <div className="space-y-2 mb-3">
                    <div className="text-sm">
                      <span className="text-gray-500">Requested:</span>
                      <p className="font-medium text-gray-900">{formatDate(item.request.requestedDate)}</p>
                    </div>
                    {item.quote && (
                      <div className="text-sm">
                        <span className="text-gray-500">Quote:</span>
                        <p className="font-semibold text-blue-600 text-lg">
                          ${item.quote.total.toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>
                  {item.request.status === 'Awaiting Quote' ? (
                    <div className="flex items-center justify-end text-sm text-yellow-600">
                      <ClockIcon className="h-3.5 w-3.5 mr-1" />
                      <span className="text-xs">Waiting for quote</span>
                    </div>
                  ) : item.request.status === 'Quote Provided' && item.quote ? (
                    <div className="flex space-x-2">
                      <button 
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full lg:w-auto justify-center"
                        onClick={() => handleAcceptQuote(item.quote!.id, item.request.id)}
                        disabled={processingQuotes.has(item.request.id)}
                      >
                        {processingQuotes.has(item.request.id) ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CheckIcon className="h-4 w-4 mr-1" />
                            Accept
                          </>
                        )}
                      </button>
                      <button 
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full lg:w-auto justify-center"
                        onClick={() => handleRejectQuote(item.quote!.id, item.request.id)}
                        disabled={processingQuotes.has(item.request.id)}
                      >
                        {processingQuotes.has(item.request.id) ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        ) : (
                          <>
                            <XIcon className="h-4 w-4 mr-1" />
                            Reject
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <Link to={`/quotes/${item.request.id}`}>
                      <Button variant="primary" size="sm">
                        View Details
                        <ArrowRightIcon className="ml-1 h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Payee Details Modal */}
      {showPayeeModal && selectedQuote && (
        <PayeeDetailsModal
          isOpen={showPayeeModal}
          onClose={() => {
            setShowPayeeModal(false);
            setSelectedQuote(null);
          }}
          onSubmit={handlePayeeDetailsSubmit}
          initialEmail={user?.email}
        />
      )}
    </div>
  );
};