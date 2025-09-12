import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { TruckIcon, PackageIcon, MapPinIcon, ClockIcon, FileTextIcon, DownloadIcon, CheckCircleIcon, AlertCircleIcon, InfoIcon, DollarSignIcon, CalendarIcon, ArrowRightIcon, PlusIcon, TrashIcon, CalculatorIcon, MessageCircleIcon } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { DataService, QuoteRequest } from '../../../services/DataService';
import { useData } from '../../../context/DataContext';
import { ChatPanel } from '../../../components/chat/ChatPanel';
import { useAuth } from '../../../context/AuthContext';

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

export const ShipmentDetails = () => {
  console.log('ShipmentDetails component rendered at:', new Date().toISOString());
  
  const {
    id
  } = useParams<{
    id: string;
  }>();
  const navigate = useNavigate();
  const {
    addToast
  } = useToast();
  const { refreshData } = useData();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [shipment, setShipment] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingCargo, setIsEditingCargo] = useState(false);
  // Form state for actual cargo data with enhanced warehouse management
  const [actualCargoData, setActualCargoData] = useState<any>({
    grossWeight: 0,
    cartonCount: 0,
    dimensionsChanged: false,
    dimensionNotes: '',
    destinations: [] as {
      id: string;
      fbaWarehouse: string;
      amazonShipmentId: string;
      soNumber: string;
      cartons: number;
      weight: number;
      volumetricWeight: number;
      chargeableWeight: number;
      ratePerKg: number;
      subtotal: number;
      isNew?: boolean;
    }[],
    additionalServices: [] as {
      id: string;
      description: string;
      amount: number;
    }[],
    adjustments: [] as {
      id: string;
      description: string;
      amount: number;
    }[],
    notes: ''
  });
  
  // Available FBA warehouses for adding new destinations
  const availableWarehouses = [
    { code: 'FBA ONT8', name: 'Ontario, CA', address: '1600 Discovery Drive, Moreno Valley, CA 92551' },
    { code: 'FBA BFI4', name: 'Kent, WA', address: '2700 Center Dr, DuPont, WA 98327' },
    { code: 'FBA MDW2', name: 'Joliet, IL', address: '250 Emerald Dr, Joliet, IL 60433' },
    { code: 'FBA PHX6', name: 'Phoenix, AZ', address: '4750 West Mohave St, Phoenix, AZ 85043' },
    { code: 'FBA RIC2', name: 'Petersburg, VA', address: '5000 Commerce Way, Petersburg, VA 23803' }
  ];
  // Calculate invoice totals
  const [invoiceData, setInvoiceData] = useState({
    subtotal: 0,
    tax: 0,
    total: 0,
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 14 days from now
  });
  // Fetch shipment data
  useEffect(() => {
    const fetchShipmentData = async () => {
      if (!id) return;
      
      console.log('fetchShipmentData called for id:', id, 'at', new Date().toISOString());
      setIsLoading(true);
      try {
        // Fetch shipment first
        const shipmentData = await DataService.getShipmentById(id);
        console.log('Staff ShipmentDetails - fetched shipmentData:', shipmentData);
        
        if (!shipmentData) {
          addToast('Shipment not found', 'error');
          navigate('/staff/shipments');
          return;
        }
        
        // Fetch quote data (customer data comes from shipmentData.customer)
        const quoteData = await DataService.getQuoteById(shipmentData.quoteId);
        
        console.log('Staff ShipmentDetails - fetched quoteData:', quoteData);
        
        let quoteRequestData: QuoteRequest | null = null;
        if (quoteData) {
          quoteRequestData = await DataService.getQuoteRequestById(quoteData.requestId);
          console.log('Staff ShipmentDetails - fetched quoteRequestData:', quoteRequestData);
        }
        
        console.log('Starting data transformation at:', new Date().toISOString());
        // Transform shipment data to match component's expected format
        const transformedShipment = {
          id: shipmentData.id,
          customer: shipmentData.customer ? {
            id: shipmentData.customer?.id || shipmentData.customerId,
            name: shipmentData.customer?.name || 'Unknown',
            email: shipmentData.customer?.email || 'unknown@example.com',
            company: shipmentData.customer?.company || 'Unknown Company'
          } : {
            id: shipmentData.customerId,
            name: 'Unknown',
            email: 'unknown@example.com',
            company: 'Unknown Company'
          },
          quoteId: shipmentData.quoteId,
          status: shipmentData.status,
          origin: quoteRequestData?.supplierDetails?.city || 'Unknown',
          currentLocation: shipmentData?.trackingEvents && shipmentData.trackingEvents.length > 0 
            ? shipmentData.trackingEvents[shipmentData.trackingEvents.length - 1].location 
            : quoteRequestData?.supplierDetails?.city || 'Unknown',
          supplier: {
            name: quoteRequestData?.supplierDetails?.name || 'Unknown Supplier',
            address: quoteRequestData ? 
              `${quoteRequestData.supplierDetails.address}, ${quoteRequestData.supplierDetails.city}, ${quoteRequestData.supplierDetails.country}` : 
              'Unknown Address'
          },
          masterCargo: {
            estimatedGrossWeight: shipmentData?.cargoDetails?.estimatedWeight || 
                                 shipmentData?.cargo_details?.estimatedWeight || 
                                 quoteRequestData?.destination_warehouses?.cargoDetails?.grossWeight || 
                                 135,
            estimatedCartonCount: shipmentData?.cargoDetails?.estimatedCartonCount || 
                                shipmentData?.cargo_details?.estimatedCartonCount || 
                                quoteRequestData?.destination_warehouses?.cargoDetails?.cartonCount || 
                                9,
            estimatedChargeableWeight: shipmentData?.cargoDetails?.estimatedWeight || 
                                     shipmentData?.cargo_details?.estimatedWeight || 
                                     quoteRequestData?.destination_warehouses?.cargoDetails?.grossWeight || 
                                     144,
            actualGrossWeight: shipmentData?.cargoDetails?.actualWeight || null,
            actualCartonCount: shipmentData?.cargoDetails?.actualCartonCount || null,
            actualChargeableWeight: shipmentData?.cargoDetails?.actualWeight || null
          },
          serviceMode: quoteRequestData?.serviceType === 'Air Express' ? 'air-express' : 
                      quoteRequestData?.serviceType === 'Air Freight' ? 'air-freight' : 
                      'ocean-lcl',
          destinations: (console.log('Processing destinations at:', new Date().toISOString()), (shipmentData?.destinations && shipmentData.destinations.length > 0 ? shipmentData.destinations : [{
            id: 'MDW6',
            fbaWarehouse: 'MDW6',
            amazonShipmentId: '',
            amazonReferenceId: '',
            cartons: 9,
            weight: 135,
            grossWeight: 135,
            estimatedWeight: 135
          }])).map((dest: any) => ({
            id: dest.id,
            amazonShipmentId: dest.amazonShipmentId,
            amazonReferenceId: dest.amazonReferenceId || '',
            fbaWarehouse: dest.fbaWarehouse,
            address: getWarehouseAddress(dest.fbaWarehouse),
            estimatedCartons: dest.cartons,
            estimatedWeight: dest.estimatedWeight || dest.weight || dest.grossWeight || 135,
            actualCartons: null,
            actualWeight: dest.actualWeight || null
          })),
          estimatedTotal: shipmentData?.estimatedTotal || shipmentData?.quotes?.total_cost || 3070,
          actualTotal: null,
          invoice: null,
          timeline: (shipmentData?.trackingEvents || []).map((event: any) => ({
            date: new Date(event.date).toLocaleString(),
            event: event.description,
            location: event.location
          }))
        };
        
        console.log('Transformation object created at:', new Date().toISOString());
        
        // Check if shipment already has an invoice
        if (shipmentData.invoice) {
          transformedShipment.invoice = shipmentData.invoice;
        }
        
        console.log('About to setShipment at:', new Date().toISOString());
        setShipment(transformedShipment);
        console.log('setShipment completed at:', new Date().toISOString());
        
        // Initialize actual cargo data with per-warehouse rates
        const baseRatePerKg = transformedShipment.estimatedTotal / transformedShipment.masterCargo.estimatedGrossWeight;
        
        // If invoice exists, load existing data from it
        if (shipmentData.invoice && shipmentData.invoice.warehouseDetails) {
          setActualCargoData({
            grossWeight: transformedShipment.masterCargo.actualGrossWeight || transformedShipment.masterCargo.estimatedGrossWeight,
            cartonCount: transformedShipment.masterCargo.actualCartonCount || transformedShipment.masterCargo.estimatedCartonCount,
            dimensionsChanged: false,
            dimensionNotes: '',
            destinations: shipmentData.invoice.warehouseDetails.map(warehouse => ({
              id: warehouse.amazonShipmentId || `dest-${Date.now()}-${Math.random()}`,
              fbaWarehouse: warehouse.warehouse,
              amazonShipmentId: warehouse.amazonShipmentId || '',
              amazonReferenceId: warehouse.amazonReferenceId || '',
              soNumber: warehouse.soNumber || '',
              cartons: warehouse.cartons,
              weight: warehouse.weight,
              volumetricWeight: warehouse.volumetricWeight || warehouse.chargeableWeight || warehouse.weight,
              chargeableWeight: warehouse.chargeableWeight,
              ratePerKg: warehouse.ratePerKg,
              subtotal: warehouse.subtotal
            })),
            additionalServices: shipmentData.invoice.additionalServices || [],
            adjustments: shipmentData.invoice.adjustments || [],
            notes: shipmentData.invoice.notes || ''
          });
        } else {
          // Initialize with default values if no invoice exists
          setActualCargoData({
            grossWeight: transformedShipment.masterCargo.actualGrossWeight || transformedShipment.masterCargo.estimatedGrossWeight,
            cartonCount: transformedShipment.masterCargo.actualCartonCount || transformedShipment.masterCargo.estimatedCartonCount,
            dimensionsChanged: false,
            dimensionNotes: '',
            destinations: transformedShipment.destinations.map(dest => {
              const weight = dest.actualWeight || dest.estimatedWeight;
              const volumetricWeight = weight; // Initially set same as weight, can be adjusted
              const chargeableWeight = Math.max(weight, volumetricWeight);
              const ratePerKg = baseRatePerKg;
              return {
                id: dest.id,
                fbaWarehouse: dest.fbaWarehouse,
                amazonShipmentId: dest.amazonShipmentId,
                amazonReferenceId: dest.amazonReferenceId || '',
                soNumber: '', // Initialize as empty string to avoid uncontrolled input warning
                cartons: dest.actualCartons || dest.estimatedCartons,
                weight: weight,
                volumetricWeight: volumetricWeight,
                chargeableWeight: chargeableWeight,
                ratePerKg: ratePerKg,
                subtotal: chargeableWeight * ratePerKg
              };
            }),
            additionalServices: [],
            adjustments: [],
            notes: ''
          });
        }
      } catch (error) {
        console.error('Error fetching shipment data:', error);
        addToast('Failed to load shipment data', 'error');
      } finally {
        console.log('Finally block - about to setIsLoading(false) at:', new Date().toISOString());
        setIsLoading(false);
        console.log('Loading state set to false at:', new Date().toISOString());
      }
    };
    
    fetchShipmentData();
  }, [id, navigate, addToast]);
  // Update invoice calculations whenever cargo data changes
  useEffect(() => {
    if (shipment) {
      calculateInvoice();
    }
  }, [actualCargoData, shipment]);
  const calculateInvoice = () => {
    if (!shipment) return;
    
    // Calculate total from per-warehouse rates
    let warehouseSubtotal = 0;
    actualCargoData.destinations.forEach(dest => {
      const chargeableWeight = typeof dest.chargeableWeight === 'string' ? parseFloat(dest.chargeableWeight) || 0 : dest.chargeableWeight;
      const ratePerKg = typeof dest.ratePerKg === 'string' ? parseFloat(dest.ratePerKg) || 0 : dest.ratePerKg;
      dest.subtotal = chargeableWeight * ratePerKg;
      warehouseSubtotal += dest.subtotal;
    });
    
    // Dimension changes adjustment
    const dimensionAdjustment = actualCargoData.dimensionsChanged ? 75 : 0; // $75 flat fee
    // Additional services total
    const additionalServicesTotal = actualCargoData.additionalServices.reduce((sum, service) => {
      const amount = typeof service.amount === 'string' ? parseFloat(service.amount) || 0 : service.amount;
      return sum + amount;
    }, 0);
    // Adjustments total
    const adjustmentsTotal = actualCargoData.adjustments.reduce((sum, adjustment) => {
      const amount = typeof adjustment.amount === 'string' ? parseFloat(adjustment.amount) || 0 : adjustment.amount;
      return sum + amount;
    }, 0);
    // Calculate new subtotal
    const subtotal = warehouseSubtotal + dimensionAdjustment + additionalServicesTotal + adjustmentsTotal;
    // No automatic tax
    const tax = 0;
    // Calculate total (without tax)
    const total = subtotal;
    setInvoiceData({
      ...invoiceData,
      subtotal,
      tax,
      total
    });
  };
  const handleAddAdditionalService = () => {
    setActualCargoData({
      ...actualCargoData,
      additionalServices: [...actualCargoData.additionalServices, {
        id: `service-${Date.now()}`,
        description: '',
        amount: ''
      }]
    });
  };
  const handleUpdateAdditionalService = (id: string, field: string, value: any) => {
    setActualCargoData({
      ...actualCargoData,
      additionalServices: actualCargoData.additionalServices.map(service => service.id === id ? {
        ...service,
        [field]: value
      } : service)
    });
  };
  const handleRemoveAdditionalService = (id: string) => {
    setActualCargoData({
      ...actualCargoData,
      additionalServices: actualCargoData.additionalServices.filter(service => service.id !== id)
    });
  };
  const handleAddAdjustment = () => {
    setActualCargoData({
      ...actualCargoData,
      adjustments: [...actualCargoData.adjustments, {
        id: `adjustment-${Date.now()}`,
        description: '',
        amount: ''
      }]
    });
  };
  const handleUpdateAdjustment = (id: string, field: string, value: any) => {
    setActualCargoData({
      ...actualCargoData,
      adjustments: actualCargoData.adjustments.map(adjustment => adjustment.id === id ? {
        ...adjustment,
        [field]: value
      } : adjustment)
    });
  };
  const handleRemoveAdjustment = (id: string) => {
    setActualCargoData({
      ...actualCargoData,
      adjustments: actualCargoData.adjustments.filter(adjustment => adjustment.id !== id)
    });
  };
  const handleUpdateDestination = (id: string, field: string, value: any) => {
    setActualCargoData(prev => {
      const updated = {
        ...prev,
        destinations: prev.destinations.map(dest => {
          if (dest.id === id) {
            const updatedDest = { ...dest, [field]: value };
            // Recalculate chargeable weight and subtotal when weight, volumetric weight or rate changes
            if (field === 'weight' || field === 'volumetricWeight' || field === 'ratePerKg') {
              const weight = typeof updatedDest.weight === 'string' ? parseFloat(updatedDest.weight) || 0 : updatedDest.weight;
              const volumetricWeight = typeof updatedDest.volumetricWeight === 'string' ? parseFloat(updatedDest.volumetricWeight) || 0 : updatedDest.volumetricWeight;
              const ratePerKg = typeof updatedDest.ratePerKg === 'string' ? parseFloat(updatedDest.ratePerKg) || 0 : updatedDest.ratePerKg;
              
              // Chargeable weight is the greater of gross weight and volumetric weight
              updatedDest.chargeableWeight = Math.max(weight, volumetricWeight);
              updatedDest.subtotal = updatedDest.chargeableWeight * ratePerKg;
            }
            return updatedDest;
          }
          return dest;
        })
      };
      // Update total weight and carton count
      updated.grossWeight = updated.destinations.reduce((sum, d) => {
        const weight = typeof d.weight === 'string' ? parseFloat(d.weight) || 0 : d.weight;
        return sum + weight;
      }, 0);
      updated.cartonCount = updated.destinations.reduce((sum, d) => {
        const cartons = typeof d.cartons === 'string' ? parseInt(d.cartons) || 0 : d.cartons;
        return sum + cartons;
      }, 0);
      return updated;
    });
  };
  
  const handleAddWarehouse = () => {
    const newId = `dest-${Date.now()}`;
    setActualCargoData(prev => ({
      ...prev,
      destinations: [...prev.destinations, {
        id: newId,
        fbaWarehouse: '',
        amazonShipmentId: '',
        soNumber: '',
        cartons: 0,
        weight: 0,
        volumetricWeight: 0,
        chargeableWeight: 0,
        ratePerKg: shipment.estimatedTotal / (shipment.masterCargo?.estimatedGrossWeight || 1),
        subtotal: 0,
        isNew: true
      }]
    }));
  };
  
  const handleRemoveDestination = (id: string) => {
    setActualCargoData(prev => {
      const updated = {
        ...prev,
        destinations: prev.destinations.filter(d => d.id !== id)
      };
      // Update total weight and carton count
      updated.grossWeight = updated.destinations.reduce((sum, d) => sum + d.weight, 0);
      updated.cartonCount = updated.destinations.reduce((sum, d) => sum + d.cartons, 0);
      return updated;
    });
  };
  const handleGenerateInvoice = async () => {
    setIsLoading(true);
    try {
      // Calculate totals for warehouse details
      const warehouseDetails = actualCargoData.destinations.map(d => {
        const weight = typeof d.weight === 'string' ? parseFloat(d.weight) || 0 : d.weight;
        const volumetricWeight = typeof d.volumetricWeight === 'string' ? parseFloat(d.volumetricWeight) || 0 : d.volumetricWeight;
        const chargeableWeight = Math.max(weight, volumetricWeight);
        const ratePerKg = typeof d.ratePerKg === 'string' ? parseFloat(d.ratePerKg) || 0 : d.ratePerKg;
        const cartons = typeof d.cartons === 'string' ? parseInt(d.cartons) || 0 : d.cartons;
        
        return {
          warehouse: d.fbaWarehouse,
          amazonShipmentId: d.amazonShipmentId,
          soNumber: d.soNumber,
          cartons: cartons,
          weight: weight,
          volumetricWeight: volumetricWeight,
          chargeableWeight: chargeableWeight,
          ratePerKg: ratePerKg,
          subtotal: chargeableWeight * ratePerKg
        };
      });
      
      // Update destinations with actual data
      const updatedDestinations = shipment.destinations.map(dest => {
        const actualDest = actualCargoData.destinations.find(d => d.id === dest.id);
        if (actualDest) {
          const cartons = typeof actualDest.cartons === 'string' ? parseInt(actualDest.cartons) || 0 : actualDest.cartons;
          const weight = typeof actualDest.weight === 'string' ? parseFloat(actualDest.weight) || 0 : actualDest.weight;
          const chargeableWeight = typeof actualDest.chargeableWeight === 'string' ? parseFloat(actualDest.chargeableWeight) || 0 : actualDest.chargeableWeight;
          const ratePerKg = typeof actualDest.ratePerKg === 'string' ? parseFloat(actualDest.ratePerKg) || 0 : actualDest.ratePerKg;
          
          return {
            ...dest,
            actualCartons: cartons,
            actualWeight: weight,
            chargeableWeight: chargeableWeight,
            ratePerKg: ratePerKg,
            subtotal: chargeableWeight * ratePerKg
          };
        }
        return dest;
      });
      
      // Add new destinations
      const newDestinations = actualCargoData.destinations.filter(d => d.isNew).map(d => {
        const cartons = typeof d.cartons === 'string' ? parseInt(d.cartons) || 0 : d.cartons;
        const weight = typeof d.weight === 'string' ? parseFloat(d.weight) || 0 : d.weight;
        const chargeableWeight = typeof d.chargeableWeight === 'string' ? parseFloat(d.chargeableWeight) || 0 : d.chargeableWeight;
        const ratePerKg = typeof d.ratePerKg === 'string' ? parseFloat(d.ratePerKg) || 0 : d.ratePerKg;
        
        return {
          id: d.id,
          fbaWarehouse: d.fbaWarehouse,
          amazonShipmentId: d.amazonShipmentId,
          soNumber: d.soNumber,
          estimatedCartons: cartons,
          estimatedWeight: weight,
          actualCartons: cartons,
          actualWeight: weight,
          chargeableWeight: chargeableWeight,
          ratePerKg: ratePerKg,
          subtotal: chargeableWeight * ratePerKg
        };
      });
      
      const allDestinations = [...updatedDestinations, ...newDestinations];
      
      // Calculate actual totals
      const actualGrossWeight = actualCargoData.destinations.reduce((sum, d) => {
        const weight = typeof d.weight === 'string' ? parseFloat(d.weight) || 0 : d.weight;
        return sum + weight;
      }, 0);
      
      const actualCartonCount = actualCargoData.destinations.reduce((sum, d) => {
        const cartons = typeof d.cartons === 'string' ? parseInt(d.cartons) || 0 : d.cartons;
        return sum + cartons;
      }, 0);
      
      const actualChargeableWeight = actualCargoData.destinations.reduce((sum, d) => {
        const chargeableWeight = typeof d.chargeableWeight === 'string' ? parseFloat(d.chargeableWeight) || 0 : d.chargeableWeight;
        return sum + chargeableWeight;
      }, 0);
      
      // Create the invoice object
      const invoice = {
        id: `INV-${Date.now()}`,
        status: 'Pending',
        amount: invoiceData.total,
        dueDate: invoiceData.dueDate,
        createdAt: new Date().toISOString(),
        warehouseDetails: warehouseDetails,
        additionalServices: actualCargoData.additionalServices.map(service => ({
          ...service,
          amount: typeof service.amount === 'string' ? parseFloat(service.amount) || 0 : service.amount
        })),
        adjustments: actualCargoData.adjustments.map(adj => ({
          ...adj,
          amount: typeof adj.amount === 'string' ? parseFloat(adj.amount) || 0 : adj.amount
        })),
        notes: actualCargoData.notes,
        subtotal: invoiceData.subtotal,
        total: invoiceData.total
      };
      
      // Update the shipment with actual cargo data and invoice
      const updatedShipment = {
        ...shipment,
        masterCargo: {
          ...shipment.masterCargo,
          actualGrossWeight: actualGrossWeight,
          actualCartonCount: actualCartonCount,
          actualChargeableWeight: actualChargeableWeight
        },
        destinations: allDestinations,
        actualTotal: invoiceData.total,
        invoice: invoice
      };
      
      // Save to DataService
      const savedShipment = await DataService.updateShipment(shipment.id, updatedShipment);
      
      if (savedShipment) {
        // Preserve customer data from original shipment since update doesn't return it
        const updatedShipmentWithCustomer = {
          ...savedShipment,
          customer: shipment?.customer || null
        };
        setShipment(updatedShipmentWithCustomer);
        setIsEditingCargo(false);
        addToast('Invoice generated successfully! The customer has been notified.', 'success');
        
        // Don't refresh data context - it causes re-fetch without customer join
        // refreshData();
      } else {
        throw new Error('Failed to save shipment');
      }
    } catch (error) {
      console.error('Error generating invoice:', error);
      addToast('Failed to generate invoice. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Awaiting Pickup':
        return 'warning';
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
      default:
        return 'default';
    }
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
            <Button variant="secondary" onClick={() => navigate('/staff/shipments')}>
              Back to Shipments
            </Button>
          </div>
        </Card>
      </div>
    );
  }
  
  return <div className="max-w-6xl mx-auto">
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shipment {id}</h1>
          <div className="flex items-center mt-1">
            <Badge variant={getStatusColor(shipment.status) as any} className="mr-2">
              {shipment.status}
            </Badge>
            <span className="text-sm text-gray-600">
              Customer: {shipment.customer?.company || 'Unknown Company'} ({shipment.customer?.name || 'Unknown Customer'})
            </span>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button variant="secondary" size="sm" onClick={() => navigate('/staff/shipments/update?id=' + id)}>
            <TruckIcon className="h-3.5 w-3.5 mr-1" />
            Update Status
          </Button>
          <Button variant={shipment.invoice ? 'tertiary' : 'primary'} size="sm" onClick={() => setIsEditingCargo(true)} disabled={Boolean(shipment.invoice)}>
            <DollarSignIcon className="h-3.5 w-3.5 mr-1" />
            {shipment.invoice ? 'Invoice Generated' : 'Generate Invoice'}
          </Button>
        </div>
      </div>
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex -mb-px">
          <button className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'overview' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`} onClick={() => setActiveTab('overview')}>
            Overview
          </button>
          <button className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'invoice' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`} onClick={() => setActiveTab('invoice')}>
            Invoice Details
          </button>
          <button className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'documents' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`} onClick={() => setActiveTab('documents')}>
            Documents
          </button>
          <button className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'chat' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`} onClick={() => setActiveTab('chat')}>
            <MessageCircleIcon className="inline h-4 w-4 mr-1" />
            Chat
          </button>
        </nav>
      </div>
      {activeTab === 'overview' && <div className="space-y-6">
          {isEditingCargo ? <Card>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Confirm Shipment Details
              </h2>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-semibold text-gray-800">
                  Warehouse Destinations & Rates
                </h3>
                <button type="button" onClick={handleAddWarehouse} className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 flex items-center transition-colors">
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add Warehouse
                </button>
              </div>
              <div className="space-y-4 mb-6">
                {actualCargoData.destinations.map((dest, index) => {
            return <div key={dest.id} className="bg-blue-50 border border-blue-200 rounded-lg p-5 hover:shadow-md transition-all">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-3">
                          {dest.isNew ? (
                            <>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Select Warehouse
                                </label>
                                <select 
                                  value={dest.fbaWarehouse} 
                                  onChange={e => handleUpdateDestination(dest.id, 'fbaWarehouse', e.target.value)}
                                  className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                >
                                  <option value="">Choose warehouse...</option>
                                  {availableWarehouses.map(wh => (
                                    <option key={wh.code} value={wh.code}>
                                      {wh.code} - {wh.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  SO Number
                                </label>
                                <input 
                                  type="text" 
                                  value={dest.soNumber} 
                                  onChange={e => handleUpdateDestination(dest.id, 'soNumber', e.target.value)}
                                  placeholder="Enter SO Number"
                                  className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                />
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="col-span-2">
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Warehouse
                                    </label>
                                    <input 
                                      type="text" 
                                      value={dest.fbaWarehouse} 
                                      onChange={e => handleUpdateDestination(dest.id, 'fbaWarehouse', e.target.value)}
                                      className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                      disabled
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      SO Number
                                    </label>
                                    <input 
                                      type="text" 
                                      value={dest.soNumber} 
                                      onChange={e => handleUpdateDestination(dest.id, 'soNumber', e.target.value)}
                                      placeholder="Enter SO Number"
                                      className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mt-3">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Amazon Shipment ID
                                    </label>
                                    <input 
                                      type="text" 
                                      value={dest.amazonShipmentId || ''} 
                                      className="w-full px-3 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-gray-600"
                                      disabled
                                      title="Provided by customer"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Amazon Reference ID
                                    </label>
                                    <input 
                                      type="text" 
                                      value={dest.amazonReferenceId || ''} 
                                      className="w-full px-3 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-gray-600"
                                      disabled
                                      title="Provided by customer"
                                    />
                                  </div>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveDestination(dest.id)}
                          className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg ml-2 mt-5 transition-colors"
                          title="Remove warehouse"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Cartons
                          </label>
                          <input 
                            type="number" 
                            value={dest.cartons} 
                            onChange={e => handleUpdateDestination(dest.id, 'cartons', parseInt(e.target.value) || 0)} 
                            className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Gross Weight (kg)
                          </label>
                          <input 
                            type="text"
                            inputMode="decimal"
                            value={dest.weight || ''} 
                            onChange={e => handleUpdateDestination(dest.id, 'weight', e.target.value)} 
                            className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Volumetric Weight (kg)
                          </label>
                          <input 
                            type="text"
                            inputMode="decimal"
                            value={dest.volumetricWeight || ''} 
                            onChange={e => handleUpdateDestination(dest.id, 'volumetricWeight', e.target.value)} 
                            className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Rate ($/kg)
                          </label>
                          <input 
                            type="text"
                            inputMode="decimal"
                            value={dest.ratePerKg || ''} 
                            onChange={e => handleUpdateDestination(dest.id, 'ratePerKg', e.target.value)} 
                            className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                          />
                        </div>
                      </div>
                      <div className="mt-4 flex justify-end items-center">
                        <span className="text-sm text-gray-600 mr-2">Warehouse Subtotal:</span>
                        <span className="text-lg font-bold text-blue-700">
                          ${(typeof dest.subtotal === 'number' ? dest.subtotal : 0).toFixed(2)}
                        </span>
                      </div>
                    </div>;
          })}
              </div>
              {actualCargoData.additionalServices.length > 0 && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-base font-semibold text-gray-800">
                      Additional Services
                  </h3>
                  <button type="button" onClick={handleAddAdditionalService} className="text-sm bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 flex items-center transition-colors">
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add Service
                  </button>
                </div>
                <div className="space-y-3">
                    {actualCargoData.additionalServices.map(service => <div key={service.id} className="flex items-start space-x-3 bg-gray-50 p-3 rounded-lg">
                        <div className="flex-grow">
                          <input type="text" placeholder="Service description" value={service.description} onChange={e => handleUpdateAdditionalService(service.id, 'description', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 mb-2" />
                          <div className="flex items-center">
                            <span className="text-gray-500 mr-2">$</span>
                            <input type="text" inputMode="decimal" placeholder="Amount" value={service.amount || ''} onChange={e => handleUpdateAdditionalService(service.id, 'amount', e.target.value)} className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900" />
                          </div>
                        </div>
                        <button type="button" onClick={() => handleRemoveAdditionalService(service.id)} className="text-red-500 hover:text-red-700">
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>)}
                  </div>
                </div>
              )}
              {actualCargoData.adjustments.length > 0 && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-base font-semibold text-gray-800">
                      Adjustments
                  </h3>
                  <button type="button" onClick={handleAddAdjustment} className="text-sm bg-orange-600 text-white px-3 py-1.5 rounded-lg hover:bg-orange-700 flex items-center transition-colors">
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add Adjustment
                  </button>
                </div>
                <div className="space-y-3">
                    {actualCargoData.adjustments.map(adjustment => <div key={adjustment.id} className="flex items-start space-x-3 bg-gray-50 p-3 rounded-lg">
                        <div className="flex-grow">
                          <input type="text" placeholder="Adjustment description" value={adjustment.description} onChange={e => handleUpdateAdjustment(adjustment.id, 'description', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 mb-2" />
                          <div className="flex items-center">
                            <span className="text-gray-500 mr-2">$</span>
                            <input type="text" inputMode="decimal" placeholder="Amount (use negative for discounts)" value={adjustment.amount || ''} onChange={e => handleUpdateAdjustment(adjustment.id, 'amount', e.target.value)} className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900" />
                          </div>
                        </div>
                        <button type="button" onClick={() => handleRemoveAdjustment(adjustment.id)} className="text-red-500 hover:text-red-700">
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>)}
                  </div>
                </div>
              )}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-base font-semibold text-gray-800">
                    Invoice Summary
                  </h3>
                  <div className="flex gap-2">
                    {actualCargoData.additionalServices.length === 0 && (
                      <button type="button" onClick={handleAddAdditionalService} className="text-sm bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 flex items-center transition-colors">
                        <PlusIcon className="h-4 w-4 mr-1" />
                        Add Service
                      </button>
                    )}
                    {actualCargoData.adjustments.length === 0 && (
                      <button type="button" onClick={handleAddAdjustment} className="text-sm bg-orange-600 text-white px-3 py-1.5 rounded-lg hover:bg-orange-700 flex items-center transition-colors">
                        <PlusIcon className="h-4 w-4 mr-1" />
                        Add Adjustment
                      </button>
                    )}
                    <button type="button" onClick={calculateInvoice} className="text-sm bg-gray-600 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 flex items-center transition-colors">
                      <CalculatorIcon className="h-4 w-4 mr-1" />
                      Recalculate
                    </button>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-5 border border-gray-200">
                  <div className="space-y-2">
                    {/* Per-warehouse breakdown */}
                    <div className="mb-3">
                      <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">
                        Warehouse Charges
                      </h4>
                      {actualCargoData.destinations.map(dest => {
                        const ratePerKg = typeof dest.ratePerKg === 'string' ? parseFloat(dest.ratePerKg) || 0 : dest.ratePerKg;
                        const chargeableWeight = typeof dest.chargeableWeight === 'string' ? parseFloat(dest.chargeableWeight) || 0 : dest.chargeableWeight;
                        const subtotal = typeof dest.subtotal === 'number' ? dest.subtotal : 0;
                        return (
                          <div key={dest.id} className="flex justify-between items-center py-1">
                            <span className="text-sm text-gray-700">
                              {dest.fbaWarehouse || 'New Warehouse'} ({chargeableWeight} kg @ ${ratePerKg.toFixed(2)}/kg)
                            </span>
                            <span className="text-sm font-medium text-gray-900">
                              ${subtotal.toFixed(2)}
                            </span>
                          </div>
                        );
                      })}
                      <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">
                          Total Warehouse Charges
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          ${actualCargoData.destinations.reduce((sum, d) => {
                            const subtotal = typeof d.subtotal === 'number' ? d.subtotal : 0;
                            return sum + subtotal;
                          }, 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    {/* Dimension changes */}
                    {actualCargoData.dimensionsChanged && <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">
                          Dimension Change Fee
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          $75.00
                        </span>
                      </div>}
                    {/* Additional services */}
                    {actualCargoData.additionalServices.map(service => {
                      const amount = typeof service.amount === 'string' ? parseFloat(service.amount) || 0 : service.amount;
                      return (
                        <div key={service.id} className="flex justify-between items-center">
                          <span className="text-sm text-gray-700">
                            {service.description || 'Unnamed Service'}
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            ${amount.toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                    {/* Adjustments */}
                    {actualCargoData.adjustments.map(adjustment => {
                      const amount = typeof adjustment.amount === 'string' ? parseFloat(adjustment.amount) || 0 : adjustment.amount;
                      return (
                        <div key={adjustment.id} className="flex justify-between items-center">
                          <span className="text-sm text-gray-700">
                            {adjustment.description || 'Unnamed Adjustment'}
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            ${amount.toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                    <div className="border-t-2 border-gray-300 pt-3 mt-3 flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">
                        Subtotal
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        ${invoiceData.subtotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="border-t border-gray-200 pt-3 mt-2 flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">
                        Total Due
                      </span>
                      <span className="text-xl font-bold text-blue-600">
                        ${invoiceData.total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <input type="date" value={invoiceData.dueDate} onChange={e => setInvoiceData({
            ...invoiceData,
            dueDate: e.target.value
          })} min={new Date().toISOString().split('T')[0]} className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900" />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea value={actualCargoData.notes} onChange={e => setActualCargoData({
            ...actualCargoData,
            notes: e.target.value
          })} placeholder="Add any additional notes for the invoice..." className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900" rows={3} />
              </div>
              <div className="flex justify-end space-x-3">
                <Button variant="tertiary" onClick={() => setIsEditingCargo(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleGenerateInvoice} isLoading={isLoading}>
                  Generate Invoice
                </Button>
              </div>
            </Card> : <>
              <Card>
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Shipment Details
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">
                      Customer Information
                    </h3>
                    <p className="font-medium text-gray-900">
                      {shipment.customer?.company || 'Unknown Company'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {shipment.customer?.name || 'Unknown Customer'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {shipment.customer?.email || 'No email'}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">
                      Shipment Information
                    </h3>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Quote ID:</span>
                        <span className="text-sm text-gray-900">
                          {shipment.quoteId}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Origin:</span>
                        <span className="text-sm text-gray-900">
                          {shipment.origin}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">
                      Supplier Information
                    </h3>
                    <p className="font-medium text-gray-900">
                      {shipment.supplier?.name || 'Unknown Supplier'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {shipment.supplier?.address || 'No address'}
                    </p>
                  </div>
                </div>
              </Card>
              <Card>
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Cargo Details
                </h2>
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Estimated Cargo
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <span className="text-xs text-gray-500 block">
                          Carton Count
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {shipment.masterCargo?.estimatedCartonCount || 0}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 block">
                          Gross Weight
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {shipment.masterCargo?.estimatedGrossWeight || 0} kg
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 block">
                          Volumetric Weight
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {shipment.masterCargo?.estimatedChargeableWeight || 0} kg
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 block">
                          Chargeable Weight
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {shipment.masterCargo?.estimatedChargeableWeight || 0} kg
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                {shipment.invoice && shipment.invoice.warehouseDetails && shipment.invoice.warehouseDetails.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                      Final Cargo Details
                    </h3>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <span className="text-xs text-gray-500 block">
                            Total Cartons
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {shipment.invoice.warehouseDetails.reduce((sum: number, w: any) => sum + w.cartons, 0)}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 block">
                            Total Gross Weight
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {shipment.invoice.warehouseDetails.reduce((sum: number, w: any) => sum + w.weight, 0).toFixed(2)} kg
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 block">
                            Total Volumetric Weight
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {shipment.invoice.warehouseDetails.reduce((sum: number, w: any) => sum + (w.volumetricWeight || w.chargeableWeight), 0).toFixed(2)} kg
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 block">
                            Total Chargeable Weight
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {shipment.invoice.warehouseDetails.reduce((sum: number, w: any) => sum + w.chargeableWeight, 0).toFixed(2)} kg
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-blue-200">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600 font-medium">
                            Final Invoice Total
                          </span>
                          <span className="text-sm font-bold text-blue-600">
                            ${shipment.invoice.total?.toFixed(2) || shipment.invoice.amount?.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {shipment.masterCargo?.actualGrossWeight && !shipment.invoice && <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                      Actual Cargo
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <span className="text-xs text-gray-500 block">
                            Carton Count
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {shipment.masterCargo?.actualCartonCount || 0}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 block">
                            Gross Weight
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {shipment.masterCargo?.actualGrossWeight || 0} kg
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 block">
                            Volumetric Weight
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {shipment.masterCargo?.actualChargeableWeight || 0} kg
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 block">
                            Chargeable Weight
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {shipment.masterCargo?.actualChargeableWeight || 0} kg
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">
                            Actual Total
                          </span>
                          <span className="text-sm font-medium text-blue-600">
                            $
                            {shipment.actualTotal?.toFixed(2) || shipment.estimatedTotal.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>}
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Destinations
                </h3>
                <div className="space-y-4">
                  {shipment.invoice && shipment.invoice.warehouseDetails && shipment.invoice.warehouseDetails.length > 0 ? (
                    // Show invoice warehouse details when available
                    shipment.invoice.warehouseDetails.map((warehouse: any, index: number) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div>
                          <div className="flex justify-between items-center">
                            <div className="flex items-start space-x-6">
                              <div>
                                <h4 className="font-medium text-gray-900 text-base">
                                  {warehouse.warehouse}
                                </h4>
                                {warehouse.soNumber && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    SO# {warehouse.soNumber}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center space-x-4 text-sm">
                                <div className="flex items-center">
                                  <span className="text-gray-500 mr-1">Cartons:</span>
                                  <span className="font-medium text-gray-900">{warehouse.cartons}</span>
                                </div>
                                <div className="text-gray-300">•</div>
                                <div className="flex items-center">
                                  <span className="text-gray-500 mr-1">Weight:</span>
                                  <span className="font-medium text-gray-900">{warehouse.chargeableWeight} kg</span>
                                </div>
                                <div className="text-gray-300">•</div>
                                <div className="flex items-center">
                                  <span className="text-gray-500 mr-1">Rate:</span>
                                  <span className="font-medium text-gray-900">${warehouse.ratePerKg.toFixed(2)}/kg</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              <Badge variant="success">Final</Badge>
                              <div className="text-right">
                                <span className="text-sm text-gray-600">Subtotal: </span>
                                <span className="text-lg font-semibold text-gray-900">
                                  ${(warehouse.chargeableWeight * warehouse.ratePerKg).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                          {(warehouse.amazonShipmentId || warehouse.amazonReferenceId) && (
                            <div className="text-xs text-gray-500 mt-2">
                              {warehouse.amazonShipmentId && (
                                <span>Amazon ID: {warehouse.amazonShipmentId}</span>
                              )}
                              {warehouse.amazonShipmentId && warehouse.amazonReferenceId && (
                                <span className="mx-2">•</span>
                              )}
                              {warehouse.amazonReferenceId && (
                                <span>Reference: {warehouse.amazonReferenceId}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    // Show original destinations when no invoice
                    shipment.destinations.map(dest => (
                      <div key={dest.id} className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">
                          {dest.fbaWarehouse}
                        </h4>
                        <p className="text-xs text-gray-500 mb-1">
                          Amazon Shipment ID: {dest.amazonShipmentId || 'Not provided'}
                        </p>
                        <p className="text-xs text-gray-500 mb-3">
                          Amazon Reference ID: {dest.amazonReferenceId || 'Not provided'}
                        </p>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <span className="text-xs text-gray-500 block">
                              Estimated Cartons
                            </span>
                            <span className="text-sm font-medium text-gray-900">
                              {dest.estimatedCartons}
                            </span>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500 block">
                              Estimated Weight
                            </span>
                            <span className="text-sm font-medium text-gray-900">
                              {dest.estimatedWeight} kg
                            </span>
                          </div>
                        </div>
                        {dest.actualCartons && (
                          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-200">
                            <div>
                              <span className="text-xs text-gray-500 block">
                                Actual Cartons
                              </span>
                              <span className="text-sm font-medium text-gray-900">
                                {dest.actualCartons}
                              </span>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500 block">
                                Actual Weight
                              </span>
                              <span className="text-sm font-medium text-gray-900">
                                {dest.actualWeight} kg
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </Card>
              <Card>
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Shipment Timeline
                </h2>
                <div className="space-y-4">
                  {shipment.timeline.map((event, index) => <div key={index} className="flex">
                      <div className="mr-3">
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <ClockIcon className="h-4 w-4 text-blue-600" />
                          </div>
                          {index < shipment.timeline.length - 1 && <div className="w-0.5 bg-gray-200 h-full mt-2"></div>}
                        </div>
                      </div>
                      <div className="pb-4">
                        <p className="text-sm font-medium text-gray-900">
                          {event.event}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {event.date} • {event.location}
                        </p>
                      </div>
                    </div>)}
                </div>
              </Card>
            </>}
        </div>}
      {activeTab === 'invoice' && <Card>
          <h2 className="text-lg font-medium text-gray-900 mb-6">
            Invoice Management
          </h2>
          {!shipment.invoice ? <div className="text-center py-8">
              <DollarSignIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-gray-500 mb-1">No Invoice Generated Yet</h3>
              <p className="text-sm text-gray-400 mb-4">
                Generate an invoice by entering actual cargo data.
              </p>
              <Button variant="primary" onClick={() => {
          setIsEditingCargo(true);
          setActiveTab('overview');
        }}>
                <DollarSignIcon className="h-4 w-4 mr-1" />
                Generate Invoice
              </Button>
            </div> : <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-base font-medium text-gray-900">
                    Invoice #{shipment.invoice.id}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Created on{' '}
                    {new Date(shipment.invoice.createdAt).toLocaleDateString()}{' '}
                    • Due by {shipment.invoice.dueDate}
                  </p>
                </div>
                <Badge variant={shipment.invoice.status === 'Paid' ? 'success' : 'warning'}>
                  {shipment.invoice.status}
                </Badge>
              </div>
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Bill To
                    </h4>
                    <p className="text-sm font-medium text-gray-900">
                      {shipment.customer?.company || 'Unknown Company'}
                    </p>
                    <p className="text-sm text-gray-700">
                      {shipment.customer?.name || 'Unknown'}
                    </p>
                    <p className="text-sm text-gray-700">
                      {shipment.customer?.email || 'No email'}
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
                      {shipment.invoice.warehouseDetails && shipment.invoice.warehouseDetails.map((warehouse, index) => (
                        <tr key={index}>
                          <td className="px-3 py-4 text-sm text-gray-700">
                            {warehouse.warehouse}
                            {warehouse.soNumber && (
                              <span className="text-xs text-gray-500"> (SO: {warehouse.soNumber})</span>
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
                      {shipment.invoice.additionalServices?.map((service, index) => <tr key={index}>
                            <td className="px-3 py-4 text-sm text-gray-700">
                              {service.description}
                            </td>
                            <td className="px-3 py-4 text-sm text-gray-900 text-right">
                              ${service.amount.toFixed(2)}
                            </td>
                          </tr>)}
                      {/* Adjustments */}
                      {shipment.invoice.adjustments?.map((adjustment, index) => <tr key={index}>
                          <td className="px-3 py-4 text-sm text-gray-700">
                            {adjustment.description}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-900 text-right">
                            ${adjustment.amount.toFixed(2)}
                          </td>
                        </tr>)}
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
              {shipment.invoice.notes && <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </h3>
                  <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
                    {shipment.invoice.notes}
                  </p>
                </div>}
              <div className="flex justify-between items-center">
                <div>
                  {shipment.invoice.status !== 'Paid' && <div className="flex items-center text-yellow-600">
                      <AlertCircleIcon className="h-4 w-4 mr-1" />
                      <span className="text-sm">Payment pending</span>
                    </div>}
                </div>
                <div className="flex space-x-3">
                  <Button variant="secondary" size="sm">
                    <FileTextIcon className="h-4 w-4 mr-1" />
                    Download Invoice
                  </Button>
                  <Button variant="primary" size="sm">
                    <DownloadIcon className="h-4 w-4 mr-1" />
                    Send to Customer
                  </Button>
                </div>
              </div>
            </div>}
        </Card>}
      {activeTab === 'documents' && <Card>
          <h2 className="text-lg font-medium text-gray-900 mb-6">
            Shipment Documents
          </h2>
          <div className="mb-4">
            <Button variant="secondary" size="sm">
              <DownloadIcon className="h-4 w-4 mr-1" />
              Upload Document
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Example document items */}
            <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition">
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <FileTextIcon className="h-8 w-8 text-blue-500 mr-3" />
                  <div>
                    <h3 className="font-medium text-gray-900">
                      Commercial Invoice.pdf
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Commercial Invoice
                    </p>
                  </div>
                </div>
                <button type="button" className="text-blue-600 hover:text-blue-800" title="Download">
                  <DownloadIcon className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                <span className="text-xs text-gray-500">
                  Uploaded on 2023-11-05
                </span>
                <button type="button" className="text-xs text-blue-600 hover:text-blue-800">
                  View
                </button>
              </div>
            </div>
            <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition">
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <FileTextIcon className="h-8 w-8 text-blue-500 mr-3" />
                  <div>
                    <h3 className="font-medium text-gray-900">
                      Packing List.xlsx
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Packing List</p>
                  </div>
                </div>
                <button type="button" className="text-blue-600 hover:text-blue-800" title="Download">
                  <DownloadIcon className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                <span className="text-xs text-gray-500">
                  Uploaded on 2023-11-05
                </span>
                <button type="button" className="text-xs text-blue-600 hover:text-blue-800">
                  View
                </button>
              </div>
            </div>
            <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition">
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <FileTextIcon className="h-8 w-8 text-blue-500 mr-3" />
                  <div>
                    <h3 className="font-medium text-gray-900">
                      Air Waybill.pdf
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Air Waybill</p>
                  </div>
                </div>
                <button type="button" className="text-blue-600 hover:text-blue-800" title="Download">
                  <DownloadIcon className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                <span className="text-xs text-gray-500">
                  Uploaded on 2023-11-07
                </span>
                <button type="button" className="text-xs text-blue-600 hover:text-blue-800">
                  View
                </button>
              </div>
            </div>
          </div>
        </Card>}
      
      {activeTab === 'chat' && (
        <Card>
          <div className="h-[600px]">
            <ChatPanel 
              shipmentId={id || ''} 
              currentUser={{
                id: user?.id || 'staff-1',
                name: user?.name || 'Staff Member',
                role: user?.role === 'admin' ? 'admin' : 'staff'
              }}
            />
          </div>
        </Card>
      )}
    </div>;
};