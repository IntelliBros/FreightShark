import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { CalendarIcon, FileTextIcon, ArrowRightIcon, ClockIcon, SearchIcon, FilterIcon } from 'lucide-react';
import { DataService, QuoteRequest } from '../../../services/DataService';
import { useToast } from '../../../context/ToastContext';
export const QuoteRequests = () => {
  const navigate = useNavigate();
  const {
    addToast
  } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [quoteRequests, setQuoteRequests] = useState<QuoteRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<QuoteRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  useEffect(() => {
    const fetchQuoteRequests = async () => {
      try {
        const requests = await DataService.getQuoteRequests();
        // Only show requests that are awaiting quotes
        const pendingRequests = requests.filter(req => req.status === 'Awaiting Quote');
        setQuoteRequests(pendingRequests);
        setFilteredRequests(pendingRequests);
      } catch (error) {
        addToast('Failed to load quote requests', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuoteRequests();
  }, [addToast]);
  useEffect(() => {
    // Apply filters when search term or status filter changes
    let filtered = [...quoteRequests];
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(request => 
        request.id.toLowerCase().includes(search) || 
        (request.customer?.company?.toLowerCase().includes(search)) || 
        (request.supplierDetails?.name?.toLowerCase().includes(search))
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(request => request.status === statusFilter);
    }
    setFilteredRequests(filtered);
  }, [searchTerm, statusFilter, quoteRequests]);
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  const getDaysRemaining = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };
  const handleProvideQuote = (requestId: string) => {
    navigate(`/staff/quotes/provide/${requestId}`);
  };
  if (isLoading) {
    return <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>;
  }
  return <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quote Requests</h1>
      </div>
      <div className="mb-6 flex flex-col md:flex-row justify-between gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="Search by ID, customer, or supplier" />
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
      {filteredRequests.length === 0 ? <Card>
          <div className="text-center py-8">
            <FileTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">
              No quote requests found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              There are no pending quote requests matching your criteria.
            </p>
          </div>
        </Card> : <div className="space-y-4">
          {filteredRequests.map(request => <Card key={request.id}>
              <div className="flex flex-col md:flex-row justify-between">
                <div className="md:w-1/4 mb-4 md:mb-0">
                  <div className="flex items-center mb-2">
                    <FileTextIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <h3 className="text-lg font-medium text-gray-900">
                      {request.id}
                    </h3>
                  </div>
                  <div className="text-sm text-gray-500">
                    <p className="mb-1">{request.customer?.company || 'Unknown Company'}</p>
                    <p>{request.customer?.name || 'Unknown Customer'}</p>
                  </div>
                  <div className="mt-2">
                    <Badge variant={request.status === 'Awaiting Quote' ? 'warning' : 'success'}>
                      {request.status}
                    </Badge>
                  </div>
                </div>
                <div className="md:w-1/4 mb-4 md:mb-0">
                  <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">
                    Service & Cargo
                  </h4>
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    {request.serviceType}
                  </p>
                  <p className="text-sm text-gray-600">
                    {request.cargoDetails?.cartonCount || 0} cartons •{' '}
                    {(request.cargoDetails?.grossWeight || 0).toFixed(2)} kg •{' '}
                    {request.cargoDetails?.cbm || 0} CBM
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    From: {request.supplierDetails?.city || 'Unknown'},{' '}
                    {request.supplierDetails?.country || 'Unknown'}
                  </p>
                </div>
                <div className="md:w-1/4 mb-4 md:mb-0">
                  <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">
                    Destinations
                  </h4>
                  <div className="space-y-1">
                    {request.destinations?.map((dest, index) => <p key={dest.id} className="text-sm text-gray-600">
                        {dest.fbaWarehouse}{' '}
                        <span className="text-gray-400">
                          ({dest.cartons} cartons)
                        </span>
                      </p>) || <p className="text-sm text-gray-500">No destinations</p>}
                  </div>
                </div>
                <div className="md:w-1/4 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">
                      Timeline
                    </h4>
                    <div className="flex items-center text-sm text-gray-600 mb-1">
                      <CalendarIcon className="h-4 w-4 text-gray-400 mr-1" />
                      <span>
                        Requested: {formatDate(request.requestedDate)}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <ClockIcon className="h-4 w-4 text-gray-400 mr-1" />
                      <span className={`${getDaysRemaining(request.dueBy) < 2 ? 'text-red-600 font-medium' : ''}`}>
                        Due: {formatDate(request.dueBy)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Button variant="primary" onClick={() => handleProvideQuote(request.id)}>
                      Provide Quote
                      <ArrowRightIcon className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>)}
        </div>}
    </div>;
};