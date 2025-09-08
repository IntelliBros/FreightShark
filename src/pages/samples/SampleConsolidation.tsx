import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { PackageIcon, CopyIcon, QrCodeIcon, ClipboardIcon, PlusIcon, ImageIcon, CheckIcon, ArrowRightIcon, TruckIcon, ScaleIcon, BoxIcon } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
// Mock data
const MOCK_ADDRESS = {
  warehouse: 'DDP Consolidation Center',
  street: '123 Logistics Avenue, Building 7',
  city: 'Guangzhou',
  province: 'Guangdong',
  postal: '510000',
  country: 'China',
  shipmentCode: 'SC-123456',
  userId: 'USER-789'
};
const MOCK_INCOMING_SAMPLES = [{
  id: 'sample-1',
  supplier: 'Shenzhen Tech Manufacturing',
  receivedDate: '2023-11-05',
  weight: 2.5,
  dimensions: '30 × 20 × 15 cm',
  volumetricWeight: 1.5,
  photos: ['photo-1.jpg', 'photo-2.jpg']
}, {
  id: 'sample-2',
  supplier: 'Guangzhou Electronics Co.',
  receivedDate: '2023-11-06',
  weight: 1.8,
  dimensions: '25 × 15 × 10 cm',
  volumetricWeight: 0.625,
  photos: ['photo-3.jpg']
}];
export const SampleConsolidation = () => {
  const {
    addToast
  } = useToast();
  const [activeTab, setActiveTab] = useState('request');
  const [showAddressCard, setShowAddressCard] = useState(false);
  const [selectedSamples, setSelectedSamples] = useState<string[]>([]);
  const handleCopyAddress = () => {
    const addressText = `
      ${MOCK_ADDRESS.warehouse}
      ${MOCK_ADDRESS.street}
      ${MOCK_ADDRESS.city}, ${MOCK_ADDRESS.province} ${MOCK_ADDRESS.postal}
      ${MOCK_ADDRESS.country}
      Shipment Code: ${MOCK_ADDRESS.shipmentCode}
      User ID: ${MOCK_ADDRESS.userId}
    `;
    navigator.clipboard.writeText(addressText.trim());
    addToast('Address copied to clipboard!', 'success');
  };
  const handleRequestConsolidation = () => {
    setShowAddressCard(true);
    addToast('Consolidation address generated!', 'success');
  };
  const handleToggleSampleSelection = (id: string) => {
    if (selectedSamples.includes(id)) {
      setSelectedSamples(selectedSamples.filter(sampleId => sampleId !== id));
    } else {
      setSelectedSamples([...selectedSamples, id]);
    }
  };
  const handleCreateQuote = () => {
    if (selectedSamples.length === 0) {
      addToast('Please select at least one sample to consolidate', 'warning');
      return;
    }
    addToast('Quote created successfully!', 'success');
    // In a real app, this would navigate to a new quote page
  };
  const totalWeight = MOCK_INCOMING_SAMPLES.filter(sample => selectedSamples.includes(sample.id)).reduce((sum, sample) => sum + sample.weight, 0);
  const totalVolumetricWeight = MOCK_INCOMING_SAMPLES.filter(sample => selectedSamples.includes(sample.id)).reduce((sum, sample) => sum + sample.volumetricWeight, 0);
  const chargeableWeight = Math.max(totalWeight, totalVolumetricWeight);
  return <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Sample Consolidation
        </h1>
        <p className="text-gray-600 mt-1">
          Consolidate sample shipments from multiple suppliers into a single
          delivery
        </p>
      </div>
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex -mb-px">
          <button className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'request' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`} onClick={() => setActiveTab('request')}>
            Request Consolidation
          </button>
          <button className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'incoming' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`} onClick={() => setActiveTab('incoming')}>
            Incoming Samples
          </button>
          <button className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'history' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`} onClick={() => setActiveTab('history')}>
            Consolidation History
          </button>
        </nav>
      </div>
      {activeTab === 'request' && <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <h2 className="text-lg font-medium text-gray-900 mb-6">
                Request Sample Consolidation
              </h2>
              {!showAddressCard ? <div className="space-y-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <PackageIcon className="h-5 w-5 text-blue-500" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">
                          How Sample Consolidation Works
                        </h3>
                        <div className="mt-2 text-sm text-blue-700">
                          <ol className="list-decimal list-inside space-y-1">
                            <li>
                              Request a unique China warehouse address for
                              sample consolidation
                            </li>
                            <li>
                              Share this address with your suppliers to send
                              samples
                            </li>
                            <li>
                              We'll receive, photograph, and consolidate your
                              samples
                            </li>
                            <li>
                              Create a quote to ship all samples in one package
                              to your address
                            </li>
                            <li>
                              Track your consolidated shipment to your door
                            </li>
                          </ol>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="destination-address" className="block text-sm font-medium text-gray-700">
                        Your Destination Address
                      </label>
                      <textarea id="destination-address" rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="Enter the address where you want your samples delivered" />
                    </div>
                    <div>
                      <label htmlFor="expected-samples" className="block text-sm font-medium text-gray-700">
                        Expected Number of Samples
                      </label>
                      <select id="expected-samples" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                        <option>1-3 samples</option>
                        <option>4-6 samples</option>
                        <option>7-10 samples</option>
                        <option>More than 10 samples</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="consolidation-notes" className="block text-sm font-medium text-gray-700">
                        Special Instructions (Optional)
                      </label>
                      <textarea id="consolidation-notes" rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="Any special handling instructions for your samples" />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button variant="primary" onClick={handleRequestConsolidation}>
                      Generate Warehouse Address
                    </Button>
                  </div>
                </div> : <div className="space-y-6">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <CheckIcon className="h-5 w-5 text-green-500" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-green-800">
                          Your Consolidation Address is Ready
                        </h3>
                        <div className="mt-2 text-sm text-green-700">
                          <p>
                            Share this address with your suppliers. Make sure
                            they include your Shipment Code and User ID on all
                            packages.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                      <h3 className="text-sm font-medium text-gray-700">
                        China Warehouse Address
                      </h3>
                      <button type="button" onClick={handleCopyAddress} className="text-blue-600 hover:text-blue-800 text-sm flex items-center">
                        <CopyIcon className="h-4 w-4 mr-1" />
                        Copy All
                      </button>
                    </div>
                    <div className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2 space-y-4">
                          <div>
                            <p className="text-gray-900 font-medium">
                              {MOCK_ADDRESS.warehouse}
                            </p>
                            <p className="text-gray-900">
                              {MOCK_ADDRESS.street}
                            </p>
                            <p className="text-gray-900">
                              {MOCK_ADDRESS.city}, {MOCK_ADDRESS.province}{' '}
                              {MOCK_ADDRESS.postal}
                            </p>
                            <p className="text-gray-900">
                              {MOCK_ADDRESS.country}
                            </p>
                          </div>
                          <div className="pt-3 border-t border-gray-200">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium text-gray-700">
                                Shipment Code:
                              </span>
                              <button type="button" className="text-blue-600 hover:text-blue-800 text-xs" onClick={() => {
                          navigator.clipboard.writeText(MOCK_ADDRESS.shipmentCode);
                          addToast('Shipment code copied!', 'success');
                        }}>
                                <CopyIcon className="h-3 w-3" />
                              </button>
                            </div>
                            <p className="text-gray-900 font-mono bg-gray-100 p-1 rounded text-center">
                              {MOCK_ADDRESS.shipmentCode}
                            </p>
                          </div>
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium text-gray-700">
                                User ID:
                              </span>
                              <button type="button" className="text-blue-600 hover:text-blue-800 text-xs" onClick={() => {
                          navigator.clipboard.writeText(MOCK_ADDRESS.userId);
                          addToast('User ID copied!', 'success');
                        }}>
                                <CopyIcon className="h-3 w-3" />
                              </button>
                            </div>
                            <p className="text-gray-900 font-mono bg-gray-100 p-1 rounded text-center">
                              {MOCK_ADDRESS.userId}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-center justify-center border border-gray-200 rounded-lg p-4">
                          <QrCodeIcon className="h-24 w-24 text-gray-400" />
                          <p className="text-xs text-gray-500 mt-2 text-center">
                            Scan to get address details
                          </p>
                          <button type="button" className="mt-3 text-sm text-blue-600 hover:text-blue-800">
                            Download QR
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
                    <Button variant="secondary" onClick={() => {
                window.print();
              }}>
                      <ClipboardIcon className="h-4 w-4 mr-1" />
                      Print Instructions
                    </Button>
                    <Button variant="primary" onClick={() => {
                addToast('Instructions sent to email!', 'success');
              }}>
                      Email to Suppliers
                    </Button>
                  </div>
                </div>}
            </Card>
          </div>
          <div>
            <Card>
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Consolidation Benefits
              </h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <TruckIcon className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-900">
                      Single Shipment
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Combine multiple samples into one shipment to save on
                      shipping costs
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <ScaleIcon className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-900">
                      Weight Verification
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      We weigh and measure all samples for accurate shipping
                      quotes
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <ImageIcon className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-900">
                      Photo Documentation
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Photos of all samples upon arrival for quality
                      verification
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <BoxIcon className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-900">
                      Secure Packaging
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Professional repackaging to ensure safe delivery
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  Pricing
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Consolidation Fee:</span>
                    <span className="text-gray-900">$10 per sample</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Storage:</span>
                    <span className="text-gray-900">Free for 14 days</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Express Shipping:</span>
                    <span className="text-gray-900">$15/kg (DDP)</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>}
      {activeTab === 'incoming' && <div className="space-y-6">
          <Card>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-medium text-gray-900">
                Incoming Samples
              </h2>
              <Badge variant="success">
                {MOCK_INCOMING_SAMPLES.length} Received
              </Badge>
            </div>
            <div className="space-y-4">
              {MOCK_INCOMING_SAMPLES.map(sample => <div key={sample.id} className={`border rounded-lg overflow-hidden transition ${selectedSamples.includes(sample.id) ? 'border-blue-500' : 'border-gray-200'}`}>
                  <div className="flex justify-between items-center px-4 py-3 bg-gray-50 border-b border-gray-200">
                    <h3 className="font-medium text-gray-900">
                      {sample.supplier}
                    </h3>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 mr-3">
                        Received: {sample.receivedDate}
                      </span>
                      <input type="checkbox" checked={selectedSamples.includes(sample.id)} onChange={() => handleToggleSampleSelection(sample.id)} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <span className="text-xs text-gray-500">
                          Gross Weight
                        </span>
                        <p className="text-gray-900">{sample.weight} kg</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">
                          Dimensions
                        </span>
                        <p className="text-gray-900">{sample.dimensions}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">
                          Volumetric Weight
                        </span>
                        <p className="text-gray-900">
                          {sample.volumetricWeight} kg
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">
                          Chargeable Weight
                        </span>
                        <p className="text-gray-900">
                          {Math.max(sample.weight, sample.volumetricWeight)} kg
                        </p>
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block mb-2">
                        Photos
                      </span>
                      <div className="flex space-x-2">
                        {sample.photos.map((photo, index) => <div key={index} className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                            <ImageIcon className="h-6 w-6 text-gray-400" />
                          </div>)}
                        <button type="button" className="w-16 h-16 border border-dashed border-gray-300 rounded flex flex-col items-center justify-center text-gray-400 hover:text-gray-500">
                          <PlusIcon className="h-5 w-5" />
                          <span className="text-xs mt-1">View All</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>)}
            </div>
            {MOCK_INCOMING_SAMPLES.length > 0 && <div className="mt-6 border-t border-gray-200 pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-medium text-gray-900">
                      Consolidation Summary
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {selectedSamples.length} of {MOCK_INCOMING_SAMPLES.length}{' '}
                      samples selected
                    </p>
                  </div>
                  <Button variant="primary" onClick={handleCreateQuote} disabled={selectedSamples.length === 0}>
                    Create Shipping Quote
                    <ArrowRightIcon className="h-4 w-4 ml-1" />
                  </Button>
                </div>
                {selectedSamples.length > 0 && <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <span className="text-xs text-gray-500">
                          Total Gross Weight
                        </span>
                        <p className="text-gray-900">
                          {totalWeight.toFixed(2)} kg
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">
                          Total Volumetric Weight
                        </span>
                        <p className="text-gray-900">
                          {totalVolumetricWeight.toFixed(2)} kg
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">
                          Total Chargeable Weight
                        </span>
                        <p className="font-medium text-blue-600">
                          {chargeableWeight.toFixed(2)} kg
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-900">
                          Estimated Shipping Cost (DDP):
                        </span>
                        <span className="text-lg font-medium text-blue-600">
                          ${(chargeableWeight * 15).toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Based on $15/kg DDP rate + $10 per sample consolidation
                        fee
                      </p>
                    </div>
                  </div>}
              </div>}
            {MOCK_INCOMING_SAMPLES.length === 0 && <div className="text-center py-12">
                <PackageIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  No samples received yet
                </h3>
                <p className="text-gray-500 mb-4">
                  Your incoming samples will appear here once they arrive at our
                  warehouse
                </p>
              </div>}
          </Card>
        </div>}
      {activeTab === 'history' && <Card>
          <h2 className="text-lg font-medium text-gray-900 mb-6">
            Consolidation History
          </h2>
          <div className="text-center py-12">
            <PackageIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              No consolidation history
            </h3>
            <p className="text-gray-500 mb-4">
              Your previous consolidation shipments will appear here
            </p>
            <Button variant="primary" onClick={() => setActiveTab('request')}>
              Request Consolidation
            </Button>
          </div>
        </Card>}
    </div>;
};