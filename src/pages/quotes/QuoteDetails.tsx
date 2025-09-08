import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ChatPanel } from '../../components/chat/ChatPanel';
import { FileTextIcon, TruckIcon, CheckCircleIcon, ClockIcon, DownloadIcon, MessageCircleIcon, CreditCardIcon, AlertCircleIcon, ChevronRightIcon, ChevronDownIcon, XIcon } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { DataService } from '../../services/DataService';
import { useData } from '../../context/DataContext';

// Mock quote data
const MOCK_QUOTE = {
  id: 'Q-3456',
  status: 'Finalized',
  createdAt: '2023-11-01',
  expiresAt: '2023-11-08',
  supplier: {
    name: 'Guangzhou Electronics Co.',
    address: '123 Industrial Park, Guangzhou, China'
  },
  pickupDate: '2023-11-10',
  pickupTime: '09:00-12:00',
  masterCargo: {
    grossWeight: 450,
    cartonCount: 30,
    pallets: 0,
    dimensions: {
      length: 40,
      width: 30,
      height: 20,
      unit: 'cm'
    },
    volumetricWeight: 400,
    chargeableWeight: 450
  },
  destinations: [{
    id: 'dest-1',
    amazonShipmentId: 'FBA15ABCDE',
    fbaWarehouse: 'FBA ONT8',
    address: '1600 Discovery Drive, Moreno Valley, CA 92551, USA',
    cartons: 20,
    grossWeight: 300,
    volumetricWeight: 280,
    chargeableWeight: 300,
    eta: '2023-11-25'
  }, {
    id: 'dest-2',
    amazonShipmentId: 'FBA15FGHIJ',
    fbaWarehouse: 'FBA BFI4',
    address: '2700 Center Dr, DuPont, WA 98327, USA',
    cartons: 10,
    grossWeight: 150,
    volumetricWeight: 120,
    chargeableWeight: 150,
    eta: '2023-11-27'
  }],
  serviceMode: 'air-express',
  pricing: {
    baseRate: 12.5,
    fuelSurcharge: 1.2,
    customsFee: 150,
    lastMileFee: 200,
    totalCost: 6125.0
  },
  documents: [{
    id: 'doc-1',
    name: 'Commercial Invoice.pdf',
    type: 'invoice'
  }, {
    id: 'doc-2',
    name: 'Packing List.xlsx',
    type: 'packing-list'
  }],
  timeline: [{
    date: '2023-11-01 14:32',
    event: 'Quote created',
    user: 'John Doe'
  }, {
    date: '2023-11-02 09:15',
    event: 'Quote reviewed by agent',
    user: 'Agent Smith'
  }, {
    date: '2023-11-02 10:30',
    event: 'Quote finalized',
    user: 'Agent Smith'
  }]
};

