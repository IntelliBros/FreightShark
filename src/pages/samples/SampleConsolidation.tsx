import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { PackageIcon, CopyIcon, QrCodeIcon, ClipboardIcon, PlusIcon, ImageIcon, CheckIcon, ArrowRightIcon, TruckIcon, ScaleIcon, BoxIcon, DownloadIcon, PrinterIcon, AlertCircleIcon } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { generateShippingLabel, generateSampleId } from '../../utils/generateShippingLabel';
import { sampleService, type SampleRequest as DBSampleRequest } from '../../services/sampleService';

// Warehouse address for sample consolidation
const WAREHOUSE_ADDRESS = {
  warehouse: 'DDP Freight Consolidation Center',
  street: '123 Logistics Avenue, Building 7',
  city: 'Guangzhou',
  province: 'Guangdong',
  postal: '510000',
  country: 'China'
};

interface SampleRequest {
  id: string;
  productName: string;
  expectedSamples: number;
  createdAt: string;
  status: 'pending' | 'receiving' | 'complete';
  receivedSamples: number;
  userId?: string;
  userName?: string;
}

interface IncomingSample {
  id: string;
  requestId: string;
  productName: string;
  supplier: string;
  receivedDate: string;
  weight: number;
  dimensions: string;
  volumetricWeight: number;
  photos: string[];
  barcode: string;
  status: 'received' | 'consolidated' | 'shipped';
}

