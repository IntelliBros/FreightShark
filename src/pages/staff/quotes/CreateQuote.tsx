import React, { useState, useId } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { FileTextIcon, PlusIcon, MinusIcon, ArrowRightIcon, TruckIcon, InfoIcon, AlertCircleIcon } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
export const CreateQuote = () => {
  const navigate = useNavigate();
  const {
    addToast
  } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  // Form state
  const [formData, setFormData] = useState({
    customer: '',
    supplier: '',
    supplierAddress: '',
    pickupDate: '',
    pickupTimeWindow: '',
    serviceMode: 'air-express',
    cartonCount: '',
    grossWeight: '',
    cbm: '',
    destinations: [{
      warehouseId: '',
      shipmentId: '',
      cartonCount: '',
      grossWeight: ''
    }]
  });
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const {
      name,
      value
    } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  const handleDestinationChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const {
      name,
      value
    } = e.target;
    const updatedDestinations = [...formData.destinations];
    updatedDestinations[index] = {
      ...updatedDestinations[index],
      [name]: value
    };
    setFormData({
      ...formData,
      destinations: updatedDestinations
    });
  };
  const addDestination = () => {
    setFormData({
      ...formData,
      destinations: [...formData.destinations, {
        warehouseId: '',
        shipmentId: '',
        cartonCount: '',
        grossWeight: ''
      }]
    });
  };
  const removeDestination = (index: number) => {
    if (formData.destinations.length === 1) return;
    const updatedDestinations = formData.destinations.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      destinations: updatedDestinations
    });
  };
  const handleNextStep = () => {
    setCurrentStep(currentStep + 1);
    window.scrollTo(0, 0);
  };
  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
    window.scrollTo(0, 0);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      // Success
      addToast('Quote created successfully!', 'success');
      navigate('/staff/quotes/pending');
    } catch (error) {
      addToast('Failed to create quote. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  return <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create New Quote</h1>
        <p className="text-gray-600 mt-1">
          Generate a new shipping quote for a customer
        </p>
      </div>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
              1
            </div>
            <div className={`ml-2 text-sm font-medium ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-500'}`}>
              Customer & Supplier
            </div>
          </div>
          <div className={`flex-grow mx-4 h-0.5 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
          <div className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
              2
            </div>
            <div className={`ml-2 text-sm font-medium ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-500'}`}>
              Cargo Details
            </div>
          </div>
          <div className={`flex-grow mx-4 h-0.5 ${currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
          <div className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
              3
            </div>
            <div className={`ml-2 text-sm font-medium ${currentStep >= 3 ? 'text-blue-600' : 'text-gray-500'}`}>
              Review & Create
            </div>
          </div>
        </div>
      </div>
      <form onSubmit={handleSubmit}>
        {currentStep === 1 && <Card>
            <h2 className="text-lg font-medium text-gray-900 mb-6">
              Customer & Supplier Information
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer
                </label>
                <select name="customer" value={formData.customer} onChange={handleChange} required className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                  <option value="">Select a customer</option>
                  <option value="acme-imports">Acme Imports</option>
                  <option value="global-traders">Global Traders Inc</option>
                  <option value="prime-sellers">Prime Sellers LLC</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier Name
                </label>
                <input type="text" name="supplier" value={formData.supplier} onChange={handleChange} required placeholder="e.g., Guangzhou Electronics Co." className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier Address
                </label>
                <textarea name="supplierAddress" value={formData.supplierAddress} onChange={handleChange} required rows={3} placeholder="Full address including city, province, and country" className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pickup Date
                  </label>
                  <input type="date" name="pickupDate" value={formData.pickupDate} onChange={handleChange} required min={new Date().toISOString().split('T')[0]} className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pickup Time Window
                  </label>
                  <select name="pickupTimeWindow" value={formData.pickupTimeWindow} onChange={handleChange} required className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                    <option value="">Select time window</option>
                    <option value="09:00-12:00">09:00 - 12:00</option>
                    <option value="12:00-15:00">12:00 - 15:00</option>
                    <option value="15:00-18:00">15:00 - 18:00</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shipping Service
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={`border rounded-lg p-4 cursor-pointer ${formData.serviceMode === 'air-express' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`} onClick={() => setFormData({
                ...formData,
                serviceMode: 'air-express'
              })}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium text-gray-900">
                        Air Express
                      </div>
                      <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center">
                        {formData.serviceMode === 'air-express' && <div className="w-3 h-3 bg-blue-500 rounded-full"></div>}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      5-7 days transit time
                    </p>
                  </div>
                  <div className={`border rounded-lg p-4 cursor-pointer ${formData.serviceMode === 'air-freight' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`} onClick={() => setFormData({
                ...formData,
                serviceMode: 'air-freight'
              })}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium text-gray-900">
                        Air Freight
                      </div>
                      <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center">
                        {formData.serviceMode === 'air-freight' && <div className="w-3 h-3 bg-blue-500 rounded-full"></div>}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      8-12 days transit time
                    </p>
                  </div>
                  <div className={`border rounded-lg p-4 cursor-pointer ${formData.serviceMode === 'sea-freight' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`} onClick={() => setFormData({
                ...formData,
                serviceMode: 'sea-freight'
              })}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium text-gray-900">
                        Sea Freight
                      </div>
                      <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center">
                        {formData.serviceMode === 'sea-freight' && <div className="w-3 h-3 bg-blue-500 rounded-full"></div>}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      30-35 days transit time
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-8 flex justify-end">
              <Button variant="primary" type="button" onClick={handleNextStep}>
                Continue to Cargo Details
                <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Card>}
        {currentStep === 2 && <Card>
            <h2 className="text-lg font-medium text-gray-900 mb-6">
              Cargo Details
            </h2>
            <div className="space-y-6">
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                <div className="flex items-start">
                  <InfoIcon className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-800">
                    Please provide accurate cargo details to ensure precise
                    quote calculation. For multiple destination warehouses, add
                    each destination separately.
                  </p>
                </div>
              </div>
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-3">
                  Master Cargo Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Carton Count
                    </label>
                    <input type="number" name="cartonCount" value={formData.cartonCount} onChange={handleChange} required min="1" placeholder="e.g., 30" className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gross Weight (kg)
                    </label>
                    <input type="number" name="grossWeight" value={formData.grossWeight} onChange={handleChange} required min="0.1" step="0.1" placeholder="e.g., 450" className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Volume (CBM)
                    </label>
                    <input type="number" name="cbm" value={formData.cbm} onChange={handleChange} required min="0.01" step="0.01" placeholder="e.g., 2.5" className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                  </div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-md font-medium text-gray-900">
                    Destination Warehouses
                  </h3>
                  <Button variant="secondary" size="sm" type="button" onClick={addDestination}>
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add Destination
                  </Button>
                </div>
                {formData.destinations.map((destination, index) => <div key={index} className="p-4 border border-gray-200 rounded-lg mb-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium text-gray-900">
                        Destination {index + 1}
                      </h4>
                      {formData.destinations.length > 1 && <button type="button" onClick={() => removeDestination(index)} className="text-red-600 hover:text-red-800 text-sm flex items-center">
                          <MinusIcon className="h-4 w-4 mr-1" />
                          Remove
                        </button>}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Amazon FBA Warehouse
                        </label>
                        <select name="warehouseId" value={destination.warehouseId} onChange={e => handleDestinationChange(index, e)} required className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                          <option value="">Select warehouse</option>
                          <option value="FBA ONT8">
                            FBA ONT8 - Ontario, CA
                          </option>
                          <option value="FBA BFI4">
                            FBA BFI4 - Sumner, WA
                          </option>
                          <option value="FBA MDW2">
                            FBA MDW2 - Joliet, IL
                          </option>
                          <option value="FBA ATL6">
                            FBA ATL6 - Atlanta, GA
                          </option>
                          <option value="FBA DFW7">
                            FBA DFW7 - Fort Worth, TX
                          </option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Amazon Shipment ID
                        </label>
                        <input type="text" name="shipmentId" value={destination.shipmentId} onChange={e => handleDestinationChange(index, e)} required placeholder="e.g., FBA15ABCDE" className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Carton Count
                        </label>
                        <input type="number" name="cartonCount" value={destination.cartonCount} onChange={e => handleDestinationChange(index, e)} required min="1" placeholder="e.g., 20" className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Gross Weight (kg)
                        </label>
                        <input type="number" name="grossWeight" value={destination.grossWeight} onChange={e => handleDestinationChange(index, e)} required min="0.1" step="0.1" placeholder="e.g., 300" className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                      </div>
                    </div>
                  </div>)}
              </div>
            </div>
            <div className="mt-8 flex justify-between">
              <Button variant="tertiary" type="button" onClick={handlePrevStep}>
                Back to Customer & Supplier
              </Button>
              <Button variant="primary" type="button" onClick={handleNextStep}>
                Continue to Review
                <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Card>}
        {currentStep === 3 && <Card>
            <h2 className="text-lg font-medium text-gray-900 mb-6">
              Review Quote Details
            </h2>
            <div className="space-y-6">
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700">
                    Quote Summary
                  </h3>
                </div>
                <div className="px-4 py-3 border-b border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-xs font-medium text-gray-500 mb-1">
                        Customer
                      </h4>
                      <p className="text-sm text-gray-900">
                        {formData.customer === 'acme-imports' ? 'Acme Imports' : formData.customer === 'global-traders' ? 'Global Traders Inc' : formData.customer === 'prime-sellers' ? 'Prime Sellers LLC' : ''}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-gray-500 mb-1">
                        Service Mode
                      </h4>
                      <p className="text-sm text-gray-900 flex items-center">
                        <Badge variant="info" className="mr-1">
                          {formData.serviceMode === 'air-express' ? 'Air Express' : formData.serviceMode === 'air-freight' ? 'Air Freight' : 'Sea Freight'}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {formData.serviceMode === 'air-express' ? '5-7 days' : formData.serviceMode === 'air-freight' ? '8-12 days' : '30-35 days'}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
                <div className="px-4 py-3 border-b border-gray-200">
                  <h4 className="text-xs font-medium text-gray-500 mb-1">
                    Supplier
                  </h4>
                  <p className="text-sm text-gray-900">{formData.supplier}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.supplierAddress}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Pickup: {formData.pickupDate} • {formData.pickupTimeWindow}
                  </p>
                </div>
                <div className="px-4 py-3 border-b border-gray-200">
                  <h4 className="text-xs font-medium text-gray-500 mb-1">
                    Master Cargo
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Carton Count</p>
                      <p className="text-sm font-medium text-gray-900">
                        {formData.cartonCount}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Gross Weight</p>
                      <p className="text-sm font-medium text-gray-900">
                        {formData.grossWeight} kg
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Volume</p>
                      <p className="text-sm font-medium text-gray-900">
                        {formData.cbm} CBM
                      </p>
                    </div>
                  </div>
                </div>
                <div className="px-4 py-3">
                  <h4 className="text-xs font-medium text-gray-500 mb-2">
                    Destinations
                  </h4>
                  {formData.destinations.map((dest, index) => <div key={index} className="mb-2 last:mb-0 p-2 bg-gray-50 rounded-md">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {dest.warehouseId || 'N/A'}
                          </p>
                          <p className="text-xs text-gray-500">
                            Shipment ID: {dest.shipmentId || 'N/A'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">
                            Cartons:{' '}
                            <span className="font-medium text-gray-900">
                              {dest.cartonCount || '0'}
                            </span>
                          </p>
                          <p className="text-xs text-gray-500">
                            Weight:{' '}
                            <span className="font-medium text-gray-900">
                              {dest.grossWeight || '0'} kg
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>)}
                </div>
              </div>
              <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-lg">
                <div className="flex items-start">
                  <AlertCircleIcon className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-yellow-800 font-medium">
                      Pricing is estimated and subject to review
                    </p>
                    <p className="text-xs text-yellow-700 mt-1">
                      The final quote will be calculated based on the
                      information provided and reviewed by our team. The
                      customer will be notified once the quote is finalized.
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  Estimated Quote Pricing
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Base DDP Rate:</span>
                    <span className="text-gray-900">
                      $
                      {formData.serviceMode === 'air-express' ? '12.50' : formData.serviceMode === 'air-freight' ? '8.20' : '4.50'}{' '}
                      per kg
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Chargeable Weight:</span>
                    <span className="text-gray-900">
                      {formData.grossWeight || '0'} kg
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Base Shipping Cost:</span>
                    <span className="text-gray-900">
                      $
                      {formData.grossWeight ? formData.serviceMode === 'air-express' ? (12.5 * Number(formData.grossWeight)).toFixed(2) : formData.serviceMode === 'air-freight' ? (8.2 * Number(formData.grossWeight)).toFixed(2) : (4.5 * Number(formData.grossWeight)).toFixed(2) : '0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Fuel Surcharge:</span>
                    <span className="text-gray-900">
                      $
                      {formData.grossWeight ? formData.serviceMode === 'air-express' ? (1.2 * Number(formData.grossWeight)).toFixed(2) : formData.serviceMode === 'air-freight' ? (0.8 * Number(formData.grossWeight)).toFixed(2) : (0.3 * Number(formData.grossWeight)).toFixed(2) : '0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">
                      Customs Processing Fee:
                    </span>
                    <span className="text-gray-900">$150.00</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Last Mile Delivery:</span>
                    <span className="text-gray-900">
                      ${formData.destinations.length * 75}.00
                    </span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-medium">
                    <span className="text-gray-900">Estimated Total:</span>
                    <span className="text-blue-600">
                      $
                      {formData.grossWeight ? ((formData.serviceMode === 'air-express' ? 13.7 * Number(formData.grossWeight) : formData.serviceMode === 'air-freight' ? 9 * Number(formData.grossWeight) : 4.8 * Number(formData.grossWeight)) + 150 + formData.destinations.length * 75).toFixed(2) : '0.00'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-8 flex justify-between">
              <Button variant="tertiary" type="button" onClick={handlePrevStep}>
                Back to Cargo Details
              </Button>
              <Button variant="primary" type="submit" isLoading={isLoading}>
                <TruckIcon className="mr-2 h-4 w-4" />
                Create Quote
              </Button>
            </div>
          </Card>}
      </form>
    </div>;
};