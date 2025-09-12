import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { TruckIcon, PackageIcon, SearchIcon, PlusIcon, TrashIcon, FileTextIcon, ArrowRightIcon, DollarSignIcon, CalculatorIcon, InfoIcon, ReceiptIcon, CheckIcon, XIcon } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
type Shipment = {
  id: string;
  customer: {
    id: string;
    name: string;
    email: string;
    company: string;
  };
  quoteId: string;
  status: string;
  estimatedTotal: number;
  destinations: {
    id: string;
    fbaWarehouse: string;
    amazonShipmentId: string;
    cartons: number;
    estimatedWeight: number;
    actualWeight?: number;
  }[];
  cargoDetails: {
    estimatedCartonCount: number;
    estimatedWeight: number;
    actualCartonCount?: number;
    actualWeight?: number;
    dimensionChanges?: boolean;
  };
};
export const CreateInvoice = () => {
  const navigate = useNavigate();
  const {
    addToast
  } = useToast();
  const [loading, setLoading] = useState(false);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [step, setStep] = useState(1);
  const [invoiceData, setInvoiceData] = useState({
    shipmentId: '',
    quoteId: '',
    customer: {
      name: '',
      company: '',
      email: ''
    },
    originalQuoteAmount: 0,
    actualCargoDetails: {
      cartonCount: 0,
      weight: 0,
      dimensions: {
        changed: false,
        notes: ''
      }
    },
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
    subtotal: 0,
    tax: 0,
    total: 0,
    notes: '',
    dueDate: ''
  });
  // Mock data for demonstration
  useEffect(() => {
    // In a real app, you'd fetch this from an API
    const mockShipments: Shipment[] = [{
      id: 'SH-1234',
      customer: {
        id: 'cust-1',
        name: 'John Doe',
        email: 'john@acmeimports.com',
        company: 'Acme Imports'
      },
      quoteId: 'Q-3456',
      status: 'In Transit',
      estimatedTotal: 2450,
      destinations: [{
        id: 'dest-1',
        fbaWarehouse: 'FBA ONT8',
        amazonShipmentId: 'FBA15ABCDE',
        cartons: 20,
        estimatedWeight: 300,
        actualWeight: 320
      }, {
        id: 'dest-2',
        fbaWarehouse: 'FBA BFI4',
        amazonShipmentId: 'FBA15FGHIJ',
        cartons: 10,
        estimatedWeight: 150
      }],
      cargoDetails: {
        estimatedCartonCount: 30,
        estimatedWeight: 450,
        actualCartonCount: 31,
        actualWeight: 470,
        dimensionChanges: true
      }
    }, {
      id: 'SH-1235',
      customer: {
        id: 'cust-2',
        name: 'Lisa Wong',
        email: 'lisa@globaltraders.com',
        company: 'Global Traders Inc'
      },
      quoteId: 'Q-3457',
      status: 'Customs',
      estimatedTotal: 1850,
      destinations: [{
        id: 'dest-3',
        fbaWarehouse: 'FBA ONT8',
        amazonShipmentId: 'FBA15KLMNO',
        cartons: 15,
        estimatedWeight: 220
      }],
      cargoDetails: {
        estimatedCartonCount: 15,
        estimatedWeight: 220
      }
    }];
    setShipments(mockShipments);
  }, []);
  const filteredShipments = searchQuery ? shipments.filter(s => s.id.toLowerCase().includes(searchQuery.toLowerCase()) || (s.customer.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (s.customer.company || '').toLowerCase().includes(searchQuery.toLowerCase())) : shipments;
  const handleSelectShipment = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    // Pre-populate invoice data
    setInvoiceData({
      ...invoiceData,
      shipmentId: shipment.id,
      quoteId: shipment.quoteId,
      customer: {
        name: shipment.customer.name,
        company: shipment.customer.company || 'Unknown Company',
        email: shipment.customer.email
      },
      originalQuoteAmount: shipment.estimatedTotal,
      actualCargoDetails: {
        cartonCount: shipment?.cargoDetails?.actualCartonCount || shipment?.cargoDetails?.estimatedCartonCount || 0,
        weight: shipment?.cargoDetails?.actualWeight || shipment?.cargoDetails?.estimatedWeight || 0,
        dimensions: {
          changed: shipment?.cargoDetails?.dimensionChanges || false,
          notes: ''
        }
      },
      additionalServices: [],
      adjustments: [],
      subtotal: shipment.estimatedTotal,
      tax: 0,
      total: shipment.estimatedTotal,
      notes: '',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 days from now
    });
    setStep(2);
  };
  const handleAddAdditionalService = () => {
    const newService = {
      id: `service-${Date.now()}`,
      description: '',
      amount: 0
    };
    setInvoiceData({
      ...invoiceData,
      additionalServices: [...invoiceData.additionalServices, newService]
    });
  };
  const handleRemoveAdditionalService = (id: string) => {
    setInvoiceData({
      ...invoiceData,
      additionalServices: invoiceData.additionalServices.filter(s => s.id !== id)
    });
  };
  const handleUpdateAdditionalService = (id: string, field: string, value: any) => {
    setInvoiceData({
      ...invoiceData,
      additionalServices: invoiceData.additionalServices.map(s => s.id === id ? {
        ...s,
        [field]: value
      } : s)
    });
  };
  const handleAddAdjustment = () => {
    const newAdjustment = {
      id: `adjustment-${Date.now()}`,
      description: '',
      amount: 0
    };
    setInvoiceData({
      ...invoiceData,
      adjustments: [...invoiceData.adjustments, newAdjustment]
    });
  };
  const handleRemoveAdjustment = (id: string) => {
    setInvoiceData({
      ...invoiceData,
      adjustments: invoiceData.adjustments.filter(a => a.id !== id)
    });
  };
  const handleUpdateAdjustment = (id: string, field: string, value: any) => {
    setInvoiceData({
      ...invoiceData,
      adjustments: invoiceData.adjustments.map(a => a.id === id ? {
        ...a,
        [field]: value
      } : a)
    });
  };
  const calculateTotals = () => {
    const additionalServicesTotal = invoiceData.additionalServices.reduce((sum, s) => sum + s.amount, 0);
    const adjustmentsTotal = invoiceData.adjustments.reduce((sum, a) => sum + a.amount, 0);
    // Calculate weight difference adjustment
    const weightDifference = invoiceData.actualCargoDetails.weight - (selectedShipment?.cargoDetails.estimatedWeight || 0);
    const weightAdjustment = weightDifference > 0 ? weightDifference * 12.5 : 0; // Assuming $12.5 per kg for excess weight
    // Calculate carton count adjustment
    const cartonDifference = invoiceData.actualCargoDetails.cartonCount - (selectedShipment?.cargoDetails.estimatedCartonCount || 0);
    const cartonAdjustment = cartonDifference > 0 ? cartonDifference * 15 : 0; // Assuming $15 per additional carton
    // Dimension changes adjustment (flat fee if dimensions changed)
    const dimensionAdjustment = invoiceData.actualCargoDetails.dimensions.changed ? 75 : 0; // $75 flat fee for dimension changes
    const subtotal = invoiceData.originalQuoteAmount + additionalServicesTotal + adjustmentsTotal + weightAdjustment + cartonAdjustment + dimensionAdjustment;
    const tax = 0; // No automatic tax
    const total = subtotal;
    setInvoiceData({
      ...invoiceData,
      subtotal,
      tax,
      total
    });
  };
  useEffect(() => {
    if (step === 3) {
      calculateTotals();
    }
  }, [step, invoiceData.additionalServices, invoiceData.adjustments, invoiceData.actualCargoDetails]);
  const handleContinue = () => {
    if (step < 4) {
      setStep(step + 1);
      if (step === 2) {
        calculateTotals();
      }
    }
  };
  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };
  const handleSubmitInvoice = async () => {
    setLoading(true);
    try {
      // Simulate API call to create invoice
      await new Promise(resolve => setTimeout(resolve, 1500));
      addToast('Invoice created successfully!', 'success');
      navigate('/staff/invoices/pending');
    } catch (error) {
      addToast('Failed to create invoice. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };
  return <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1E2A45]">Create Invoice</h1>
        <p className="text-gray-600 mt-1">
          Generate a final invoice based on actual shipment data
        </p>
      </div>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-[#1E2A45] text-white' : 'bg-gray-200 text-gray-500'}`}>
              1
            </div>
            <div className={`h-1 w-16 ${step >= 2 ? 'bg-[#1E2A45]' : 'bg-gray-200'}`}></div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-[#1E2A45] text-white' : 'bg-gray-200 text-gray-500'}`}>
              2
            </div>
            <div className={`h-1 w-16 ${step >= 3 ? 'bg-[#1E2A45]' : 'bg-gray-200'}`}></div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-[#1E2A45] text-white' : 'bg-gray-200 text-gray-500'}`}>
              3
            </div>
            <div className={`h-1 w-16 ${step >= 4 ? 'bg-[#1E2A45]' : 'bg-gray-200'}`}></div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 4 ? 'bg-[#1E2A45] text-white' : 'bg-gray-200 text-gray-500'}`}>
              4
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {step === 1 && 'Select Shipment'}
            {step === 2 && 'Enter Actual Cargo Data'}
            {step === 3 && 'Additional Charges'}
            {step === 4 && 'Review & Finalize'}
          </div>
        </div>
      </div>
      <Card>
        {step === 1 && <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Select Shipment
            </h2>
            <div className="mb-6">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input type="text" placeholder="Search by shipment ID or customer name..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E2A45] focus:border-[#1E2A45]" />
              </div>
            </div>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {filteredShipments.map(shipment => <div key={shipment.id} className="border border-gray-200 rounded-lg p-4 hover:border-[#1E2A45] cursor-pointer transition-colors" onClick={() => handleSelectShipment(shipment)}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {shipment.id}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {shipment.customer.company || 'Unknown Company'} ({shipment.customer.name || 'Unknown Customer'})
                      </p>
                      <p className="text-sm text-gray-500">
                        Quote: {shipment.quoteId}
                      </p>
                    </div>
                    <Badge variant={shipment.status === 'In Transit' ? 'info' : 'warning'}>
                      {shipment.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <div>
                      <span className="text-gray-600">Estimated Total:</span>{' '}
                      <span className="font-medium">
                        ${shipment.estimatedTotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center text-[#1E2A45]">
                      <span className="mr-1">Select</span>
                      <ArrowRightIcon className="h-4 w-4" />
                    </div>
                  </div>
                </div>)}
              {filteredShipments.length === 0 && <div className="text-center py-8">
                  <TruckIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-gray-500 mb-1">No shipments found</h3>
                  <p className="text-sm text-gray-400">
                    Try a different search term
                  </p>
                </div>}
            </div>
          </div>}
        {step === 2 && selectedShipment && <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Actual Cargo Data
            </h2>
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <InfoIcon className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-blue-800">
                    Shipment Information
                  </h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Enter the actual cargo data measured after pickup. This will
                    be used to calculate any adjustments to the final invoice
                    amount.
                  </p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Original Quote Details
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div>
                    <span className="text-xs text-gray-500 block">
                      Shipment ID
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {selectedShipment.id}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">
                      Quote ID
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {selectedShipment.quoteId}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">
                      Estimated Carton Count
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {selectedShipment?.cargoDetails?.estimatedCartonCount || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">
                      Estimated Weight
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {selectedShipment?.cargoDetails?.estimatedWeight || 0} kg
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">
                      Estimated Total
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      ${selectedShipment.estimatedTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Actual Cargo Measurements
                </h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="actual-carton-count" className="block text-sm font-medium text-gray-700 mb-1">
                      Actual Carton Count
                    </label>
                    <input type="number" id="actual-carton-count" value={invoiceData.actualCargoDetails.cartonCount} onChange={e => setInvoiceData({
                  ...invoiceData,
                  actualCargoDetails: {
                    ...invoiceData.actualCargoDetails,
                    cartonCount: parseInt(e.target.value) || 0
                  }
                })} className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-[#1E2A45] focus:border-[#1E2A45]" />
                  </div>
                  <div>
                    <label htmlFor="actual-weight" className="block text-sm font-medium text-gray-700 mb-1">
                      Actual Weight (kg)
                    </label>
                    <input type="number" id="actual-weight" step="0.1" value={invoiceData.actualCargoDetails.weight} onChange={e => setInvoiceData({
                  ...invoiceData,
                  actualCargoDetails: {
                    ...invoiceData.actualCargoDetails,
                    weight: parseFloat(e.target.value) || 0
                  }
                })} className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-[#1E2A45] focus:border-[#1E2A45]" />
                  </div>
                  <div>
                    <div className="flex items-center mb-2">
                      <input type="checkbox" id="dimension-changes" checked={invoiceData.actualCargoDetails.dimensions.changed} onChange={e => setInvoiceData({
                    ...invoiceData,
                    actualCargoDetails: {
                      ...invoiceData.actualCargoDetails,
                      dimensions: {
                        ...invoiceData.actualCargoDetails.dimensions,
                        changed: e.target.checked
                      }
                    }
                  })} className="h-4 w-4 text-[#1E2A45] focus:ring-[#1E2A45] border-gray-300 rounded" />
                      <label htmlFor="dimension-changes" className="ml-2 block text-sm font-medium text-gray-700">
                        Dimension changes from original quote
                      </label>
                    </div>
                    {invoiceData.actualCargoDetails.dimensions.changed && <textarea placeholder="Describe the dimension changes..." value={invoiceData.actualCargoDetails.dimensions.notes} onChange={e => setInvoiceData({
                  ...invoiceData,
                  actualCargoDetails: {
                    ...invoiceData.actualCargoDetails,
                    dimensions: {
                      ...invoiceData.actualCargoDetails.dimensions,
                      notes: e.target.value
                    }
                  }
                })} className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-[#1E2A45] focus:border-[#1E2A45]" rows={3} />}
                  </div>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-200 pt-6 mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Destination Details
              </h3>
              <div className="space-y-4">
                {selectedShipment.destinations.map(dest => <div key={dest.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <span className="text-xs text-gray-500 block">
                          FBA Warehouse
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {dest.fbaWarehouse}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 block">
                          Amazon Shipment ID
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {dest.amazonShipmentId}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs text-gray-500 block">
                          Estimated Cartons
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {dest.cartons}
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
                    {dest.actualWeight && <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">
                            Actual Weight
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {dest.actualWeight} kg
                          </span>
                        </div>
                      </div>}
                  </div>)}
              </div>
            </div>
          </div>}
        {step === 3 && <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Additional Charges & Adjustments
            </h2>
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Cargo Adjustments
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <span className="text-xs text-gray-500 block">
                      Original Carton Count
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {selectedShipment?.cargoDetails.estimatedCartonCount}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">
                      Actual Carton Count
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {invoiceData.actualCargoDetails.cartonCount}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <span className="text-xs text-gray-500 block">
                      Original Weight
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {selectedShipment?.cargoDetails.estimatedWeight} kg
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">
                      Actual Weight
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {invoiceData.actualCargoDetails.weight} kg
                    </span>
                  </div>
                </div>
                {/* Weight difference */}
                {invoiceData.actualCargoDetails.weight > (selectedShipment?.cargoDetails.estimatedWeight || 0) && <div className="flex justify-between items-center py-2 border-t border-gray-200">
                    <span className="text-sm text-gray-700">
                      Weight difference (
                      {(invoiceData.actualCargoDetails.weight - (selectedShipment?.cargoDetails.estimatedWeight || 0)).toFixed(1)}{' '}
                      kg @ $12.50/kg)
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      $
                      {((invoiceData.actualCargoDetails.weight - (selectedShipment?.cargoDetails.estimatedWeight || 0)) * 12.5).toFixed(2)}
                    </span>
                  </div>}
                {/* Carton difference */}
                {invoiceData.actualCargoDetails.cartonCount > (selectedShipment?.cargoDetails.estimatedCartonCount || 0) && <div className="flex justify-between items-center py-2 border-t border-gray-200">
                    <span className="text-sm text-gray-700">
                      Additional cartons (
                      {invoiceData.actualCargoDetails.cartonCount - (selectedShipment?.cargoDetails.estimatedCartonCount || 0)}{' '}
                      @ $15.00/carton)
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      $
                      {((invoiceData.actualCargoDetails.cartonCount - (selectedShipment?.cargoDetails.estimatedCartonCount || 0)) * 15).toFixed(2)}
                    </span>
                  </div>}
                {/* Dimension changes */}
                {invoiceData.actualCargoDetails.dimensions.changed && <div className="flex justify-between items-center py-2 border-t border-gray-200">
                    <span className="text-sm text-gray-700">
                      Dimension change fee (flat rate)
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      $75.00
                    </span>
                  </div>}
              </div>
            </div>
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-medium text-gray-700">
                  Additional Services
                </h3>
                <button type="button" onClick={handleAddAdditionalService} className="text-sm text-[#1E2A45] hover:text-[#0f1523] flex items-center">
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add Service
                </button>
              </div>
              {invoiceData.additionalServices.length === 0 ? <div className="text-center py-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">
                    No additional services added
                  </p>
                </div> : <div className="space-y-3">
                  {invoiceData.additionalServices.map(service => <div key={service.id} className="flex items-start space-x-3 bg-gray-50 p-3 rounded-lg">
                      <div className="flex-grow">
                        <input type="text" placeholder="Service description" value={service.description} onChange={e => handleUpdateAdditionalService(service.id, 'description', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-[#1E2A45] focus:border-[#1E2A45] mb-2" />
                        <div className="flex items-center">
                          <span className="text-gray-500 mr-2">$</span>
                          <input type="number" placeholder="Amount" value={service.amount} onChange={e => handleUpdateAdditionalService(service.id, 'amount', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-[#1E2A45] focus:border-[#1E2A45]" />
                        </div>
                      </div>
                      <button type="button" onClick={() => handleRemoveAdditionalService(service.id)} className="text-red-500 hover:text-red-700">
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>)}
                </div>}
            </div>
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-medium text-gray-700">
                  Adjustments
                </h3>
                <button type="button" onClick={handleAddAdjustment} className="text-sm text-[#1E2A45] hover:text-[#0f1523] flex items-center">
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add Adjustment
                </button>
              </div>
              {invoiceData.adjustments.length === 0 ? <div className="text-center py-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">No adjustments added</p>
                </div> : <div className="space-y-3">
                  {invoiceData.adjustments.map(adjustment => <div key={adjustment.id} className="flex items-start space-x-3 bg-gray-50 p-3 rounded-lg">
                      <div className="flex-grow">
                        <input type="text" placeholder="Adjustment description" value={adjustment.description} onChange={e => handleUpdateAdjustment(adjustment.id, 'description', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-[#1E2A45] focus:border-[#1E2A45] mb-2" />
                        <div className="flex items-center">
                          <span className="text-gray-500 mr-2">$</span>
                          <input type="number" placeholder="Amount (use negative for discounts)" value={adjustment.amount} onChange={e => handleUpdateAdjustment(adjustment.id, 'amount', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-[#1E2A45] focus:border-[#1E2A45]" />
                        </div>
                      </div>
                      <button type="button" onClick={() => handleRemoveAdjustment(adjustment.id)} className="text-red-500 hover:text-red-700">
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>)}
                </div>}
            </div>
            <div className="border-t border-gray-200 pt-6">
              <button type="button" onClick={calculateTotals} className="flex items-center text-[#1E2A45] hover:text-[#0f1523] mb-3">
                <CalculatorIcon className="h-4 w-4 mr-1" />
                Recalculate Totals
              </button>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">
                      Original Quote Amount
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      ${invoiceData.originalQuoteAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">
                      Cargo Adjustments
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      $
                      {((invoiceData.actualCargoDetails.weight - (selectedShipment?.cargoDetails.estimatedWeight || 0) > 0 ? (invoiceData.actualCargoDetails.weight - (selectedShipment?.cargoDetails.estimatedWeight || 0)) * 12.5 : 0) + (invoiceData.actualCargoDetails.cartonCount - (selectedShipment?.cargoDetails.estimatedCartonCount || 0) > 0 ? (invoiceData.actualCargoDetails.cartonCount - (selectedShipment?.cargoDetails.estimatedCartonCount || 0)) * 15 : 0) + (invoiceData.actualCargoDetails.dimensions.changed ? 75 : 0)).toFixed(2)}
                    </span>
                  </div>
                  {invoiceData.additionalServices.length > 0 && <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">
                        Additional Services
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        $
                        {invoiceData.additionalServices.reduce((sum, s) => sum + s.amount, 0).toFixed(2)}
                      </span>
                    </div>}
                  {invoiceData.adjustments.length > 0 && <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">
                        Other Adjustments
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        $
                        {invoiceData.adjustments.reduce((sum, a) => sum + a.amount, 0).toFixed(2)}
                      </span>
                    </div>}
                  <div className="border-t border-gray-200 pt-2 flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">
                      Subtotal
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      ${invoiceData.subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 flex justify-between items-center">
                    <span className="text-base font-medium text-gray-900">
                      Total Due
                    </span>
                    <span className="text-base font-bold text-[#1E2A45]">
                      ${invoiceData.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>}
        {step === 4 && <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Review & Finalize Invoice
            </h2>
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <InfoIcon className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-blue-800">
                    Ready to Create Invoice
                  </h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Review all details before finalizing. Once created, the
                    invoice will be available for sending to the customer.
                  </p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Invoice Details
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Shipment ID</span>
                    <span className="text-sm font-medium text-gray-900">
                      {invoiceData.shipmentId}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Quote ID</span>
                    <span className="text-sm font-medium text-gray-900">
                      {invoiceData.quoteId}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">
                      Original Quote Amount
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      ${invoiceData.originalQuoteAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">
                      Final Invoice Amount
                    </span>
                    <span className="text-sm font-medium text-[#1E2A45]">
                      ${invoiceData.total.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Difference</span>
                    <span className={`text-sm font-medium ${invoiceData.total > invoiceData.originalQuoteAmount ? 'text-red-600' : 'text-green-600'}`}>
                      $
                      {(invoiceData.total - invoiceData.originalQuoteAmount).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Customer Information
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div>
                    <span className="text-xs text-gray-500 block">
                      Customer Name
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {invoiceData.customer.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">Company</span>
                    <span className="text-sm font-medium text-gray-900">
                      {invoiceData.customer.company || 'Unknown Company'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">Email</span>
                    <span className="text-sm font-medium text-gray-900">
                      {invoiceData.customer.email}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Invoice Summary
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">
                      Original Quote Amount
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      ${invoiceData.originalQuoteAmount.toFixed(2)}
                    </span>
                  </div>
                  {/* Weight adjustment */}
                  {invoiceData.actualCargoDetails.weight > (selectedShipment?.cargoDetails.estimatedWeight || 0) && <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">
                        Weight Adjustment (
                        {(invoiceData.actualCargoDetails.weight - (selectedShipment?.cargoDetails.estimatedWeight || 0)).toFixed(1)}{' '}
                        kg)
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        $
                        {((invoiceData.actualCargoDetails.weight - (selectedShipment?.cargoDetails.estimatedWeight || 0)) * 12.5).toFixed(2)}
                      </span>
                    </div>}
                  {/* Carton adjustment */}
                  {invoiceData.actualCargoDetails.cartonCount > (selectedShipment?.cargoDetails.estimatedCartonCount || 0) && <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">
                        Carton Adjustment (
                        {invoiceData.actualCargoDetails.cartonCount - (selectedShipment?.cargoDetails.estimatedCartonCount || 0)}{' '}
                        cartons)
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        $
                        {((invoiceData.actualCargoDetails.cartonCount - (selectedShipment?.cargoDetails.estimatedCartonCount || 0)) * 15).toFixed(2)}
                      </span>
                    </div>}
                  {/* Dimension changes */}
                  {invoiceData.actualCargoDetails.dimensions.changed && <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">
                        Dimension Change Fee
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        $75.00
                      </span>
                    </div>}
                  {/* Additional services */}
                  {invoiceData.additionalServices.map(service => <div key={service.id} className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">
                        {service.description}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        ${service.amount.toFixed(2)}
                      </span>
                    </div>)}
                  {/* Adjustments */}
                  {invoiceData.adjustments.map(adjustment => <div key={adjustment.id} className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">
                        {adjustment.description}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        ${adjustment.amount.toFixed(2)}
                      </span>
                    </div>)}
                  <div className="border-t border-gray-200 pt-2 flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">
                      Subtotal
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      ${invoiceData.subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 flex justify-between items-center">
                    <span className="text-base font-medium text-gray-900">
                      Total Due
                    </span>
                    <span className="text-base font-bold text-[#1E2A45]">
                      ${invoiceData.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Due Date & Notes
              </h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="due-date" className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date
                  </label>
                  <input type="date" id="due-date" value={invoiceData.dueDate} onChange={e => setInvoiceData({
                ...invoiceData,
                dueDate: e.target.value
              })} className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-[#1E2A45] focus:border-[#1E2A45]" />
                </div>
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                    Invoice Notes (Optional)
                  </label>
                  <textarea id="notes" value={invoiceData.notes} onChange={e => setInvoiceData({
                ...invoiceData,
                notes: e.target.value
              })} placeholder="Add any additional notes to appear on the invoice..." rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-[#1E2A45] focus:border-[#1E2A45]" />
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 mb-6">
              <input type="checkbox" id="confirm-invoice" className="h-4 w-4 text-[#1E2A45] focus:ring-[#1E2A45] border-gray-300 rounded" />
              <label htmlFor="confirm-invoice" className="text-sm font-medium text-gray-700">
                I confirm that all invoice details are correct and ready to be
                finalized
              </label>
            </div>
          </div>}
        <div className="mt-8 flex justify-between">
          {step > 1 ? <Button variant="secondary" onClick={handleBack}>
              Back
            </Button> : <div></div>}
          {step < 4 ? <Button variant="primary" onClick={handleContinue}>
              Continue
            </Button> : <Button variant="primary" onClick={handleSubmitInvoice} isLoading={loading}>
              <ReceiptIcon className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>}
        </div>
      </Card>
    </div>;
};