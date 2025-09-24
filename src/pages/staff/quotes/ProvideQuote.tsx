import React, { useEffect, useState, useId } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { FileTextIcon, PlusIcon, MinusIcon, InfoIcon, ArrowLeftIcon, BuildingIcon, TruckIcon, DollarSignIcon } from 'lucide-react';
import { DataService, QuoteRequest, User } from '../../../services/DataService';
import { useToast } from '../../../context/ToastContext';
import { useData } from '../../../context/DataContextV2';
export const ProvideQuote = () => {
  const {
    requestId
  } = useParams<{
    requestId: string;
  }>();
  const navigate = useNavigate();
  const {
    addToast
  } = useToast();
  const { refreshData } = useData();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [quoteRequest, setQuoteRequest] = useState<QuoteRequest | null>(null);
  const [customer, setCustomer] = useState<User | null>(null);
  const [showOtherCharges, setShowOtherCharges] = useState(false);
  const [showDiscounts, setShowDiscounts] = useState(false);
  // Track string values for rate inputs to allow decimal typing
  const [rateInputValues, setRateInputValues] = useState<Record<string, string>>({});
  // Form state for the quote
  const [quoteForm, setQuoteForm] = useState({
    rateType: 'per-kg' as 'per-kg' | 'flat-rate',
    warehouseRates: [] as {
      warehouseId: string;
      warehouse?: string;
      ratePerKg: number;
      weight?: number;
      chargeableWeight?: number;
    }[],
    otherCharges: [] as {
      id: string;
      description: string;
      amount: number;
    }[],
    discounts: [] as {
      id: string;
      description: string;
      amount: number;
    }[],
    notes: ''
  });
  useEffect(() => {
    const fetchQuoteRequest = async () => {
      if (!requestId) return;
      try {
        const request = await DataService.getQuoteRequestById(requestId);
        if (!request) {
          addToast('Quote request not found', 'error');
          navigate('/staff/quotes/requests');
          return;
        }
        setQuoteRequest(request);
        
        // Fetch customer data if we have a customer_id
        if (request.customerId) {
          try {
            const customerData = await DataService.getUserById(request.customerId);
            setCustomer(customerData);
          } catch (error) {
            console.error('Failed to fetch customer data:', error);
          }
        }
        
        // Initialize warehouse rates based on destinations
        console.log('Request destinations:', request.destinations);
        console.log('Request cargo details:', request.cargoDetails);
        // Calculate weight per destination
        const totalWeight = request.cargoDetails?.grossWeight || 0;
        const totalCbm = request.cargoDetails?.cbm || 0;
        const destinationCount = (request.destinations || []).length || 1;
        
        const initialRates = (request.destinations || []).map(dest => {
          // Use destination weight if available, otherwise distribute total weight evenly
          const destWeight = dest.weight || dest.grossWeight || 
                           (totalWeight > 0 ? totalWeight / destinationCount : 0);
          const destCbm = dest.cbm || (totalCbm > 0 ? totalCbm / destinationCount : 0);
          const volumetricWeight = Math.round(destCbm * 167);
          
          return {
            warehouseId: dest.id,
            warehouse: dest.fbaWarehouse,
            ratePerKg: 0,
            weight: destWeight,
            chargeableWeight: Math.max(destWeight, volumetricWeight)
          };
        });
        setQuoteForm(prev => ({
          ...prev,
          warehouseRates: initialRates
        }));
      } catch (error) {
        addToast('Failed to load quote request', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuoteRequest();
  }, [requestId, navigate, addToast]);
  const handleRateChange = (warehouseId: string, value: string) => {
    // Allow empty string, numbers, and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      // Update the string value for display
      setRateInputValues(prev => ({
        ...prev,
        [warehouseId]: value
      }));
      
      // Parse to number for calculations (0 if empty or just a decimal point)
      const numericValue = value === '' || value === '.' ? 0 : parseFloat(value) || 0;
      
      setQuoteForm(prev => ({
        ...prev,
        warehouseRates: prev.warehouseRates.map(wr => wr.warehouseId === warehouseId ? {
          ...wr,
          ratePerKg: numericValue,
          // Preserve weight and chargeableWeight
          weight: wr.weight,
          chargeableWeight: wr.chargeableWeight,
          warehouse: wr.warehouse
        } : wr)
      }));
    }
  };
  const handleAddCharge = () => {
    const newCharge = {
      id: `charge-${Date.now()}`,
      description: '',
      amount: 0
    };
    setQuoteForm(prev => ({
      ...prev,
      otherCharges: [...prev.otherCharges, newCharge]
    }));
  };
  const handleRemoveCharge = (id: string) => {
    setQuoteForm(prev => {
      const newCharges = prev.otherCharges.filter(charge => charge.id !== id);
      if (newCharges.length === 0) {
        setShowOtherCharges(false);
      }
      return {
        ...prev,
        otherCharges: newCharges
      };
    });
  };
  const handleChargeChange = (id: string, field: string, value: any) => {
    if (field === 'amount' && typeof value === 'string') {
      // Allow empty string, numbers, and decimal point
      if (value === '' || /^\d*\.?\d*$/.test(value)) {
        const numericValue = value === '' ? 0 : parseFloat(value) || 0;
        setQuoteForm(prev => ({
          ...prev,
          otherCharges: prev.otherCharges.map(charge => charge.id === id ? {
            ...charge,
            [field]: numericValue
          } : charge)
        }));
      }
    } else {
      setQuoteForm(prev => ({
        ...prev,
        otherCharges: prev.otherCharges.map(charge => charge.id === id ? {
          ...charge,
          [field]: value
        } : charge)
      }));
    }
  };
  const handleAddDiscount = () => {
    const newDiscount = {
      id: `discount-${Date.now()}`,
      description: '',
      amount: 0
    };
    setQuoteForm(prev => ({
      ...prev,
      discounts: [...prev.discounts, newDiscount]
    }));
  };
  const handleRemoveDiscount = (id: string) => {
    setQuoteForm(prev => {
      const newDiscounts = prev.discounts.filter(discount => discount.id !== id);
      if (newDiscounts.length === 0) {
        setShowDiscounts(false);
      }
      return {
        ...prev,
        discounts: newDiscounts
      };
    });
  };
  const handleDiscountChange = (id: string, field: string, value: any) => {
    if (field === 'amount' && typeof value === 'string') {
      // Allow empty string, numbers, and decimal point
      if (value === '' || /^\d*\.?\d*$/.test(value)) {
        const numericValue = value === '' ? 0 : parseFloat(value) || 0;
        setQuoteForm(prev => ({
          ...prev,
          discounts: prev.discounts.map(discount => discount.id === id ? {
            ...discount,
            [field]: numericValue
          } : discount)
        }));
      }
    } else {
      setQuoteForm(prev => ({
        ...prev,
        discounts: prev.discounts.map(discount => discount.id === id ? {
          ...discount,
          [field]: value
        } : discount)
      }));
    }
  };
  const calculateSubtotal = () => {
    if (!quoteRequest) return 0;
    // Calculate rates for each warehouse
    const warehouseTotals = quoteForm.warehouseRates.reduce((sum, wr) => {
      const destination = quoteRequest.destinations.find(d => d.id === wr.warehouseId);
      if (!destination) return sum;
      return sum + destination.weight * wr.ratePerKg;
    }, 0);
    // Add other charges
    const otherChargesTotal = quoteForm.otherCharges.reduce((sum, charge) => sum + charge.amount, 0);
    return warehouseTotals + otherChargesTotal;
  };
  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discountsTotal = quoteForm.discounts.reduce((sum, discount) => sum + discount.amount, 0);
    return subtotal - discountsTotal;
  };
  const handleSubmitQuote = async () => {
    if (!quoteRequest || !requestId) return;
    // Validate the form
    const hasValidRates = quoteForm.warehouseRates.every(wr => wr.ratePerKg > 0);
    if (!hasValidRates) {
      addToast('Please provide valid rates for all destinations', 'error');
      return;
    }
    setIsSaving(true);
    try {
      // Get the current commission rate to lock it into the quote
      const commissionRate = await DataService.getCommissionRate();
      
      // Calculate totals
      const subtotal = calculateSubtotal();
      const total = calculateTotal();
      
      console.log('Creating quote for request:', requestId);
      console.log('Quote request customerId:', quoteRequest.customerId);
      console.log('Locking in commission rate:', commissionRate);
      
      // Create the quote
      const quote = {
        requestId,
        customerId: quoteRequest.customerId,
        staffId: user?.id || '2',  // Use current user ID or default to staff user ID 2
        status: 'Pending' as 'Pending' | 'Accepted' | 'Rejected' | 'Expired' | 'Shipped',
        rateType: quoteForm.rateType,
        warehouseRates: quoteForm.warehouseRates,
        otherCharges: quoteForm.otherCharges,
        discounts: quoteForm.discounts,
        subtotal,
        total,
        notes: quoteForm.notes,
        commissionRatePerKg: commissionRate, // Lock in the current commission rate
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
      };
      
      console.log('Quote object being created:', quote);
      console.log('Warehouse rates with weights:', quote.warehouseRates);
      await DataService.createQuote(quote);
      // Update the quote request status
      await DataService.updateQuoteRequest(requestId, {
        status: 'Quote Provided'
      });
      
      // Refresh the global data context so pending quotes list updates
      await refreshData();
      
      addToast('Quote submitted successfully!', 'success');
      navigate('/staff/quotes/pending');
    } catch (error) {
      console.error('Failed to create quote:', error);
      addToast('Failed to submit quote. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };
  if (isLoading) {
    return <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>;
  }
  if (!quoteRequest) {
    return <div className="text-center py-8">
        <h3 className="text-lg font-medium text-gray-900">
          Quote request not found
        </h3>
        <Button variant="tertiary" className="mt-4" onClick={() => navigate('/staff/quotes/requests')}>
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Back to Quote Requests
        </Button>
      </div>;
  }
  return <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center">
          <Button variant="tertiary" className="mr-4" onClick={() => navigate('/staff/quotes/requests')}>
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Provide Quote for {quoteRequest.id}
            </h1>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Request Details
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Customer</h3>
                <p className="text-gray-900">{customer?.company || 'Unknown Company'}</p>
                <p className="text-sm text-gray-600">
                  {customer?.name || 'Unknown Customer'}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Supplier</h3>
                <p className="text-gray-900">
                  {quoteRequest.supplierDetails?.name || 'Unknown Supplier'}
                </p>
                <p className="text-sm text-gray-600">
                  {quoteRequest.supplierDetails?.address || 'No address'}
                </p>
                <p className="text-sm text-gray-600">
                  {quoteRequest.supplierDetails?.city || 'Unknown'},{' '}
                  {quoteRequest.supplierDetails?.country || 'Unknown'}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Product & Cargo Details
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Total Cartons
                  </h3>
                  <p className="text-gray-900 font-medium">
                    {quoteRequest.cargoDetails?.cartonCount || 0}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Gross Weight
                  </h3>
                  <p className="text-gray-900 font-medium">
                    {(quoteRequest.cargoDetails?.grossWeight || 0).toFixed(2)} kg
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Volume (CBM)
                  </h3>
                  <p className="text-gray-900 font-medium">
                    {quoteRequest.cargoDetails?.cbm || 0}
                  </p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Product Description
                </h3>
                <p className="text-gray-900">
                  {(quoteRequest.cargoDetails as any)?.productDescription || 'Not provided'}
                </p>
              </div>
              {(quoteRequest.cargoDetails as any)?.competitorASIN && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Competitor ASIN
                  </h3>
                  <a 
                    href={`https://amazon.com/dp/${(quoteRequest.cargoDetails as any)?.competitorASIN}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    {(quoteRequest.cargoDetails as any)?.competitorASIN}
                  </a>
                </div>
              )}
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Regulated Goods
                </h3>
                <p className="text-gray-900">
                  {(quoteRequest.cargoDetails as any)?.regulatedGoods === 'fda' ? 'FDA Certified Product' :
                   (quoteRequest.cargoDetails as any)?.regulatedGoods === 'wood-bamboo-animal' ? 'Wooden / Bamboo / Animal Product' :
                   (quoteRequest.cargoDetails as any)?.regulatedGoods === 'batteries-hazmat' ? 'Batteries or Hazardous Materials' :
                   (quoteRequest.cargoDetails as any)?.regulatedGoods === 'cream-liquids-powders' ? 'Cream / Liquids / Powders' :
                   (quoteRequest.cargoDetails as any)?.regulatedGoods === 'none' ? 'No regulated goods' : 'Not specified'}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Special Notes
                </h3>
                <p className="text-sm text-gray-600">
                  {quoteRequest.specialRequirements || quoteRequest.cargoDetails?.notes || 'None provided'}
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h2 className="text-lg font-medium text-gray-900 mb-6">
              Quote Details
            </h2>
            <div className="mb-6">
              <h3 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                <BuildingIcon className="h-4 w-4 mr-1 text-gray-500" />
                Destination Rates
              </h3>
              <div className="space-y-4">
                {(quoteRequest.destinations || []).map(dest => {
                const warehouseRate = quoteForm.warehouseRates.find(wr => wr.warehouseId === dest.id);
                return <div key={dest.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {dest.fbaWarehouse}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {dest.weight.toFixed(2)} kg • {dest.cartons} cartons
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Rate per Kg ($)
                          </label>
                          <div className="relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-gray-500 sm:text-sm">$</span>
                            </div>
                            <input 
                              type="text" 
                              value={rateInputValues[dest.id] ?? (warehouseRate?.ratePerKg || '')} 
                              onChange={e => handleRateChange(dest.id, e.target.value)} 
                              placeholder="0.00"
                              className="block w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" 
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Subtotal
                          </label>
                          <div className="py-2 px-3 bg-gray-100 rounded-md text-gray-900 font-medium">
                            $
                            {((warehouseRate?.ratePerKg || 0) * dest.weight).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>;
              })}
              </div>
            </div>

            <div className="flex space-x-3 mb-6">
              {!showOtherCharges && (
                <Button 
                  variant="tertiary" 
                  size="sm" 
                  onClick={() => {
                    setShowOtherCharges(true);
                    handleAddCharge();
                  }}
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Additional Charge
                </Button>
              )}
              {!showDiscounts && (
                <Button 
                  variant="tertiary" 
                  size="sm" 
                  onClick={() => {
                    setShowDiscounts(true);
                    handleAddDiscount();
                  }}
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Discount
                </Button>
              )}
            </div>

            {showOtherCharges && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-md font-medium text-gray-900 flex items-center">
                    <DollarSignIcon className="h-4 w-4 mr-1 text-gray-500" />
                    Other Charges
                  </h3>
                  <Button variant="tertiary" size="sm" onClick={handleAddCharge}>
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add Charge
                  </Button>
                </div>
                <div className="space-y-3">
                  {quoteForm.otherCharges.map(charge => <div key={charge.id} className="flex items-center space-x-3">
                      <div className="flex-grow">
                        <input type="text" value={charge.description} onChange={e => handleChargeChange(charge.id, 'description', e.target.value)} placeholder="Description" className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                      </div>
                      <div className="w-32">
                        <div className="relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">$</span>
                          </div>
                          <input 
                            type="text" 
                            value={charge.amount || ''} 
                            onChange={e => handleChargeChange(charge.id, 'amount', e.target.value)} 
                            placeholder="0.00"
                            className="block w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" 
                          />
                        </div>
                      </div>
                      <button type="button" onClick={() => handleRemoveCharge(charge.id)} className="text-red-600 hover:text-red-800">
                        <MinusIcon className="h-5 w-5" />
                      </button>
                    </div>)}
                </div>
              </div>
            )}

            {showDiscounts && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-md font-medium text-gray-900 flex items-center">
                    <DollarSignIcon className="h-4 w-4 mr-1 text-gray-500" />
                    Discounts
                  </h3>
                  <Button variant="tertiary" size="sm" onClick={handleAddDiscount}>
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add Discount
                  </Button>
                </div>
                <div className="space-y-3">
                  {quoteForm.discounts.map(discount => <div key={discount.id} className="flex items-center space-x-3">
                      <div className="flex-grow">
                        <input type="text" value={discount.description} onChange={e => handleDiscountChange(discount.id, 'description', e.target.value)} placeholder="Description" className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                      </div>
                      <div className="w-32">
                        <div className="relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">$</span>
                          </div>
                          <input 
                            type="text" 
                            value={discount.amount || ''} 
                            onChange={e => handleDiscountChange(discount.id, 'amount', e.target.value)} 
                            placeholder="0.00"
                            className="block w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" 
                          />
                        </div>
                      </div>
                      <button type="button" onClick={() => handleRemoveDiscount(discount.id)} className="text-red-600 hover:text-red-800">
                        <MinusIcon className="h-5 w-5" />
                      </button>
                    </div>)}
                </div>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes for Customer
              </label>
              <textarea value={quoteForm.notes} onChange={e => setQuoteForm(prev => ({
              ...prev,
              notes: e.target.value
            }))} rows={3} className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="Add any notes or terms for the customer" />
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700">Subtotal:</span>
                <span className="text-gray-900 font-medium">
                  ${calculateSubtotal().toFixed(2)}
                </span>
              </div>
              {quoteForm.discounts.length > 0 && <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700">Discounts:</span>
                  <span className="text-green-600 font-medium">
                    -$
                    {quoteForm.discounts.reduce((sum, d) => sum + d.amount, 0).toFixed(2)}
                  </span>
                </div>}
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="text-gray-900 font-medium">Total:</span>
                <span className="text-blue-600 font-bold text-lg">
                  ${calculateTotal().toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex justify-end">
              <Button variant="tertiary" className="mr-3" onClick={() => navigate('/staff/quotes/requests')}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSubmitQuote} isLoading={isSaving}>
                <TruckIcon className="mr-2 h-4 w-4" />
                Submit Quote
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>;
};