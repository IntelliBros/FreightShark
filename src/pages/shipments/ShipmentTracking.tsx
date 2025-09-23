import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
// Force reload - chat panel
import { ChatPanel } from '../../components/chat/ChatPanel';
import { TruckIcon, PackageIcon, MapPinIcon, ClockIcon, FileTextIcon, MessageCircleIcon, ChevronRightIcon, ChevronDownIcon, DownloadIcon, CheckCircleIcon, AlertCircleIcon, ImageIcon, RefreshCwIcon, BoxIcon, ReceiptIcon, DollarSignIcon, CalendarIcon, CreditCardIcon } from 'lucide-react';
import { DataService, QuoteRequest } from '../../services/DataService';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { amazonWarehouseService } from '../../services/amazonWarehouseService';
import { generateInvoicePDF } from '../../utils/generateInvoicePDF';

// Helper function to get warehouse addresses
const getWarehouseAddress = (warehouseCode: string): string => {
  const warehouse = amazonWarehouseService.getWarehouseByCode(warehouseCode);
  if (warehouse) {
    return `${warehouse.address}, ${warehouse.city}, ${warehouse.state} ${warehouse.zipCode}, ${warehouse.country}`;
  }
  return 'Address not available';
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
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
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
      // Show 20% for waiting for pickup when invoice is not paid
      return 20; // Waiting for Pickup only
    }
    
    // If invoice is paid but missing shipment IDs
    if (currentShipment?.invoice?.status === 'Paid' && 
        Array.isArray(currentShipment?.destinations) && currentShipment.destinations.some((d: any) => !d.amazonShipmentId || d.amazonShipmentId === '')) {
      return 30; // Waiting for Pickup (20%) + Invoice Payment (10%)
    }
    
    // If invoice is paid and all IDs are provided
    if (currentShipment?.invoice?.status === 'Paid' && 
        Array.isArray(currentShipment?.destinations) && currentShipment.destinations.every((d: any) => d.amazonShipmentId && d.amazonShipmentId !== '')) {
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
    // Check if shipment and invoice exist
    if (!shipment || !shipment.invoice) {
      addToast('Invoice information not available', 'error');
      return;
    }
    
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
      
      // For now, simulate payment processing since invoices should be created by staff
      // await DataService.processInvoicePayment(id!, paymentDetails);
      
      // Update the shipment with payment status
      const updatedInvoice = {
        ...shipment.invoice,
        status: 'Paid',
        paidAt: new Date().toISOString()
      };
      
      // Get current destination data and update invoice within it
      const currentDestinationData = shipment.destination || {};
      const updatedDestinationData = {
        ...currentDestinationData,
        invoice: updatedInvoice
      };
      
      await DataService.updateShipment(id!, { 
        destination: updatedDestinationData,
        status: 'In Progress' // Update status when payment is made
      });
      
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
            if (quoteData && (quoteData.requestId || quoteData.request_id)) {
              const requestId = quoteData.requestId || quoteData.request_id;
              // Only fetch if requestId is not undefined or null
              if (requestId && requestId !== 'undefined') {
                try {
                  quoteRequestData = await DataService.getQuoteRequestById(requestId);
                } catch (err) {
                  console.log('Could not fetch quote request data:', err);
                }
              }
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
          timeline: Array.isArray(updatedShipmentData.trackingEvents) 
            ? updatedShipmentData.trackingEvents.map((event: any) => ({
                date: event.timestamp || event.date ? new Date(event.timestamp || event.date).toLocaleString() : 'Date not available',
                event: event.description || 'No description',
                location: event.location || 'Unknown location',
                status: event.status,
                type: event.type || 'tracking'
              }))
            : []
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
    if (!shipment) {
      console.error('Cannot save warehouse IDs: shipment is null');
      return;
    }
    
    console.log('Saving warehouse IDs:', warehouseIds);
    console.log('Current destinations:', shipment.destinations);
    
    // Validate all IDs are provided
    const missingIds = Array.isArray(shipment.destinations) ? shipment.destinations.filter((dest: any) => {
      const ids = warehouseIds[dest.id];
      return !ids || !ids.shipmentId || !ids.fbaId;
    }) : [];
    
    if (missingIds && missingIds.length > 0) {
      addToast('Please provide both Amazon Shipment ID and Amazon Reference ID for all warehouses', 'error');
      return;
    }
    
    // Validate Amazon Reference ID format (8 alphanumeric characters)
    const invalidRefIds = Array.isArray(shipment.destinations) ? shipment.destinations.filter((dest: any) => {
      const ids = warehouseIds[dest.id];
      if (!ids?.fbaId) return false;
      // Check if it's exactly 8 characters and alphanumeric
      const refIdPattern = /^[A-Z0-9]{8}$/i;
      return !refIdPattern.test(ids.fbaId);
    }) : [];
    
    if (invalidRefIds && invalidRefIds.length > 0) {
      addToast('Amazon Reference ID must be exactly 8 alphanumeric characters (e.g., A2K9PL7X)', 'error');
      return;
    }
    
    setIsSavingIds(true);
    
    try {
      // Update shipment with the provided IDs
      const updatedDestinations = Array.isArray(shipment.destinations) ? shipment.destinations.map((dest: any) => ({
        ...dest,
        amazonShipmentId: warehouseIds[dest.id]?.shipmentId || dest.amazonShipmentId,
        amazonReferenceId: warehouseIds[dest.id]?.fbaId || dest.amazonReferenceId
      })) : [];
      
      console.log('Updated destinations to save:', updatedDestinations);
      
      // Get the current shipment to preserve invoice data
      const currentShipment = await DataService.getShipmentById(id!);
      const currentDestinationData = currentShipment?.rawDestination || {};
      
      // Update the invoice's warehouseDetails if it exists
      let updatedInvoice = currentDestinationData.invoice;
      if (updatedInvoice && updatedInvoice.warehouseDetails) {
        updatedInvoice = {
          ...updatedInvoice,
          warehouseDetails: updatedInvoice.warehouseDetails.map((wd: any) => {
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
      
      // Prepare the destination data with updated destinations and preserved invoice
      const updatedDestinationData = {
        ...currentDestinationData,
        destinations: updatedDestinations,
        invoice: updatedInvoice
      };
      
      // Save to backend - update status and destination field
      const updatedShipment = await DataService.updateShipment(id!, {
        status: 'In Progress' as const,
        destination: updatedDestinationData
      });
      
      console.log('Response from backend after update:', updatedShipment);
      
      // Verify the save worked
      const verifyShipment = await DataService.getShipmentById(id!);
      console.log('Verification - reloaded shipment:', verifyShipment);
      console.log('Verification - destinations have IDs:', verifyShipment?.destinations?.map((d: any) => ({
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

  // Handle document upload
  const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !shipment) return;

    setIsUploadingDocument(true);
    try {
      // Convert file to base64 for storage
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
      });
      reader.readAsDataURL(file);
      const base64Data = await base64Promise;

      // Create document object with base64 data
      const newDocument = {
        id: `doc-${Date.now()}`,
        name: file.name,
        type: file.type.includes('pdf') ? 'document' :
              file.type.includes('image') ? 'image' : 'document',
        size: `${(file.size / 1024).toFixed(2)} KB`,
        uploadedAt: new Date().toISOString().split('T')[0],
        uploadedBy: user?.name || 'Customer',
        url: base64Data, // Store base64 data URL
        mimeType: file.type || 'application/octet-stream'
      };

      // Add document to shipment
      const updatedDocuments = [...(shipment.documents || []), newDocument];

      // Update shipment with new documents array
      const updatedShipment = {
        ...shipment,
        documents: updatedDocuments
      };

      // Update local state immediately
      setShipment(updatedShipment);

      // Save to database - update the entire shipment with new documents
      await DataService.updateShipment(shipment.id, {
        documents: updatedDocuments
      });

      addToast('Document uploaded successfully', 'success');

      // Optionally refresh data to sync with backend
      setTimeout(() => refreshData(), 500);

      // Reset file input
      event.target.value = '';
    } catch (error) {
      console.error('Error uploading document:', error);
      addToast('Failed to upload document. Please try again.', 'error');
    } finally {
      setIsUploadingDocument(false);
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
        
        if (shipmentData?.quoteId || shipmentData?.quote_id) {
          const quoteId = shipmentData?.quoteId || shipmentData?.quote_id;
          try {
            quoteData = await DataService.getQuoteById(quoteId);
            if (quoteData && (quoteData.requestId || quoteData.request_id)) {
              const requestId = quoteData.requestId || quoteData.request_id;
              // Only fetch if requestId is not undefined or null
              if (requestId && requestId !== 'undefined') {
                try {
                  quoteRequestData = await DataService.getQuoteRequestById(requestId);
                } catch (err) {
                  console.log('Could not fetch quote request data:', err);
                }
              }
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
        let transformedShipment;
        try {
          // Ensure shipmentData has required properties
          if (!shipmentData) {
            throw new Error('Invalid shipment data');
          }
          
          console.log('Starting transformation with shipmentData:', shipmentData);
          
          // Safely check trackingEvents
          let safeTrackingEvents: any[] = [];
          try {
            if (shipmentData && shipmentData.trackingEvents) {
              console.log('trackingEvents type:', typeof shipmentData.trackingEvents, 'isArray:', Array.isArray(shipmentData.trackingEvents));
              if (Array.isArray(shipmentData.trackingEvents)) {
                safeTrackingEvents = shipmentData.trackingEvents;
                console.log('safeTrackingEvents length:', safeTrackingEvents.length);
              } else {
                console.warn('trackingEvents exists but is not an array:', shipmentData.trackingEvents);
                safeTrackingEvents = [];
              }
            } else {
              safeTrackingEvents = [];
            }
          } catch (e) {
            console.error('Error processing trackingEvents:', e);
            safeTrackingEvents = [];
          }
          
          // Safely check destinations
          let safeDestinations: any[] = [];
          try {
            if (shipmentData && shipmentData.destinations) {
              console.log('destinations type:', typeof shipmentData.destinations, 'isArray:', Array.isArray(shipmentData.destinations));
              if (Array.isArray(shipmentData.destinations)) {
                safeDestinations = shipmentData.destinations;
                console.log('safeDestinations length:', safeDestinations.length);
              } else {
                console.warn('destinations exists but is not an array:', shipmentData.destinations);
                safeDestinations = [];
              }
            } else {
              safeDestinations = [];
            }
          } catch (e) {
            console.error('Error processing destinations:', e);
            safeDestinations = [];
          }
          
          // Safely check warehouseDetails
          let safeWarehouseDetails: any[] = [];
          try {
            if (shipmentData && shipmentData.invoice && shipmentData.invoice.warehouseDetails) {
              console.log('warehouseDetails type:', typeof shipmentData.invoice.warehouseDetails, 'isArray:', Array.isArray(shipmentData.invoice.warehouseDetails));
              if (Array.isArray(shipmentData.invoice.warehouseDetails)) {
                safeWarehouseDetails = shipmentData.invoice.warehouseDetails;
                console.log('safeWarehouseDetails length:', safeWarehouseDetails.length);
              } else {
                console.warn('warehouseDetails exists but is not an array:', shipmentData.invoice.warehouseDetails);
                safeWarehouseDetails = [];
              }
            } else {
              safeWarehouseDetails = [];
            }
          } catch (e) {
            console.error('Error processing warehouseDetails:', e);
            safeWarehouseDetails = [];
          }
          
          // Check if all warehouses are delivered to determine overall status
        let overallStatus = shipmentData?.status;
        if (safeDestinations.length > 0 && safeDestinations.every((d: any) => d.deliveryStatus === 'delivered')) {
          overallStatus = 'Delivered';
        }

        transformedShipment = {
          id: shipmentData?.id,
          status: overallStatus,
          quoteId: shipmentData?.quoteId,
          createdAt: shipmentData?.createdAt || shipmentData?.created_at ? new Date(shipmentData?.createdAt || shipmentData?.created_at).toLocaleDateString() : 'Date not available',
          customer: shipmentData?.customer,
          supplier: {
            name: quoteRequestData?.supplierDetails?.name || 'Unknown Supplier',
            address: quoteRequestData?.supplierDetails ? 
              `${quoteRequestData.supplierDetails.address || ''}, ${quoteRequestData.supplierDetails.city || ''}, ${quoteRequestData.supplierDetails.country || ''}`.replace(/^, |, $/, '') : 
              'Unknown Address'
          },
          masterCargo: {
            grossWeight: shipmentData?.cargoDetails?.estimatedWeight || shipmentData?.estimated_weight || 0,
            cartonCount: shipmentData?.cargoDetails?.estimatedCartonCount || shipmentData?.cargoDetails?.cartonCount || 0,
            chargeableWeight: shipmentData?.cargoDetails?.estimatedWeight || shipmentData?.estimated_weight || 0
          },
          serviceMode: serviceMode,
          currentLocation: (() => {
            try {
              const events = safeTrackingEvents || [];
              if (events.length > 0) {
                const lastEvent = events[events.length - 1];
                return lastEvent?.location || quoteRequestData?.supplierDetails?.city || 'Unknown';
              }
            } catch (e) {
              console.error('Error getting currentLocation:', e);
            }
            return quoteRequestData?.supplierDetails?.city || 'Unknown';
          })(),
          destinations: (() => {
            try {
              const warehouses = safeWarehouseDetails || [];
              const dests = safeDestinations || [];
              
              if (warehouses.length > 0) {
                console.log('Mapping warehouseDetails, count:', warehouses.length);
                console.log('Available destinations for matching:', dests);
                return warehouses.map((warehouseDetail: any, index: number) => {
                  // Try to find the corresponding destination with amazonShipmentId
                  const matchingDest = dests.find((d: any) => 
                    d.fbaWarehouse === warehouseDetail.warehouse || 
                    d.id === warehouseDetail.id
                  ) || dests[index];
                  
                  console.log(`Warehouse ${warehouseDetail.warehouse}: matchingDest =`, matchingDest);
                  
                  return {
                    id: warehouseDetail.id || `warehouse-${Math.random().toString(36).substr(2, 9)}`,
                    amazonShipmentId: matchingDest?.amazonShipmentId || warehouseDetail.amazonShipmentId || '',
                    amazonReferenceId: matchingDest?.amazonReferenceId || warehouseDetail.amazonReferenceId || '',
                    fbaWarehouse: warehouseDetail.warehouse,
                    address: getWarehouseAddress(warehouseDetail.warehouse),
                    cartons: warehouseDetail.cartons,
                    chargeableWeight: warehouseDetail.chargeableWeight,
                    status: shipmentData?.status,
                    trackingNumber: warehouseDetail.soNumber,
                    progress: getProgressPercentage(shipmentData?.status, shipmentData)
                  };
                });
              } else if (dests.length > 0) {
                console.log('Mapping destinations, count:', dests.length);
                return dests.map((dest: any) => {
                  const soNumber = dest.soNumber || dest.trackingNumber || '';
                  return {
                    id: dest.id,
                    amazonShipmentId: dest.amazonShipmentId || '',
                    amazonReferenceId: dest.amazonReferenceId || '',
                    fbaWarehouse: dest.fbaWarehouse,
                    address: dest.address || getWarehouseAddress(dest.fbaWarehouse),
                    cartons: dest.cartons || dest.actualCartons || 0,
                    chargeableWeight: dest.chargeableWeight || dest.estimatedWeight || dest.weight || 0,
                    status: shipmentData?.status,
                    soNumber: soNumber,
                    trackingNumber: soNumber || `TRACK${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                    progress: getProgressPercentage(shipmentData?.status, shipmentData)
                  };
                });
              } else {
                console.log('No destinations or warehouseDetails found');
                return [];
              }
            } catch (destError) {
              console.error('Error mapping destinations:', destError);
              return [];
            }
          })(),
          timeline: (() => {
            try {
              const events = safeTrackingEvents || [];
              if (events.length === 0) {
                console.log('Timeline - no events, returning empty array');
                return [];
              }
              
              console.log('Timeline - using safeTrackingEvents, length:', events.length);
              
              return events.map((event: any, index: number) => {
                console.log(`Processing tracking event ${index}:`, event);
                if (!event) {
                  console.warn(`Null event at index ${index} in trackingEvents`);
                  return {
                    date: 'Date not available',
                    event: 'No description',
                    location: 'Unknown location',
                    status: 'Unknown',
                    type: 'tracking'
                  };
                }
                return {
                  date: event.timestamp || event.date ? new Date(event.timestamp || event.date).toLocaleString() : 'Date not available',
                  event: event.description || 'No description',
                  location: event.location || 'Unknown location',
                  status: event.status || 'Unknown',
                  type: event.type || 'tracking'
                };
              });
            } catch (timelineError) {
              console.error('Error mapping timeline:', timelineError);
              return [];
            }
          })(),
          documents: shipmentData?.documents || [],
          photos: shipmentData?.photos || [],
          invoice: shipmentData?.invoice || null
        };
        } catch (error: any) {
          console.error('Error transforming shipment data:', error);
          console.error('Error stack:', error.stack);
          console.error('ShipmentData at error:', shipmentData);
          // Don't show toast for transformation errors, just log them
          // Set a basic shipment object to prevent infinite loading
          transformedShipment = {
            id: shipmentData?.id || id,
            status: shipmentData?.status || 'Unknown',
            quoteId: shipmentData?.quoteId || shipmentData?.quote_id,
            createdAt: 'Date not available',
            customer: shipmentData?.customer || {},
            supplier: { name: 'Unknown Supplier', address: 'Unknown Address' },
            masterCargo: { grossWeight: 0, cartonCount: 0, chargeableWeight: 0 },
            serviceMode: 'ocean-lcl',
            currentLocation: 'Unknown',
            destinations: [],
            timeline: [],
            documents: [],
            photos: [],
            invoice: shipmentData?.invoice || null
          };
        }
        
        if (transformedShipment) {
          console.log('=== Shipment Data Debug ===');
          console.log('Original shipmentData from backend:', shipmentData);
          console.log('Transformed shipment destinations:', transformedShipment.destinations);
          console.log('IDs in destinations:', transformedShipment.destinations?.map((d: any) => ({
            id: d.id,
            warehouse: d.fbaWarehouse,
            shipmentId: d.amazonShipmentId,
            referenceId: d.amazonReferenceId
          })));
          
          setShipment(transformedShipment);
          
          // Set the first destination as active
          if (Array.isArray(transformedShipment.destinations) && transformedShipment.destinations.length > 0) {
            setActiveDestination(transformedShipment.destinations[0].id);
          }
        }
      } catch (error: any) {
        console.error('Error fetching shipment data:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
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
    if (shipment && Array.isArray(shipment.destinations)) {
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
    // First check if shipment is delivered
    if (shipment?.status === 'Delivered' || shipment?.status === 'delivered') {
      return 'Delivered';
    }

    // Check if all destinations are delivered
    if (Array.isArray(shipment?.destinations) &&
        shipment.destinations.length > 0 &&
        shipment.destinations.every((d: any) => d.deliveryStatus === 'delivered')) {
      return 'Delivered';
    }

    // Check if invoice is paid but IDs are missing
    if (shipment?.invoice?.status === 'Paid' &&
        Array.isArray(shipment?.destinations) && shipment.destinations.some((d: any) => !d.amazonShipmentId || d.amazonShipmentId === '')) {
      return 'Missing Shipment IDs';
    }

    // If invoice is paid and all IDs are provided, show In Progress
    if (shipment?.invoice?.status === 'Paid' &&
        Array.isArray(shipment?.destinations) && shipment.destinations.every((d: any) => d.amazonShipmentId && d.amazonShipmentId !== '')) {
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
        Array.isArray(shipment?.destinations) && shipment.destinations.every((d: any) => d.amazonShipmentId && d.amazonShipmentId !== '')) {
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
  const activeDestinationData = Array.isArray(shipment?.destinations) ? shipment.destinations.find((d: any) => d.id === activeDestination) : null;
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
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => {
              if (shipment.invoice) {
                // If invoice exists, switch to invoice tab
                setActiveTab('invoice');
              } else if (shipment.quoteId) {
                // Otherwise, navigate to quote page
                navigate(`/quotes/${shipment.quoteId}`);
              } else {
                addToast('Quote information not available', 'error');
              }
            }}
          >
            <FileTextIcon className="h-3.5 w-3.5 mr-1" />
            {shipment.invoice ? 'View Invoice' : 'View Quote'}
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
           Array.isArray(shipment.destinations) && shipment.destinations.some((d: any) => !d.amazonShipmentId || d.amazonShipmentId === '') && (
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
                        {shipment.invoice.dueDate || 'Not set'}
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
             Array.isArray(shipment.destinations) && shipment.destinations.some((d: any) => !d.amazonShipmentId || d.amazonShipmentId === '') && (
              <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-semibold text-red-800 mb-3 flex items-center">
                  <AlertCircleIcon className="h-5 w-5 mr-2" />
                  Required: Enter Amazon IDs for Each Warehouse
                </h4>
                <div className="space-y-3">
                  {Array.isArray(shipment.destinations) && shipment.destinations.map((dest: any) => (
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
              {Array.isArray(shipment.destinations) && shipment.destinations.map((dest: any) => <div key={dest.id} className={`cursor-pointer transition-all rounded-lg p-4 ${activeDestination === dest.id ? 'bg-blue-50 border-2 border-blue-200 shadow-lg' : 'bg-white border border-gray-200 hover:border-gray-300 hover:shadow-md'}`} onClick={() => setActiveDestination(dest.id)}>
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
                        {(() => {
                          // First check for timeline events
                          if (Array.isArray(shipment.timeline) && shipment.timeline.length > 0) {
                            const lastEvent = shipment.timeline[shipment.timeline.length - 1];
                            if (lastEvent?.date) {
                              return new Date(lastEvent.date).toLocaleDateString();
                            }
                          }
                          // Fallback to updated_at or created_at
                          if (shipment.updated_at || shipment.updatedAt) {
                            return new Date(shipment.updated_at || shipment.updatedAt).toLocaleDateString();
                          }
                          if (shipment.created_at || shipment.createdAt) {
                            return new Date(shipment.created_at || shipment.createdAt).toLocaleDateString();
                          }
                          return 'Date not available';
                        })()}
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
                        {Array.isArray(shipment.timeline) && shipment.timeline.length > 0 ? shipment.timeline.map((event: any, index: number) => <div key={index} className="flex">
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
                                {Array.isArray(shipment.timeline) && index < shipment.timeline.length - 1 && <div className="w-0.5 bg-gray-200 h-10"></div>}
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
                          </div>) : (
                          <div className="text-center text-sm text-gray-500">No tracking events available</div>
                        )}
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
                                  const deliveredEvent = Array.isArray(shipment.timeline) ? shipment.timeline.find((e: any) => 
                                    e.event?.toLowerCase().includes('delivered') || 
                                    e.status?.toLowerCase() === 'delivered'
                                  ) : null;
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
                      {activeDestinationData.trackingNumber || activeDestinationData.soNumber || 'Not provided'}
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
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center min-w-0 flex-1">
                    <FileTextIcon className="h-7 w-7 text-[#2E3B55] mr-3 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-gray-900 truncate" title={doc.name}>{doc.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {doc.type === 'invoice' ? 'Commercial Invoice' : doc.type === 'packing-list' ? 'Packing List' : doc.type === 'awb' ? 'Air Waybill' : 'Customs Documentation'}
                      </p>
                    </div>
                  </div>
                  <button type="button" className="text-[#2E3B55] hover:text-[#1e2940] flex-shrink-0" title="Download">
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
              <input
                type="file"
                id="document-upload"
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                onChange={handleDocumentUpload}
                disabled={isUploadingDocument}
              />
              <div className="w-10 h-10 bg-[#E6EDF8] rounded-full flex items-center justify-center mb-2">
                <FileTextIcon className="h-5 w-5 text-[#2E3B55]" />
              </div>
              <h3 className="font-medium text-gray-900">Upload Document</h3>
              <p className="text-xs text-gray-500 mt-1 mb-3">
                Add additional documents to your shipment
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => document.getElementById('document-upload')?.click()}
                disabled={isUploadingDocument}
              >
                {isUploadingDocument ? 'Uploading...' : 'Upload File'}
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
      {activeTab === 'chat' && (
        <div className="h-[600px] bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
          {console.log('=== Chat Tab is Active ===', { activeTab, id, user })}
          {/* Trigger notification check when chat opens */}
          {activeTab === 'chat' && setTimeout(() => {
            console.log('🔔 Triggering manual notification check for chat tab');
            window.dispatchEvent(new CustomEvent('checkNotifications'));
          }, 100)}
          <ChatPanel
            shipmentId={id || ''}
            currentUser={{
              id: user?.id || 'demo-customer',
              name: user?.name || 'Demo Customer',
              role: user?.role === 'admin' ? 'admin' : user?.role === 'staff' ? 'staff' : 'customer' as const
            }}
          />
        </div>
      )}
      {activeTab === 'invoice' && shipment.invoice && (
        <Card>
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-2">
                Invoice Details
              </h2>
              <p className="text-sm text-gray-500">
                Invoice #{shipment.invoice.id} • Created on{' '}
                {shipment.invoice.createdAt ? new Date(shipment.invoice.createdAt).toLocaleDateString() : 'Date not available'}{' '}
                • Due by {shipment.invoice.dueDate || 'Not set'}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant={shipment.invoice.status === 'Paid' ? 'success' : 'warning'}>
                {shipment.invoice.status}
              </Badge>
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => {
                  console.log('Download Invoice clicked');
                  console.log('Shipment:', shipment);
                  console.log('Invoice:', shipment?.invoice);
                  if (shipment && shipment.invoice) {
                    try {
                      generateInvoicePDF(shipment, shipment.invoice);
                      console.log('PDF generation completed');
                    } catch (error) {
                      console.error('Error generating PDF:', error);
                    }
                  } else {
                    console.log('No shipment or invoice data available');
                  }
                }}
              >
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
                        {shipment.invoice.dueDate || 'Not set'}
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