export const SampleConsolidation = () => {
  const { addToast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('request');
  const [showRequestForm, setShowRequestForm] = useState(true);
  const [productName, setProductName] = useState('');
  const [expectedSamples, setExpectedSamples] = useState(1);
  const [currentRequest, setCurrentRequest] = useState<SampleRequest | null>(null);
  const [incomingSamples, setIncomingSamples] = useState<IncomingSample[]>([]);
  const [selectedSamples, setSelectedSamples] = useState<string[]>([]);
  const [consolidationHistory, setConsolidationHistory] = useState<SampleRequest[]>([]);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<SampleRequest | null>(null);

  // Load consolidation history and incoming samples on component mount
  React.useEffect(() => {
    if (user) {
      loadConsolidationHistory();
      loadIncomingSamples();
    }
  }, [user]);

  const loadConsolidationHistory = async () => {
    if (!user) {
      console.log('📜 Skipping history load - no user');
      return;
    }

    console.log('📜 Loading consolidation history for user:', user.id);
    const requests = await sampleService.getUserSampleRequests(user.id);
    console.log('📜 Raw requests from database:', requests);

    const formattedRequests = requests.map(req => ({
      id: req.id,
      productName: req.product_name,
      expectedSamples: req.expected_samples,
      createdAt: req.created_at,
      status: req.status === 'completed' ? 'complete' as const :
              req.status === 'partially_received' ? 'receiving' as const :
              'pending' as const,
      receivedSamples: req.received_samples,
      userId: req.user_id,
      userName: user.name
    }));
    console.log('📜 Formatted requests for UI:', formattedRequests);
    setConsolidationHistory(formattedRequests);
  };

  const loadIncomingSamples = async () => {
    if (!user) {
      console.log('📦 Skipping incoming samples load - no user');
      return;
    }

    console.log('📦 Loading incoming samples for user:', user.id);

    // Get all user's sample requests
    const userRequests = await sampleService.getUserSampleRequests(user.id);
    console.log('📦 User requests:', userRequests);

    // For each request, get the received samples
    const allIncomingSamples: IncomingSample[] = [];

    for (const request of userRequests) {
      const receivedSamples = await sampleService.getReceivedSamples(request.id);
      console.log(`📦 Received samples for request ${request.id}:`, receivedSamples);

      // Format received samples for UI
      receivedSamples.forEach(sample => {
        const incomingSample: IncomingSample = {
          id: sample.id,
          requestId: request.id,
          productName: request.product_name,
          supplier: 'Supplier', // This would come from additional data
          arrivalDate: sample.received_at,
          weight: 0, // Would need to be added to database
          volumetricWeight: 0, // Would need to be added to database
          photos: [],
          barcode: sample.barcode,
          status: sample.status as 'received' | 'consolidated' | 'shipped'
        };
        allIncomingSamples.push(incomingSample);
      });
    }

    console.log('📦 All incoming samples:', allIncomingSamples);
    setIncomingSamples(allIncomingSamples);
  };

  const handleCreateRequest = async () => {
    console.log('===== STARTING SAMPLE CONSOLIDATION CREATION =====');
    console.log('Product Name:', productName);
    console.log('Expected Samples:', expectedSamples);
    console.log('User:', user);

    if (!productName.trim()) {
      console.error('❌ Validation failed: Product name is empty');
      addToast('Please enter a product name', 'error');
      return;
    }

    if (expectedSamples < 1) {
      console.error('❌ Validation failed: Expected samples < 1');
      addToast('Expected samples must be at least 1', 'error');
      return;
    }

    if (!user) {
      console.error('❌ Validation failed: User not logged in');
      addToast('Please login to create a request', 'error');
      return;
    }

    const sampleId = generateSampleId(user.id);
    console.log('📋 Generated Sample ID:', sampleId);

    // Prepare data for database
    const requestData = {
      id: sampleId,
      user_id: user.id,
      product_name: productName.trim(),
      expected_samples: expectedSamples
    };
    console.log('📦 Request data to save:', requestData);

    // Save to database
    console.log('💾 Attempting to save to database...');
    const dbRequest = await sampleService.createSampleRequest(requestData);

    if (!dbRequest) {
      console.error('❌ Database save FAILED');
      console.error('Check browser console for detailed error from sampleService');
      addToast('Failed to create sample request. Please try again.', 'error');
      return;
    }

    console.log('✅ Database save successful:', dbRequest);

    // Create local request object for UI
    const newRequest: SampleRequest = {
      id: sampleId,
      productName: productName.trim(),
      expectedSamples,
      createdAt: dbRequest.created_at,
      status: 'pending',
      receivedSamples: 0,
      userId: user.id,
      userName: user.name || 'Customer'
    };
    console.log('📝 Local request object created:', newRequest);

    // Also store in localStorage for backward compatibility
    console.log('💾 Saving to localStorage for backup...');
    const existingRequests = JSON.parse(localStorage.getItem('sampleRequests') || '[]');
    existingRequests.push(newRequest);
    localStorage.setItem('sampleRequests', JSON.stringify(existingRequests));
    console.log('✅ Saved to localStorage');

    // Update consolidation history
    console.log('📜 Updating consolidation history...');
    setConsolidationHistory([...consolidationHistory, newRequest]);

    setCurrentRequest(newRequest);
    setShowRequestForm(false);

    console.log('===== SAMPLE CONSOLIDATION CREATION COMPLETE =====');
    console.log('Final request:', newRequest);

    addToast('Sample consolidation request created successfully!', 'success');
  };

  const handleDownloadLabel = (request?: SampleRequest) => {
    const requestToUse = request || currentRequest;
    if (!requestToUse || !user) return;

    const labelData = {
      userId: user.id,
      userName: user.name || 'Customer',
      productName: requestToUse.productName,
      sampleId: requestToUse.id,
      warehouseAddress: WAREHOUSE_ADDRESS
    };

    generateShippingLabel(labelData);
    addToast('Shipping label downloaded successfully!', 'success');
  };

  const handleCopyAddress = () => {
    const addressText = `
${WAREHOUSE_ADDRESS.warehouse}
${WAREHOUSE_ADDRESS.street}
${WAREHOUSE_ADDRESS.city}, ${WAREHOUSE_ADDRESS.province} ${WAREHOUSE_ADDRESS.postal}
${WAREHOUSE_ADDRESS.country}
Sample ID: ${currentRequest?.id || 'N/A'}
    `.trim();

    navigator.clipboard.writeText(addressText);
    addToast('Warehouse address copied to clipboard!', 'success');
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

  const totalWeight = incomingSamples
    .filter(sample => selectedSamples.includes(sample.id))
    .reduce((sum, sample) => sum + sample.weight, 0);

  const totalVolumetricWeight = incomingSamples
    .filter(sample => selectedSamples.includes(sample.id))
    .reduce((sum, sample) => sum + sample.volumetricWeight, 0);

  const chargeableWeight = Math.max(totalWeight, totalVolumetricWeight);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Sample Consolidation</h1>
        <p className="text-gray-600 mt-1">
          Consolidate sample shipments from multiple suppliers into a single delivery
        </p>
      </div>

      <div className="mb-6 border-b border-gray-200">
        <nav className="flex -mb-px">
          <button
            className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'request'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('request')}
          >
            Request Consolidation
          </button>
          <button
            className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'incoming'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('incoming')}
          >
            Incoming Samples
          </button>
          <button
            className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('history')}
          >
            Consolidation History
          </button>
        </nav>
      </div>

      {activeTab === 'request' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <h2 className="text-lg font-medium text-gray-900 mb-6">
                Request Sample Consolidation
              </h2>

              {showRequestForm && !currentRequest ? (
                <div className="space-y-6">
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
                            <li>Enter your product name and expected number of samples</li>
                            <li>Download shipping labels with unique barcodes</li>
                            <li>Send labels to suppliers to attach on sample packages</li>
                            <li>We scan and track samples when they arrive</li>
                            <li>Consolidate and ship all samples to you in one package</li>
                          </ol>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="product-name" className="block text-sm font-medium text-gray-700">
                        Product Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="product-name"
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Enter your product name"
                      />
                    </div>

                    <div>
                      <label htmlFor="expected-samples" className="block text-sm font-medium text-gray-700">
                        Expected Number of Samples <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        id="expected-samples"
                        min="1"
                        value={expectedSamples}
                        onChange={(e) => setExpectedSamples(parseInt(e.target.value) || 1)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Enter number of samples"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        You can download multiple labels for each supplier
                      </p>
                    </div>
                  </div>

                  <Button variant="primary" fullWidth onClick={handleCreateRequest}>
                    Create Consolidation Request
                  </Button>
                </div>
              ) : currentRequest ? (
                <div className="space-y-6">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <CheckIcon className="h-5 w-5 text-green-500 mr-2" />
                      <div>
                        <h3 className="text-sm font-medium text-green-800">
                          Consolidation Request Created
                        </h3>
                        <p className="text-sm text-green-700 mt-1">
                          Sample ID: <span className="font-mono font-bold">{currentRequest.id}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3">Request Details</h3>
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-500">Product:</dt>
                        <dd className="text-sm font-medium text-gray-900">{currentRequest.productName}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-500">Expected Samples:</dt>
                        <dd className="text-sm font-medium text-gray-900">{currentRequest.expectedSamples}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-500">Received:</dt>
                        <dd className="text-sm font-medium text-gray-900">{currentRequest.receivedSamples} / {currentRequest.expectedSamples}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-500">Status:</dt>
                        <dd>
                          <Badge variant={currentRequest.status === 'complete' ? 'success' : currentRequest.status === 'receiving' ? 'info' : 'default'}>
                            {currentRequest.status}
                          </Badge>
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <h3 className="font-medium text-gray-900 mb-3">Warehouse Address</h3>
                    <div className="bg-white p-3 rounded border border-gray-200 mb-3">
                      <p className="text-sm font-medium text-gray-900">{WAREHOUSE_ADDRESS.warehouse}</p>
                      <p className="text-sm text-gray-600">{WAREHOUSE_ADDRESS.street}</p>
                      <p className="text-sm text-gray-600">
                        {WAREHOUSE_ADDRESS.city}, {WAREHOUSE_ADDRESS.province} {WAREHOUSE_ADDRESS.postal}
                      </p>
                      <p className="text-sm text-gray-600">{WAREHOUSE_ADDRESS.country}</p>
                      <p className="text-sm font-medium text-blue-600 mt-2">
                        Sample ID: {currentRequest.id}
                      </p>
                    </div>
                    <Button variant="secondary" size="sm" onClick={handleCopyAddress}>
                      <CopyIcon className="h-4 w-4 mr-1" />
                      Copy Address
                    </Button>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <AlertCircleIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">Important Instructions</h3>
                        <ol className="mt-2 text-sm text-yellow-700 space-y-1 list-decimal list-inside">
                          <li>Download and print shipping labels for each supplier</li>
                          <li>Send labels to your suppliers</li>
                          <li>Instruct suppliers to attach labels to sample packages</li>
                          <li>Ensure barcode is clearly visible on the outside</li>
                        </ol>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="primary" onClick={handleDownloadLabel}>
                      <DownloadIcon className="h-4 w-4 mr-1" />
                      Download Shipping Label
                    </Button>
                    <Button variant="secondary" onClick={() => {
                      setShowRequestForm(true);
                      setCurrentRequest(null);
                      setProductName('');
                      setExpectedSamples(1);
                    }}>
                      Create New Request
                    </Button>
                  </div>
                </div>
              ) : null}
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Benefits
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Save on Shipping
                    </p>
                    <p className="text-xs text-gray-500">
                      Combine multiple samples into one shipment
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Track Everything
                    </p>
                    <p className="text-xs text-gray-500">
                      Barcode scanning for accurate tracking
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Quality Photos
                    </p>
                    <p className="text-xs text-gray-500">
                      We photograph all samples upon arrival
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Professional Packaging
                    </p>
                    <p className="text-xs text-gray-500">
                      Secure packaging for international shipping
                    </p>
                  </div>
                </li>
              </ul>
            </Card>

            <Card>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Pricing
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    Consolidation Fee:
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    $5 per sample
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    Storage (first 30 days):
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    Free
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    Photos:
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    Included
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                *Shipping costs calculated separately based on weight and
                destination
              </p>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'incoming' && (
        <div className="space-y-6">
          <Card>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-medium text-gray-900">
                  Incoming Samples
                </h2>
                <button
                  onClick={() => loadIncomingSamples()}
                  className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Refresh samples"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
              {selectedSamples.length > 0 && (
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">{selectedSamples.length}</span> selected
                  </div>
                  <Button variant="primary" size="sm" onClick={handleCreateQuote}>
                    Create Consolidation Quote
                  </Button>
                </div>
              )}
            </div>

            {incomingSamples.length === 0 ? (
              <div className="text-center py-12">
                <PackageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  No Samples Received Yet
                </h3>
                <p className="text-gray-500">
                  Samples will appear here once they arrive at our warehouse
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {incomingSamples.map((sample) => (
                  <div
                    key={sample.id}
                    className={`border rounded-lg p-4 ${
                      selectedSamples.includes(sample.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start">
                        <input
                          type="checkbox"
                          className="h-5 w-5 text-blue-600 rounded border-gray-300 mt-1"
                          checked={selectedSamples.includes(sample.id)}
                          onChange={() => handleToggleSampleSelection(sample.id)}
                        />
                        <div className="ml-4">
                          <h3 className="font-medium text-gray-900">
                            {sample.productName}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            From: {sample.supplier}
                          </p>
                          <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Weight:</span>{' '}
                              <span className="font-medium">{sample.weight} kg</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Dimensions:</span>{' '}
                              <span className="font-medium">{sample.dimensions}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Volumetric:</span>{' '}
                              <span className="font-medium">
                                {sample.volumetricWeight} kg
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Received:</span>{' '}
                              <span className="font-medium">{sample.receivedDate}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant={
                          sample.status === 'shipped'
                            ? 'success'
                            : sample.status === 'consolidated'
                            ? 'info'
                            : 'default'
                        }
                      >
                        {sample.status}
                      </Badge>
                    </div>
                    {sample.photos.length > 0 && (
                      <div className="mt-3 flex gap-2">
                        {sample.photos.map((photo, idx) => (
                          <div
                            key={idx}
                            className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center"
                          >
                            <ImageIcon className="h-8 w-8 text-gray-400" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {selectedSamples.length > 0 && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-3">
                  Consolidation Summary
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Total Weight</p>
                    <p className="text-lg font-medium">{totalWeight.toFixed(2)} kg</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Volumetric Weight</p>
                    <p className="text-lg font-medium">
                      {totalVolumetricWeight.toFixed(2)} kg
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Chargeable Weight</p>
                    <p className="text-lg font-medium text-blue-600">
                      {chargeableWeight.toFixed(2)} kg
                    </p>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-6">
          <Card>
            <h2 className="text-lg font-medium text-gray-900 mb-6">
              Consolidation History
            </h2>
            {consolidationHistory.length === 0 ? (
              <div className="text-center py-12">
                <TruckIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  No Previous Consolidations
                </h3>
                <p className="text-gray-500">
                  Your consolidation requests will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {consolidationHistory.map((request) => (
                  <div
                    key={request.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedHistoryItem(selectedHistoryItem?.id === request.id ? null : request)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{request.productName}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Sample ID: <span className="font-mono">{request.id}</span>
                        </p>
                        <p className="text-sm text-gray-600">
                          Created: {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                        <div className="mt-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            request.status === 'complete' ? 'bg-green-100 text-green-800' :
                            request.status === 'receiving' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {request.status === 'complete' ? 'Completed' :
                             request.status === 'receiving' ? 'Receiving' : 'Pending'}
                          </span>
                          <span className="ml-2 text-sm text-gray-600">
                            {request.receivedSamples} / {request.expectedSamples} samples received
                          </span>
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadLabel(request);
                          }}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <DownloadIcon className="h-4 w-4 mr-1" />
                          Label
                        </button>
                      </div>
                    </div>

                    {selectedHistoryItem?.id === request.id && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Request Details</h4>
                            <dl className="space-y-1">
                              <div className="flex justify-between">
                                <dt className="text-sm text-gray-500">Product:</dt>
                                <dd className="text-sm text-gray-900">{request.productName}</dd>
                              </div>
                              <div className="flex justify-between">
                                <dt className="text-sm text-gray-500">Expected Samples:</dt>
                                <dd className="text-sm text-gray-900">{request.expectedSamples}</dd>
                              </div>
                              <div className="flex justify-between">
                                <dt className="text-sm text-gray-500">Received:</dt>
                                <dd className="text-sm text-gray-900">{request.receivedSamples}</dd>
                              </div>
                            </dl>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Warehouse Address</h4>
                            <div className="text-sm text-gray-600 space-y-1">
                              <p>{WAREHOUSE_ADDRESS.warehouse}</p>
                              <p>{WAREHOUSE_ADDRESS.street}</p>
                              <p>{WAREHOUSE_ADDRESS.city}, {WAREHOUSE_ADDRESS.province}</p>
                              <p>{WAREHOUSE_ADDRESS.postal}, {WAREHOUSE_ADDRESS.country}</p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyAddress();
                              }}
                              className="mt-2 inline-flex items-center text-sm text-blue-600 hover:text-blue-500"
                            >
                              <CopyIcon className="h-4 w-4 mr-1" />
                              Copy Address
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};