import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ChatPanel } from '../../components/chat/ChatPanel';
import { TruckIcon, PackageIcon, MapPinIcon, ClockIcon, FileTextIcon, MessageCircleIcon, ChevronRightIcon, ChevronDownIcon, DownloadIcon, CheckCircleIcon, AlertCircleIcon, ImageIcon, RefreshCwIcon, BoxIcon, ReceiptIcon, DollarSignIcon, CalendarIcon, CreditCardIcon } from 'lucide-react';
import { DataService, QuoteRequest } from '../../services/DataService';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

// Helper function to get warehouse addresses
const getWarehouseAddress = (fbaWarehouse: string): string => {
  const warehouseAddresses: Record<string, string> = {
    'FBA ONT8': '1600 Discovery Drive, Moreno Valley, CA 92551, USA',
    'FBA BFI4': '2700 Center Dr, DuPont, WA 98327, USA',
    'FBA MDW2': '250 Emerald Dr, Joliet, IL 60433, USA',
    'FBA PHX6': '4750 West Mohave St, Phoenix, AZ 85043, USA',
    'FBA RIC2': '5000 Commerce Way, Petersburg, VA 23803, USA'
  };
  return warehouseAddresses[fbaWarehouse] || 'Address not available';
};

export const ShipmentTracking = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { refreshData } = useData();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [activeDestination, setActiveDestination] = useState<string>('');
  const [expandedSections, setExpandedSections] = useState({
    timeline: true
  });
  const [shipment, setShipment] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: ''
  });
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [warehouseIds, setWarehouseIds] = useState<Record<string, { shipmentId: string; fbaId: string }>>({});
  const [isSavingIds, setIsSavingIds] = useState(false);
  
  const getProgressPercentage = (status: string, shipmentData?: any) => {
    // Status flow: Waiting for Pickup (20%) -> Invoice Payment (10%) -> Shipment IDs (10%) -> In Progress (40%) -> Delivered (20%)
    const currentShipment = shipmentData || shipment;
    
    // If invoice not paid yet
    if (currentShipment?.invoice?.status !== 'Paid') {
      if (status === 'Awaiting Pickup') {
        return 20; // Waiting for Pickup only
      }
      return 0;
    }
    
    // If invoice is paid but missing shipment IDs
    if (currentShipment?.invoice?.status === 'Paid' && 
        currentShipment?.destinations?.some((d: any) => !d.amazonShipmentId || d.amazonShipmentId === '')) {
      return 30; // Waiting for Pickup (20%) + Invoice Payment (10%)
    }
    
    // If invoice is paid and all IDs are provided
    if (currentShipment?.invoice?.status === 'Paid' && 
        currentShipment?.destinations?.every((d: any) => d.amazonShipmentId && d.amazonShipmentId !== '')) {
      // Check actual shipment status
      switch (status) {
        case 'Delivered':
          return 100; // All complete
        case 'Awaiting Pickup':
          return 40; // Waiting (20%) + Payment (10%) + IDs (10%)
        default:
          // Any other status with payment and IDs means "In Progress"
          // This includes 'In Transit', 'Customs', or any intermediate status
          return 80; // Waiting (20%) + Payment (10%) + IDs (10%) + In Progress (40%)
      }
    }
    
    // Fallback based on status only
    switch (status) {
      case 'Awaiting Pickup':
        return 20;
      case 'In Transit':
      case 'Customs':
        return 80;
      case 'Delivered':
        return 100;
      default:
        return 0;
    }
  };
  
  const handlePaymentSubmit = async () => {
    // Validate form
    if (!paymentForm.cardNumber || !paymentForm.cardHolder || !paymentForm.expiryDate || !paymentForm.cvv) {
      addToast('Please fill in all payment details', 'error');
      return;
    }
    
    // Validate card number (simple check for 16 digits)
    if (paymentForm.cardNumber.replace(/\s/g, '').length !== 16) {
      addToast('Please enter a valid 16-digit card number', 'error');
      return;
    }
    
    // Validate CVV (3 or 4 digits)
    if (paymentForm.cvv.length < 3 || paymentForm.cvv.length > 4) {
      addToast('Please enter a valid CVV', 'error');
      return;
    }
    
    setIsProcessingPayment(true);
    
    try {
      const paymentDetails = {
        ...paymentForm,
        cardNumber: paymentForm.cardNumber.replace(/\s/g, ''),
        amount: shipment.invoice.amount
      };
      
      await DataService.processInvoicePayment(id!, paymentDetails);
      
      addToast('Payment processed successfully!', 'success');
      setShowPaymentModal(false);
      setPaymentForm({
        cardNumber: '',
        cardHolder: '',
        expiryDate: '',
        cvv: ''
      });
      
      // Refresh entire shipment data to show updated invoice status and timeline
      const updatedShipmentData = await DataService.getShipmentById(id!);
      if (updatedShipmentData) {
        // Fetch related data for complete refresh if quoteId exists
        let quoteData = null;
        let quoteRequestData: QuoteRequest | null = null;
        
        if (updatedShipmentData.quoteId || updatedShipmentData.quote_id) {
          const quoteId = updatedShipmentData.quoteId || updatedShipmentData.quote_id;
          try {
            quoteData = await DataService.getQuoteById(quoteId);
            if (quoteData) {
              quoteRequestData = await DataService.getQuoteRequestById(quoteData.requestId);
            }
          } catch (error) {
            console.log('Could not fetch quote data:', error);
          }
        }
        
        const serviceMode = quoteRequestData?.serviceType === 'Air Express' ? 'air-express' : 
                          quoteRequestData?.serviceType === 'Air Freight' ? 'air-freight' : 
                          'ocean-lcl';
        
        // Update with complete transformed data including new timeline
        const transformedShipment = {
          ...shipment,
          invoice: updatedShipmentData.invoice,
          timeline: updatedShipmentData.trackingEvents.map((event: any) => ({
            date: new Date(event.timestamp || event.date).toLocaleString(),
            event: event.description,
            location: event.location,
            status: event.status,
            type: event.type || 'tracking'
          }))
        };
        
        setShipment(transformedShipment);
      }
      
      await refreshData();
    } catch (error: any) {
      addToast(error.message || 'Payment failed. Please try again.', 'error');
    } finally {
      setIsProcessingPayment(false);
    }
  };
  
  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    const chunks = cleaned.match(/.{1,4}/g) || [];
    return chunks.join(' ').substr(0, 19); // 16 digits + 3 spaces
  };
  
  const handleSaveWarehouseIds = async () => {
    console.log('Saving warehouse IDs:', warehouseIds);
    console.log('Current destinations:', shipment.destinations);
    
    // Validate all IDs are provided
    const missingIds = shipment.destinations.filter((dest: any) => {
      const ids = warehouseIds[dest.id];
      return !ids || !ids.shipmentId || !ids.fbaId;
    });
    
    if (missingIds.length > 0) {
      addToast('Please provide both Amazon Shipment ID and Amazon Reference ID for all warehouses', 'error');
      return;
    }
    
    // Validate Amazon Reference ID format (8 alphanumeric characters)
    const invalidRefIds = shipment.destinations.filter((dest: any) => {
      const ids = warehouseIds[dest.id];
      if (!ids?.fbaId) return false;
      // Check if it's exactly 8 characters and alphanumeric
      const refIdPattern = /^[A-Z0-9]{8}$/i;
      return !refIdPattern.test(ids.fbaId);
    });
    
    if (invalidRefIds.length > 0) {
      addToast('Amazon Reference ID must be exactly 8 alphanumeric characters (e.g., A2K9PL7X)', 'error');
      return;
    }
    
    setIsSavingIds(true);
    
    try {
      // Update shipment with the provided IDs
      const updatedDestinations = shipment.destinations.map((dest: any) => ({
        ...dest,
        amazonShipmentId: warehouseIds[dest.id]?.shipmentId || dest.amazonShipmentId,
        amazonReferenceId: warehouseIds[dest.id]?.fbaId || dest.amazonReferenceId
      }));
      
      console.log('Updated destinations to save:', updatedDestinations);
      
      // Get the current shipment to preserve invoice data
      const currentShipment = await DataService.getShipmentById(id!);
      
      // Prepare the update - need to update both destinations and invoice.warehouseDetails
      // Also update status to "In Progress" since IDs have been provided
      const updateData: any = {
        destinations: updatedDestinations,
        status: 'In Progress' as const
      };
      
      // If invoice exists, also update the warehouseDetails in the invoice
      if (currentShipment?.invoice) {
        updateData.invoice = {
          ...currentShipment.invoice,
          warehouseDetails: currentShipment.invoice.warehouseDetails?.map((wd: any) => {
            const updatedDest = updatedDestinations.find((d: any) => 
              d.fbaWarehouse === wd.warehouse || d.id === wd.id
            );
            if (updatedDest) {
              return {
                ...wd,
                amazonShipmentId: updatedDest.amazonShipmentId,
                amazonReferenceId: updatedDest.amazonReferenceId
              };
            }
            return wd;
          })
        };
      }
      
      // Save to backend - update the entire shipment
      const updatedShipment = await DataService.updateShipment(id!, updateData);
      
      console.log('Response from backend after update:', updatedShipment);
      
      // Verify the save worked
      const verifyShipment = await DataService.getShipmentById(id!);
      console.log('Verification - reloaded shipment:', verifyShipment);
      console.log('Verification - destinations have IDs:', verifyShipment?.destinations.map((d: any) => ({
        id: d.id,
        shipmentId: d.amazonShipmentId,
        referenceId: d.amazonReferenceId
      })));
      
      // Update local state
      setShipment({
        ...shipment,
        destinations: updatedDestinations
      });
      
      // Add a tracking event for IDs submission
      await DataService.addTrackingEvent(id!, {
        date: new Date().toISOString(),
        status: 'In Progress',
        location: 'System',
        description: 'Amazon Shipment IDs and Reference IDs provided by customer'
      });
      
      addToast('Warehouse IDs saved successfully! Shipment is now in progress.', 'success');
      
      // Clear the form
      setWarehouseIds({});
      
      await refreshData();
    } catch (error) {
      console.error('Error saving warehouse IDs:', error);
      addToast('Failed to save warehouse IDs. Please try again.', 'error');
    } finally {
      setIsSavingIds(false);
    }
  };
  
  // Fetch shipment data
  useEffect(() => {
    const fetchShipmentData = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        // Fetch shipment
        const shipmentData = await DataService.getShipmentById(id);
        if (!shipmentData) {
          addToast('Shipment not found', 'error');
          navigate('/shipments');
          return;
        }
        
        // Fetch related quote and quote request if quoteId exists
        let quoteData = null;
        let quoteRequestData: QuoteRequest | null = null;
        
        if (shipmentData.quoteId || shipmentData.quote_id) {
          const quoteId = shipmentData.quoteId || shipmentData.quote_id;
          try {
            quoteData = await DataService.getQuoteById(quoteId);
            if (quoteData) {
              quoteRequestData = await DataService.getQuoteRequestById(quoteData.requestId);
            }
          } catch (error) {
            console.log('Could not fetch quote data:', error);
          }
        }
        
        // Determine service mode from quote request
        const serviceMode = quoteRequestData?.serviceType === 'Air Express' ? 'air-express' : 
                          quoteRequestData?.serviceType === 'Air Freight' ? 'air-freight' : 
                          'ocean-lcl';
        
        // Transform shipment data to match component's expected format
        const transformedShipment = {
          id: shipmentData.id,
          status: shipmentData.status,
          quoteId: shipmentData.quoteId,
          createdAt: new Date(shipmentData.createdAt).toLocaleDateString(),
          customer: shipmentData.customer,
          supplier: {
            name: quoteRequestData?.supplierDetails?.name || 'Unknown Supplier',
            address: quoteRequestData ? 
              `${quoteRequestData.supplierDetails.address}, ${quoteRequestData.supplierDetails.city}, ${quoteRequestData.supplierDetails.country}` : 
              'Unknown Address'
          },
          masterCargo: {
            grossWeight: shipmentData.cargoDetails.estimatedWeight,
            cartonCount: shipmentData.cargoDetails.estimatedCartonCount,
            chargeableWeight: shipmentData.cargoDetails.estimatedWeight
          },
          serviceMode: serviceMode,
          currentLocation: shipmentData.trackingEvents.length > 0 
            ? shipmentData.trackingEvents[shipmentData.trackingEvents.length - 1].location 
            : quoteRequestData?.supplierDetails?.city || 'Unknown',
          destinations: shipmentData.invoice && shipmentData.invoice.warehouseDetails 
            ? shipmentData.invoice.warehouseDetails.map((warehouseDetail: any) => {
                return {
                  id: warehouseDetail.id || `warehouse-${Math.random().toString(36).substr(2, 9)}`,
                  amazonShipmentId: warehouseDetail.amazonShipmentId || '',
                  amazonReferenceId: warehouseDetail.amazonReferenceId || '',
                  fbaWarehouse: warehouseDetail.warehouse,
                  address: getWarehouseAddress(warehouseDetail.warehouse),
                  cartons: warehouseDetail.cartons,
                  chargeableWeight: warehouseDetail.chargeableWeight,
                  status: shipmentData.status,
                  trackingNumber: warehouseDetail.soNumber,
                  progress: getProgressPercentage(shipmentData.status, shipmentData)
                };
              })
            : shipmentData.destinations.map((dest: any) => {
                return {
                  id: dest.id,
                  amazonShipmentId: dest.amazonShipmentId || '',
                  amazonReferenceId: dest.amazonReferenceId || '',
                  fbaWarehouse: dest.fbaWarehouse,
                  address: getWarehouseAddress(dest.fbaWarehouse),
                  cartons: dest.cartons,
                  chargeableWeight: dest.estimatedWeight,
                  status: shipmentData.status,
                  trackingNumber: `TRACK${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                  progress: getProgressPercentage(shipmentData.status, shipmentData)
                };
              }),
          timeline: shipmentData.trackingEvents.map((event: any) => ({
            date: new Date(event.timestamp || event.date).toLocaleString(),
            event: event.description,
            location: event.location,
            status: event.status,
            type: event.type || 'tracking'
          })),
          documents: [
            { id: 'doc-1', name: 'Commercial Invoice.pdf', type: 'invoice' },
            { id: 'doc-2', name: 'Packing List.xlsx', type: 'packing-list' },
            { id: 'doc-3', name: 'Air Waybill.pdf', type: 'awb' },
            { id: 'doc-4', name: 'Customs Clearance.pdf', type: 'customs' }
          ],
          photos: [
            { id: 'photo-1', name: 'Cargo at pickup.jpg', timestamp: new Date(shipmentData.createdAt).toLocaleString() },
            { id: 'photo-2', name: 'Packaging verification.jpg', timestamp: new Date(shipmentData.createdAt).toLocaleString() }
          ],
          invoice: shipmentData.invoice || null
        };
        
        console.log('=== Shipment Data Debug ===');
        console.log('Original shipmentData from backend:', shipmentData);
        console.log('Transformed shipment destinations:', transformedShipment.destinations);
        console.log('IDs in destinations:', transformedShipment.destinations.map((d: any) => ({
          id: d.id,
          warehouse: d.fbaWarehouse,
          shipmentId: d.amazonShipmentId,
          referenceId: d.amazonReferenceId
        })));
        
        setShipment(transformedShipment);
        
        // Set the first destination as active
        if (transformedShipment.destinations.length > 0) {
          setActiveDestination(transformedShipment.destinations[0].id);
        }
      } catch (error) {
        console.error('Error fetching shipment data:', error);
        addToast('Failed to load shipment data', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchShipmentData();
  }, [id, navigate, addToast]);
  
  const toggleSection = (section: string) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section as keyof typeof expandedSections]
    });
  };
  
  // Initialize warehouseIds with existing values
  useEffect(() => {
    if (shipment && shipment.destinations) {
      const existingIds: Record<string, { shipmentId: string; fbaId: string }> = {};
      shipment.destinations.forEach((dest: any) => {
        if (dest.amazonShipmentId || dest.amazonReferenceId) {
          existingIds[dest.id] = {
            shipmentId: dest.amazonShipmentId || '',
            fbaId: dest.amazonReferenceId || ''
          };
        }
      });
      if (Object.keys(existingIds).length > 0) {
        setWarehouseIds(existingIds);
      }
    }
  }, [shipment]);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Missing Shipment IDs':
        return 'error';
      case 'Pending':
        return 'warning';
      case 'In Progress':
        return 'info';
      case 'In Transit':
        return 'info';
      case 'Customs':
        return 'warning';
      case 'Out for Delivery':
        return 'info';
      case 'Delivered':
        return 'success';
      case 'Exception':
        return 'danger';
      case 'Awaiting Pickup':
        return 'secondary';
      default:
        return 'default';
    }
  };
  
  const getDisplayStatus = () => {
    // Check if invoice is paid but IDs are missing
    if (shipment?.invoice?.status === 'Paid' && 
        shipment?.destinations?.some((d: any) => !d.amazonShipmentId || d.amazonShipmentId === '')) {
      return 'Missing Shipment IDs';
    }
    // If invoice is paid and all IDs are provided, show In Progress
    if (shipment?.invoice?.status === 'Paid' && 
        shipment?.destinations?.every((d: any) => d.amazonShipmentId && d.amazonShipmentId !== '')) {
      return 'In Progress';
    }
    return shipment?.status || 'Unknown';
  };
  
  const getProgressSteps = () => {
    const currentStatus = getDisplayStatus();
    const steps = [
      {
        id: 'waiting',
        label: 'Waiting for Pickup',
        completed: false
      },
      {
        id: 'payment',
        label: 'Invoice Payment',
        completed: false
      },
      {
        id: 'shipment-ids',
        label: 'Shipment IDs',
        completed: false
      },
      {
        id: 'in-progress',
        label: 'In Progress',
        completed: false
      },
      {
        id: 'delivered',
        label: 'Delivered',
        completed: false
      }
    ];

    // Always mark Waiting for Pickup as completed if shipment exists
    if (shipment) {
      steps[0].completed = true;
    }
    
    // Mark Invoice Payment as completed if paid
    if (shipment?.invoice?.status === 'Paid') {
      steps[1].completed = true;
    }
    
    // Mark Shipment IDs as completed if all IDs provided
    if (shipment?.invoice?.status === 'Paid' && 
        shipment?.destinations?.every((d: any) => d.amazonShipmentId && d.amazonShipmentId !== '')) {
      steps[2].completed = true;
    }
    
    // Mark In Progress as completed if shipment is in transit or customs
    if (shipment?.status === 'In Transit' || shipment?.status === 'Customs' ||
        (currentStatus === 'In Progress' && steps[2].completed)) {
      steps[3].completed = true;
    }
    
    // Mark Delivered as completed if delivered
    if (shipment?.status === 'Delivered') {
      steps[4].completed = true;
    }

    return steps;
  };
  
  const progressSteps = getProgressSteps();
  const activeDestinationData = shipment?.destinations?.find((d: any) => d.id === activeDestination);
  const currentProgress = getProgressPercentage(shipment?.status || '', shipment);
  
  const handleContactSupport = () => {
    setActiveTab('chat');
  };
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <Card>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading shipment details...</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }
  
  // Show not found state
  if (!shipment) {
    return (
      <div className="max-w-6xl mx-auto">
        <Card>
          <div className="text-center py-12">
            <PackageIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-gray-500 mb-1">Shipment Not Found</h3>
            <p className="text-sm text-gray-400 mb-4">The shipment you're looking for doesn't exist.</p>
            <Button variant="secondary" onClick={() => navigate('/shipments')}>
              Back to Shipments
            </Button>
          </div>
        </Card>
      </div>
    );
  }
  
  return <div className="max-w-6xl mx-auto">
      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-lg font-bold text-gray-900 mr-3">
            Shipment {id}
          </h1>
          <Badge variant={getStatusColor(getDisplayStatus()) as any}>
            {getDisplayStatus()}
          </Badge>
          <span className="text-xs text-gray-500 ml-3">
            Created: {shipment.createdAt} • Quote #{shipment.quoteId}
          </span>
        </div>
        <div className="flex space-x-2">
          <Button variant="secondary" size="sm">
            <FileTextIcon className="h-3.5 w-3.5 mr-1" />
            View Quote
          </Button>
          <Button variant="primary" size="sm" onClick={handleContactSupport}>
            <MessageCircleIcon className="h-3.5 w-3.5 mr-1" />
            Contact Support
          </Button>
        </div>
      </div>
      <div className="mb-4 border-b border-gray-200">
        <nav className="flex -mb-px">
          <button className={`mr-8 py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'overview' ? 'border-[#2E3B55] text-[#2E3B55]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`} onClick={() => setActiveTab('overview')}>
            Overview
          </button>
          <button className={`mr-8 py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'documents' ? 'border-[#2E3B55] text-[#2E3B55]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`} onClick={() => setActiveTab('documents')}>
            Documents
          </button>
          <button className={`mr-8 py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'photos' ? 'border-[#2E3B55] text-[#2E3B55]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`} onClick={() => setActiveTab('photos')}>
            Photos
          </button>
          <button className={`mr-8 py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'invoice' ? 'border-[#2E3B55] text-[#2E3B55]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`} onClick={() => setActiveTab('invoice')}>
            Invoice
          </button>
          <button className={`mr-8 py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'chat' ? 'border-[#2E3B55] text-[#2E3B55]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`} onClick={() => setActiveTab('chat')}>
            Chat
          </button>
        </nav>
      </div>
      {activeTab === 'overview' && <div className="space-y-5">
          {/* Required IDs Notice - Show after payment but only if IDs are missing */}
          {shipment.invoice && shipment.invoice.status === 'Paid' && 
           shipment.destinations.some((d: any) => !d.amazonShipmentId || d.amazonShipmentId === '') && (
            <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircleIcon className="h-6 w-6 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
                <div className="flex-grow">
                  <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                    Action Required: Provide Amazon Shipment IDs
                  </h3>
                  <p className="text-sm text-yellow-700 mb-3">
                    Your invoice has been paid. To continue with shipment processing, you MUST provide the following information for each warehouse:
                  </p>
                  <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1 mb-3">
                    <li><strong>Amazon Shipment ID</strong> - Your unique shipment identifier from Amazon Seller Central</li>
                    <li><strong>Amazon Reference ID</strong> - 8-character alphanumeric code (e.g., A2K9PL7X, B5N8MQ3T)</li>
                  </ul>
                  <p className="text-sm font-semibold text-yellow-800">
                    ⚠️ Your shipment cannot proceed without this information.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Shipment Details & Invoice Info - Compact Layout */}
          <Card>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Supplier
                </h3>
                <div className="space-y-1">
                  <span className="text-sm font-medium text-gray-900 block">
                    {shipment.supplier.name}
                  </span>
                  <span className="text-xs text-gray-500 block">
                    {shipment.supplier.address}
                  </span>
                </div>
              </div>
              {shipment.invoice && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-medium text-gray-700">
                      Invoice Status
                    </h3>
                    <Badge variant={shipment.invoice.status === 'Paid' ? 'success' : 'warning'}>
                      {shipment.invoice.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-xs text-gray-500 block">
                        Amount
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        ${shipment.invoice.amount.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block">
                        Due Date
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {shipment.invoice.dueDate}
                      </span>
                    </div>
                  </div>
                  {shipment.invoice.status !== 'Paid' && (
                    <div className="mt-3">
                      <Button 
                        variant="primary" 
                        size="sm" 
                        className="w-full"
                        onClick={() => setShowPaymentModal(true)}
                      >
                        Pay Invoice
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
          {/* Warehouse Destinations - Full Width */}
          <div className="grid grid-cols-1 gap-3">
            <h3 className="text-base font-medium text-[#2E3B55]">
              Warehouse Destinations
            </h3>
            
            {/* ID Input Section - Show when invoice is paid but IDs are missing */}
            {shipment.invoice && shipment.invoice.status === 'Paid' && 
             shipment.destinations.some((d: any) => !d.amazonShipmentId || d.amazonShipmentId === '') && (
              <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-semibold text-red-800 mb-3 flex items-center">
                  <AlertCircleIcon className="h-5 w-5 mr-2" />
                  Required: Enter Amazon IDs for Each Warehouse
                </h4>
                <div className="space-y-3">
                  {shipment.destinations.map((dest: any) => (
                    <div key={dest.id} className="bg-white p-3 rounded border border-red-200">
                      <h5 className="font-medium text-gray-900 mb-2 text-sm">{dest.fbaWarehouse}</h5>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Amazon Shipment ID *
                          </label>
                          <input
                            type="text"
                            value={warehouseIds[dest.id]?.shipmentId || ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              setWarehouseIds(prev => ({
                                ...prev,
                                [dest.id]: {
                                  shipmentId: value,
                                  fbaId: prev[dest.id]?.fbaId || ''
                                }
                              }));
                            }}
                            placeholder="e.g., FBA15J7KRTM"
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Amazon Reference ID *
                          </label>
                          <input
                            type="text"
                            value={warehouseIds[dest.id]?.fbaId || ''}
                            onChange={(e) => {
                              // Only allow alphanumeric characters and limit to 8
                              const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
                              setWarehouseIds(prev => ({
                                ...prev,
                                [dest.id]: {
                                  shipmentId: prev[dest.id]?.shipmentId || '',
                                  fbaId: value
                                }
                              }));
                            }}
                            maxLength={8}
                            placeholder="e.g., A2K9PL7X"
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button 
                    variant="primary" 
                    className="w-full"
                    onClick={() => handleSaveWarehouseIds()}
                    isLoading={isSavingIds}
                  >
                    Save IDs and Continue Shipment
                  </Button>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {shipment.destinations.map((dest: any) => <div key={dest.id} className={`cursor-pointer transition-all rounded-lg p-4 ${activeDestination === dest.id ? 'bg-blue-50 border-2 border-blue-200 shadow-lg' : 'bg-white border border-gray-200 hover:border-gray-300 hover:shadow-md'}`} onClick={() => setActiveDestination(dest.id)}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-start">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 transition-colors ${activeDestination === dest.id ? 'bg-blue-500' : 'bg-gray-100'}`}>
                        <BoxIcon className={`h-5 w-5 ${activeDestination === dest.id ? 'text-white' : 'text-gray-500'}`} />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {dest.fbaWarehouse}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {dest.amazonShipmentId ? `ID: ${dest.amazonShipmentId}` : (shipment.invoice?.status === 'Paid' ? '⚠️ ID Required' : 'Pending Payment')}
                        </p>
                        {dest.amazonReferenceId && (
                          <p className="text-xs text-gray-500">
                            Ref: {dest.amazonReferenceId}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge variant={getStatusColor(
                      shipment.invoice?.status === 'Paid' && (!dest.amazonShipmentId || dest.amazonShipmentId === '') 
                        ? 'Missing Shipment IDs' 
                        : dest.status
                    ) as any}>
                      {shipment.invoice?.status === 'Paid' && (!dest.amazonShipmentId || dest.amazonShipmentId === '') 
                        ? 'Missing IDs' 
                        : dest.status}
                    </Badge>
                  </div>
                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500">Progress</span>
                      <span className={`${activeDestination === dest.id ? 'text-blue-600 font-medium' : 'text-gray-700'}`}>{dest.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full transition-colors ${activeDestination === dest.id ? 'bg-blue-500' : 'bg-[#2E3B55]'}`} style={{
                  width: `${dest.progress}%`
                }}></div>
                    </div>
                  </div>
                  <div className="flex justify-end items-center text-xs text-gray-500">
                    <div className="flex items-center">
                      <TruckIcon className="w-3 h-3 mr-1" />
                      <span>Cartons: {dest.cartons}</span>
                    </div>
                  </div>
                </div>)}
            </div>
          </div>
          {activeDestinationData && <>
              {/* Shipment Progress for Selected Warehouse - Now Above Warehouse Details */}
              <Card>
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-base font-medium text-[#2E3B55]">
                      {activeDestinationData.fbaWarehouse} Shipment Progress
                    </h3>
                    <div className="flex items-center text-xs text-gray-500">
                      <ClockIcon className="w-3.5 h-3.5 mr-1" />
                      <span>
                        Last updated:{' '}
                        {shipment.timeline[shipment.timeline.length - 1].date}
                      </span>
                    </div>
                  </div>
                  <div className="relative mb-4">
                    <div className="overflow-hidden">
                      <div className="flex items-center justify-between w-full">
                        {progressSteps.map((step, index) => <div key={step.id} className="flex flex-col items-center relative z-10 flex-1">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center ${step.completed ? 'bg-[#2E3B55] text-white' : 'bg-gray-200 text-gray-500'}`}>
                              {step.completed ? <CheckCircleIcon className="w-4 h-4" /> : index + 1}
                            </div>
                            <span className="text-xs mt-1 text-center whitespace-nowrap px-1">
                              {step.label}
                            </span>
                          </div>)}
                      </div>
                      <div className="absolute top-3.5 left-0 right-0 h-0.5 bg-gray-200 -z-10"></div>
                      <div className="absolute top-3.5 left-0 h-0.5 bg-[#2E3B55] -z-10" style={{
                  width: `${currentProgress}%`
                }}></div>
                    </div>
                  </div>
                </div>
                <div className="border-t border-gray-100 pt-4">
                  <button type="button" className="flex justify-between items-center w-full text-left" onClick={() => toggleSection('timeline')}>
                    <h3 className="text-base font-medium text-[#2E3B55]">
                      Timeline
                    </h3>
                    {expandedSections.timeline ? <ChevronDownIcon className="h-5 w-5 text-gray-500" /> : <ChevronRightIcon className="h-5 w-5 text-gray-500" />}
                  </button>
                  {expandedSections.timeline && <div className="mt-4">
                      <div className="flex justify-end mb-3">
                        <button className="flex items-center text-xs text-[#2E3B55]">
                          <RefreshCwIcon className="h-3 w-3 mr-1" />
                          Refresh
                        </button>
                      </div>
                      <div className="space-y-0 max-h-[350px] overflow-auto pr-2">
                        {shipment.timeline.map((event: any, index: number) => <div key={index} className="flex">
                            <div className="mr-3">
                              <div className="flex flex-col items-center">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                                  event.type === 'payment' ? 'bg-green-100' : 
                                  index === 0 ? 'bg-blue-100' : 
                                  'bg-[#E6EDF8]'
                                }`}>
                                  {event.type === 'payment' ? (
                                    <DollarSignIcon className="h-3.5 w-3.5 text-green-600" />
                                  ) : index === 0 ? (
                                    <PackageIcon className="h-3.5 w-3.5 text-blue-600" />
                                  ) : (
                                    <TruckIcon className="h-3.5 w-3.5 text-[#2E3B55]" />
                                  )}
                                </div>
                                {index < shipment.timeline.length - 1 && <div className="w-0.5 bg-gray-200 h-10"></div>}
                              </div>
                            </div>
                            <div className="pb-6">
                              <div className="flex items-baseline">
                                <p className="text-sm font-medium text-gray-900">
                                  {event.event}
                                </p>
                                <span className="ml-2 text-xs text-gray-500">
                                  {event.date}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                {event.location}
                              </p>
                            </div>
                          </div>)}
                        {shipment.status === 'Delivered' && (
                          <div className="flex">
                            <div className="mr-3">
                              <div className="flex flex-col items-center">
                                <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center">
                                  <CheckCircleIcon className="h-3.5 w-3.5 text-green-600" />
                                </div>
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-green-700">
                                Final Delivery
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {(() => {
                                  const deliveredEvent = shipment.timeline.find((e: any) => 
                                    e.event?.toLowerCase().includes('delivered') || 
                                    e.status?.toLowerCase() === 'delivered'
                                  );
                                  return deliveredEvent ? deliveredEvent.date : 'Delivered';
                                })()}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>}
                </div>
              </Card>
              {/* Selected Warehouse Details - Now Below Shipment Progress */}
              <Card>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-base font-medium text-[#2E3B55]">
                    {activeDestinationData.fbaWarehouse} Details
                  </h3>
                  <Badge variant={getStatusColor(
                    shipment.invoice?.status === 'Paid' && (!activeDestinationData.amazonShipmentId || activeDestinationData.amazonShipmentId === '') 
                      ? 'Missing Shipment IDs' 
                      : activeDestinationData.status
                  ) as any}>
                    {shipment.invoice?.status === 'Paid' && (!activeDestinationData.amazonShipmentId || activeDestinationData.amazonShipmentId === '') 
                      ? 'Missing Shipment IDs' 
                      : activeDestinationData.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                  <div>
                    <span className="text-xs text-gray-500 block">
                      Amazon Shipment ID
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {activeDestinationData.amazonShipmentId || 'Not provided'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">
                      Amazon Reference ID
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {activeDestinationData.amazonReferenceId || 'Not provided'}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                  <div>
                    <span className="text-xs text-gray-500 block">
                      Tracking Number
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {activeDestinationData.soNumber || 'Not provided'}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                  <div>
                    <span className="text-xs text-gray-500 block">Cartons</span>
                    <span className="text-sm font-medium text-gray-900">
                      {activeDestinationData.cartons}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">
                      Chargeable Weight
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {activeDestinationData.chargeableWeight} kg
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">
                      Progress
                    </span>
                    <div className="flex items-center">
                      <div className="w-24 bg-gray-200 rounded-full h-1.5 mr-2">
                        <div className="bg-[#2E3B55] h-1.5 rounded-full" style={{
                    width: `${currentProgress}%`
                  }}></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {currentProgress}%
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">
                    Delivery Address
                  </span>
                  <span className="text-sm text-gray-700">
                    {activeDestinationData.address}
                  </span>
                </div>
              </Card>
            </>}
        </div>}
      {activeTab === 'documents' && <Card>
          <h2 className="text-base font-medium text-gray-900 mb-4">
            Shipment Documents
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {shipment.documents.map((doc: any) => <div key={doc.id} className="border border-gray-200 rounded-lg p-4 hover:border-[#2E3B55]/30 transition">
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <FileTextIcon className="h-7 w-7 text-[#2E3B55] mr-3" />
                    <div>
                      <h3 className="font-medium text-gray-900">{doc.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {doc.type === 'invoice' ? 'Commercial Invoice' : doc.type === 'packing-list' ? 'Packing List' : doc.type === 'awb' ? 'Air Waybill' : 'Customs Documentation'}
                      </p>
                    </div>
                  </div>
                  <button type="button" className="text-[#2E3B55] hover:text-[#1e2940]" title="Download">
                    <DownloadIcon className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    Uploaded on {shipment.createdAt}
                  </span>
                  <button type="button" className="text-xs text-[#2E3B55] hover:text-[#1e2940]">
                    View
                  </button>
                </div>
              </div>)}
            <div className="border border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 bg-[#E6EDF8] rounded-full flex items-center justify-center mb-2">
                <FileTextIcon className="h-5 w-5 text-[#2E3B55]" />
              </div>
              <h3 className="font-medium text-gray-900">Upload Document</h3>
              <p className="text-xs text-gray-500 mt-1 mb-3">
                Add additional documents to your shipment
              </p>
              <Button variant="secondary" size="sm">
                Upload File
              </Button>
            </div>
          </div>
        </Card>}
      {activeTab === 'photos' && <Card>
          <h2 className="text-base font-medium text-gray-900 mb-4">
            Shipment Photos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {shipment.photos.map((photo: any) => <div key={photo.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="h-48 bg-gray-100 flex items-center justify-center">
                  <ImageIcon className="h-12 w-12 text-gray-400" />
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-gray-900">{photo.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Taken on {photo.timestamp}
                  </p>
                  <div className="mt-3 flex justify-between items-center">
                    <button type="button" className="text-xs text-[#2E3B55] hover:text-[#1e2940]">
                      View Full Size
                    </button>
                    <button type="button" className="text-[#2E3B55] hover:text-[#1e2940]" title="Download">
                      <DownloadIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>)}
            <div className="border border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 bg-[#E6EDF8] rounded-full flex items-center justify-center mb-2">
                <ImageIcon className="h-5 w-5 text-[#2E3B55]" />
              </div>
              <h3 className="font-medium text-gray-900">Upload Photos</h3>
              <p className="text-xs text-gray-500 mt-1 mb-3">
                Add photos of your shipment
              </p>
              <Button variant="secondary" size="sm">
                Upload Photos
              </Button>
            </div>
          </div>
        </Card>}
      {activeTab === 'chat' && <div className="h-[600px] bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
          <ChatPanel 
            shipmentId={id || ''} 
            currentUser={{
              id: user?.id || 'user-1',
              name: user?.name || 'Customer',
              role: user?.role === 'admin' ? 'admin' : user?.role === 'staff' ? 'staff' : 'customer'
            }}
          />
        </div>}
      {activeTab === 'invoice' && shipment.invoice && (
        <Card>
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-2">
                Invoice Details
              </h2>
              <p className="text-sm text-gray-500">
                Invoice #{shipment.invoice.id} • Created on{' '}
                {new Date(shipment.invoice.createdAt).toLocaleDateString()}{' '}
                • Due by {shipment.invoice.dueDate}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant={shipment.invoice.status === 'Paid' ? 'success' : 'warning'}>
                {shipment.invoice.status}
              </Badge>
              <Button variant="secondary" size="sm">
                <FileTextIcon className="h-4 w-4 mr-1" />
                Download Invoice
              </Button>
              {shipment.invoice.status !== 'Paid' && (
                <Button 
                  variant="primary" 
                  size="sm"
                  onClick={() => setShowPaymentModal(true)}
                >
                  <CreditCardIcon className="h-4 w-4 mr-1" />
                  Pay Invoice
                </Button>
              )}
            </div>
          </div>
          <div>
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Bill To
                  </h4>
                  <p className="text-sm font-medium text-gray-900">
                    {shipment.customer?.company || 'Customer Company'}
                  </p>
                  <p className="text-sm text-gray-700">
                    {shipment.customer?.name || 'Customer Name'}
                  </p>
                  <p className="text-sm text-gray-700">
                    {shipment.customer?.email || 'customer@example.com'}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Invoice Details
                  </h4>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        Invoice Number:
                      </span>
                      <span className="text-sm text-gray-900">
                        {shipment.invoice.id}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        Shipment ID:
                      </span>
                      <span className="text-sm text-gray-900">
                        {shipment.id}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Quote ID:</span>
                      <span className="text-sm text-gray-900">
                        {shipment.quoteId}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Due Date:</span>
                      <span className="text-sm text-gray-900">
                        {shipment.invoice.dueDate}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-6">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {/* Per-warehouse charges */}
                    {shipment.invoice.warehouseDetails && shipment.invoice.warehouseDetails.map((warehouse: any, index: number) => (
                      <tr key={index}>
                        <td className="px-3 py-4 text-sm text-gray-700">
                          {warehouse.warehouse}
                          {warehouse.soNumber && (
                            <span className="text-xs text-gray-500"> (Tracking: {warehouse.soNumber})</span>
                          )}
                          <span className="block text-xs text-gray-500">
                            {warehouse.cartons} cartons, {warehouse.chargeableWeight} kg @ ${warehouse.ratePerKg.toFixed(2)}/kg
                          </span>
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-900 text-right">
                          ${warehouse.subtotal.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    {/* Additional services */}
                    {shipment.invoice.additionalServices && shipment.invoice.additionalServices.map((service: any, index: number) => (
                      <tr key={index}>
                        <td className="px-3 py-4 text-sm text-gray-700">
                          {service.description}
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-900 text-right">
                          ${service.amount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    {/* Adjustments */}
                    {shipment.invoice.adjustments && shipment.invoice.adjustments.map((adjustment: any, index: number) => (
                      <tr key={index}>
                        <td className="px-3 py-4 text-sm text-gray-700">
                          {adjustment.description}
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-900 text-right">
                          ${adjustment.amount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <th className="px-3 py-3 text-left text-sm font-medium text-gray-900">
                        Total Due
                      </th>
                      <th className="px-3 py-3 text-right text-sm font-bold text-blue-600">
                        ${shipment.invoice.amount.toFixed(2)}
                      </th>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
            {shipment.invoice.notes && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Notes
                </h3>
                <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
                  {shipment.invoice.notes}
                </p>
              </div>
            )}
            {shipment.invoice.status !== 'Paid' && (
              <div className="flex items-center text-yellow-600">
                <AlertCircleIcon className="h-4 w-4 mr-1" />
                <span className="text-sm">Payment pending - Use the Pay Invoice button above to make payment</span>
              </div>
            )}
          </div>
        </Card>
      )}
      {activeTab === 'invoice' && !shipment.invoice && (
        <Card>
          <div className="text-center py-12">
            <ReceiptIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-gray-500 mb-1">No Invoice Available</h3>
            <p className="text-sm text-gray-400">Invoice will be generated once shipment details are confirmed.</p>
          </div>
        </Card>
      )}
      
      {/* Payment Modal */}
      {showPaymentModal && shipment && shipment.invoice && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" onClick={() => setShowPaymentModal(false)}>
          <div className="relative top-20 mx-auto p-5 border w-full max-w-lg shadow-lg rounded-lg bg-white" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900">Pay Invoice</h3>
              <p className="text-sm text-gray-500 mt-1">
                Invoice #{shipment.invoice.id} • Amount: ${shipment.invoice.amount.toFixed(2)}
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Card Number
                </label>
                <input
                  type="text"
                  value={paymentForm.cardNumber}
                  onChange={(e) => setPaymentForm({
                    ...paymentForm,
                    cardNumber: formatCardNumber(e.target.value)
                  })}
                  maxLength={19}
                  placeholder="1234 5678 9012 3456"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Card Holder Name
                </label>
                <input
                  type="text"
                  value={paymentForm.cardHolder}
                  onChange={(e) => setPaymentForm({
                    ...paymentForm,
                    cardHolder: e.target.value
                  })}
                  placeholder="John Doe"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    value={paymentForm.expiryDate}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, '');
                      if (value.length >= 2) {
                        value = value.slice(0, 2) + '/' + value.slice(2, 4);
                      }
                      setPaymentForm({
                        ...paymentForm,
                        expiryDate: value
                      });
                    }}
                    maxLength={5}
                    placeholder="MM/YY"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CVV
                  </label>
                  <input
                    type="text"
                    value={paymentForm.cvv}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 4) {
                        setPaymentForm({
                          ...paymentForm,
                          cvv: value
                        });
                      }
                    }}
                    maxLength={4}
                    placeholder="123"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Total Amount:</span>
                  <span className="text-lg font-bold text-blue-600">
                    ${shipment.invoice.amount.toFixed(2)}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center text-xs text-gray-500">
                <AlertCircleIcon className="h-4 w-4 mr-1" />
                Your payment information is secure and encrypted
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <Button 
                variant="tertiary" 
                onClick={() => setShowPaymentModal(false)}
                disabled={isProcessingPayment}
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                onClick={handlePaymentSubmit}
                isLoading={isProcessingPayment}
              >
                <CreditCardIcon className="h-4 w-4 mr-1" />
                {isProcessingPayment ? 'Processing...' : `Pay $${shipment.invoice.amount.toFixed(2)}`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>;
};