export const QuoteDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    pricing: true,
    destinations: true,
    documents: true,
    timeline: true
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  
  // Check if user is staff based on the current route
  const isStaffView = location.pathname.startsWith('/staff');
  
  // In a real app, we'd fetch the quote data based on the ID
  const quote = MOCK_QUOTE;
  
  const toggleSection = (section: string) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section as keyof typeof expandedSections]
    });
  };
  
  const { refreshData } = useData();
  
  const handleAcceptQuote = async () => {
    setIsLoading(true);
    try {
      // Update quote status to Accepted first
      await DataService.updateQuote(id!, {
        status: 'Accepted'
      });
      
      // Convert the approved quote to a shipment
      const shipment = await DataService.convertQuoteToShipment(id!);
      
      if (shipment) {
        // Refresh data context to ensure shipments are updated
        await refreshData();
        addToast('Quote accepted successfully! Your shipment has been created and is being processed.', 'success');
        // Navigate to shipments list instead of individual shipment
        navigate('/shipments');
      } else {
        addToast('Failed to create shipment from quote. Please contact support.', 'error');
      }
    } catch (error) {
      console.error('Error accepting quote:', error);
      addToast('Failed to accept quote. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeclineQuote = () => {
    setShowDeclineModal(true);
  };
  
  const handleConfirmDecline = async () => {
    if (!declineReason.trim()) {
      addToast('Please provide a reason for declining the quote.', 'error');
      return;
    }
    
    if (!acceptTerms) {
      addToast('Please accept the cancellation terms to proceed.', 'error');
      return;
    }
    
    setIsLoading(true);
    try {
      // Update quote status to Declined/Rejected
      await DataService.updateQuote(id!, {
        status: 'Rejected'
      });
      
      addToast('Quote declined successfully.', 'success');
      setShowDeclineModal(false);
      navigate('/quotes');
    } catch (error) {
      console.error('Error declining quote:', error);
      addToast('Failed to decline quote. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDuplicateQuote = () => {
    navigate('/quotes/new');
    addToast('Quote details copied to a new quote.', 'success');
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft':
        return 'default';
      case 'Pending Review':
        return 'warning';
      case 'Finalized':
        return 'info';
      case 'Accepted':
        return 'success';
      case 'Expired':
        return 'danger';
      default:
        return 'default';
    }
  };
  
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Quote {id}</h1>
          <Badge variant={getStatusColor(quote.status) as any}>
            {quote.status}
          </Badge>
        </div>
        <p className="text-gray-600 mt-1">
          Created on {quote.createdAt} • Expires on {quote.expiresAt}
        </p>
      </div>

      <div className="mb-6 border-b border-gray-200">
        <nav className="flex -mb-px">
          <button
            className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'documents'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('documents')}
          >
            Documents
          </button>
        </nav>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-medium text-gray-900">
                Quote Summary
              </h2>
              <div className="text-sm text-gray-500">
                <span className="mr-1">Expires:</span>
                <span className="font-medium text-gray-900">
                  {quote.expiresAt}
                </span>
              </div>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Supplier
                  </h3>
                  <p className="text-gray-900">{quote.supplier.name}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {quote.supplier.address}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Pickup Details
                  </h3>
                  <p className="text-gray-900">{quote.pickupDate}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Time window: {quote.pickupTime}
                  </p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Master Cargo
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <span className="text-xs text-gray-500">Gross Weight</span>
                    <p className="text-gray-900">
                      {quote.masterCargo.grossWeight} kg
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Carton Count</span>
                    <p className="text-gray-900">
                      {quote.masterCargo.cartonCount}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">
                      Volumetric Weight
                    </span>
                    <p className="text-gray-900">
                      {quote.masterCargo.volumetricWeight} kg
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">
                      Chargeable Weight
                    </span>
                    <p className="font-medium text-blue-600">
                      {quote.masterCargo.chargeableWeight} kg
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Service Mode
                </h3>
                <div className="flex items-center">
                  <Badge variant="info" className="mr-2">
                    {quote.serviceMode === 'air-express'
                      ? 'Air Express'
                      : quote.serviceMode === 'air-freight'
                      ? 'Air Freight'
                      : 'Sea Freight'}
                  </Badge>
                  <span className="text-gray-700 text-sm">
                    {quote.serviceMode === 'air-express'
                      ? '5-7 days transit time'
                      : quote.serviceMode === 'air-freight'
                      ? '8-12 days transit time'
                      : '30-35 days transit time'}
                  </span>
                </div>
              </div>
              <div>
                <button
                  type="button"
                  className="flex justify-between items-center w-full text-left"
                  onClick={() => toggleSection('pricing')}
                >
                  <h3 className="text-sm font-medium text-gray-900">
                    Pricing Breakdown
                  </h3>
                  {expandedSections.pricing ? (
                    <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronRightIcon className="h-5 w-5 text-gray-500" />
                  )}
                </button>
                {expandedSections.pricing && (
                  <div className="mt-3 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Base DDP Rate:</span>
                      <span className="text-gray-900">
                        ${quote.pricing.baseRate.toFixed(2)} per kg
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Chargeable Weight:</span>
                      <span className="text-gray-900">
                        {quote.masterCargo.chargeableWeight} kg
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Base Shipping Cost:</span>
                      <span className="text-gray-900">
                        $
                        {(
                          quote.pricing.baseRate *
                          quote.masterCargo.chargeableWeight
                        ).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Fuel Surcharge:</span>
                      <span className="text-gray-900">
                        $
                        {(
                          quote.pricing.fuelSurcharge *
                          quote.masterCargo.chargeableWeight
                        ).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">
                        Customs Processing Fee:
                      </span>
                      <span className="text-gray-900">
                        ${quote.pricing.customsFee.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Last Mile Delivery:</span>
                      <span className="text-gray-900">
                        ${quote.pricing.lastMileFee.toFixed(2)}
                      </span>
                    </div>
                    <div className="border-t border-gray-200 pt-3 flex justify-between font-medium">
                      <span className="text-gray-900">Total:</span>
                      <span className="text-blue-600">
                        ${quote.pricing.totalCost.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <button
                  type="button"
                  className="flex justify-between items-center w-full text-left"
                  onClick={() => toggleSection('destinations')}
                >
                  <h3 className="text-sm font-medium text-gray-900">
                    Destinations ({quote.destinations.length})
                  </h3>
                  {expandedSections.destinations ? (
                    <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronRightIcon className="h-5 w-5 text-gray-500" />
                  )}
                </button>
                {expandedSections.destinations && (
                  <div className="mt-3 space-y-3">
                    {quote.destinations.map(dest => (
                      <div
                        key={dest.id}
                        className="border border-gray-200 rounded-lg p-3"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {dest.fbaWarehouse}
                            </h4>
                            <p className="text-sm text-gray-500 mt-1">
                              {dest.address}
                            </p>
                            <p className="text-sm text-gray-700 mt-2">
                              Shipment ID: {dest.amazonShipmentId}
                            </p>
                          </div>
                          <Badge variant="info">
                            {dest.chargeableWeight} kg
                          </Badge>
                        </div>
                        <div className="mt-3 flex items-center text-sm text-gray-700">
                          <ClockIcon className="h-4 w-4 text-gray-400 mr-1" />
                          <span>Estimated arrival: {dest.eta}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>
          <div className="space-y-6">
            {!isStaffView && (
              <Card>
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Actions
                </h2>
                <div className="space-y-3">
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={handleAcceptQuote}
                    isLoading={isLoading}
                  >
                    Accept Quote
                  </Button>
                  <Button
                    variant="danger"
                    fullWidth
                    onClick={handleDeclineQuote}
                  >
                    Decline Quote
                  </Button>
                  <Button
                    variant="tertiary"
                    fullWidth
                    onClick={handleDuplicateQuote}
                  >
                    Duplicate Quote
                  </Button>
                </div>
              </Card>
            )}
            <Card>
              <button
                type="button"
                className="flex justify-between items-center w-full text-left"
                onClick={() => toggleSection('timeline')}
              >
                <h2 className="text-lg font-medium text-gray-900">Timeline</h2>
                {expandedSections.timeline ? (
                  <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronRightIcon className="h-5 w-5 text-gray-500" />
                )}
              </button>
              {expandedSections.timeline && (
                <div className="mt-4 space-y-4">
                  {quote.timeline.map((event, index) => (
                    <div key={index} className="flex">
                      <div className="mr-3">
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            {index === 0 ? (
                              <FileTextIcon className="h-4 w-4 text-blue-600" />
                            ) : index === quote.timeline.length - 1 ? (
                              <CheckCircleIcon className="h-4 w-4 text-blue-600" />
                            ) : (
                              <ClockIcon className="h-4 w-4 text-blue-600" />
                            )}
                          </div>
                          {index < quote.timeline.length - 1 && (
                            <div className="w-0.5 bg-gray-200 h-full mt-2"></div>
                          )}
                        </div>
                      </div>
                      <div className="pb-4">
                        <p className="text-sm font-medium text-gray-900">
                          {event.event}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {event.date} by {event.user}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'documents' && (
        <Card>
          <h2 className="text-lg font-medium text-gray-900 mb-6">
            Quote Documents
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quote.documents.map(doc => (
              <div
                key={doc.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <FileTextIcon className="h-8 w-8 text-blue-500 mr-3" />
                    <div>
                      <h3 className="font-medium text-gray-900">{doc.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {doc.type === 'invoice'
                          ? 'Commercial Invoice'
                          : 'Packing List'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="text-blue-600 hover:text-blue-800"
                    title="Download"
                  >
                    <DownloadIcon className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    Uploaded on {quote.createdAt}
                  </span>
                  <button
                    type="button"
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
            <div className="border border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-2">
                <FileTextIcon className="h-6 w-6 text-blue-500" />
              </div>
              <h3 className="font-medium text-gray-900">Upload Document</h3>
              <p className="text-xs text-gray-500 mt-1 mb-3">
                Add additional documents to your quote
              </p>
              <Button variant="secondary" size="sm">
                Upload File
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Decline Quote Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Decline Quote</h3>
              <button
                onClick={() => {
                  setShowDeclineModal(false);
                  setDeclineReason('');
                  setAcceptTerms(false);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for declining <span className="text-red-500">*</span>
              </label>
              <textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                placeholder="Please provide a reason for declining this quote..."
              />
            </div>
            
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="text-sm font-semibold text-yellow-800 mb-2">Cancellation Terms</h4>
              <ul className="text-xs text-yellow-700 space-y-1 mb-3">
                <li>• This action cannot be undone</li>
                <li>• The quote will be marked as declined</li>
                <li>• You may request a new quote at any time</li>
                <li>• No charges will be applied for declining</li>
              </ul>
              
              <label className="flex items-start">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-0.5 mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-xs text-gray-700">
                  I understand and accept the cancellation terms
                </span>
              </label>
            </div>
            
            <div className="flex space-x-3">
              <Button
                variant="danger"
                fullWidth
                onClick={handleConfirmDecline}
                disabled={!declineReason.trim() || !acceptTerms}
                isLoading={isLoading}
              >
                Confirm Decline
              </Button>
              <Button
                variant="secondary"
                fullWidth
                onClick={() => {
                  setShowDeclineModal(false);
                  setDeclineReason('');
                  setAcceptTerms(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};