import React, { useState, useEffect, useRef } from 'react';
import { Package, Scan, CheckCircle, XCircle, Search, Filter, Download, AlertCircle, Camera, Upload } from 'lucide-react';
import { BrowserQRCodeReader, BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { sampleService } from '../../../services/sampleService';

interface SampleRequest {
  id: string;
  productName: string;
  expectedSamples: number;
  receivedSamples: number;
  createdAt: string;
  status: 'pending' | 'partially_received' | 'completed';
  userId: string;
  userName?: string;
}

interface ReceivedSample {
  id: string;
  sampleId: string;
  userId: string;
  productName: string;
  receivedAt: string;
  receivedBy: string;
  status: 'in_warehouse' | 'consolidated' | 'shipped';
  notes?: string;
}

export const SampleManagement = () => {
  const { user } = useAuth();
  const { refreshData } = useData();
  const [activeTab, setActiveTab] = useState<'scan' | 'requests' | 'received'>('scan');
  const [sampleRequests, setSampleRequests] = useState<SampleRequest[]>([]);
  const [receivedSamples, setReceivedSamples] = useState<ReceivedSample[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string>('');
  const [scanError, setScanError] = useState<string>('');
  const [manualInput, setManualInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [scannedSampleId, setScannedSampleId] = useState<string>('');
  const [samplePhoto, setSamplePhoto] = useState<string>('');
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string>('');
  const [currentCameraFacing, setCurrentCameraFacing] = useState<'environment' | 'user'>('environment');
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserQRCodeReader | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSampleData();
    return () => {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
    };
  }, []);

  const loadSampleData = async () => {
    // Load from database
    const dbRequests = await sampleService.getAllSampleRequests();
    const formattedRequests = dbRequests.map(req => ({
      id: req.id,
      productName: req.product_name,
      expectedSamples: req.expected_samples,
      receivedSamples: req.received_samples,
      createdAt: req.created_at,
      status: req.status === 'completed' ? 'completed' as const :
              req.status === 'partially_received' ? 'partially_received' as const :
              'pending' as const,
      userId: req.user_id,
      userName: undefined // We'd need to join with users table to get this
    }));
    setSampleRequests(formattedRequests);

    // Load received samples from database
    const dbReceived = await sampleService.getAllReceivedSamples();
    const formattedReceived = dbReceived.map(sample => ({
      id: sample.id,
      sampleId: sample.barcode,
      userId: '',
      productName: '',
      receivedAt: sample.received_at,
      receivedBy: sample.received_by,
      status: sample.status,
      notes: sample.notes
    }));
    setReceivedSamples(formattedReceived);

    // Also keep localStorage sync for backward compatibility
    const storedRequests = localStorage.getItem('sampleRequests');
    const storedReceived = localStorage.getItem('receivedSamples');

    if (storedRequests) {
      const localRequests = JSON.parse(storedRequests);
      // Merge with database requests, avoiding duplicates
      const mergedRequests = [...formattedRequests];
      localRequests.forEach((localReq: any) => {
        if (!mergedRequests.find(r => r.id === localReq.id)) {
          setSampleRequests(prev => [...prev, localReq]);
        }
      });
    }

    if (storedReceived) {
      const localReceived = JSON.parse(storedReceived);
      // Merge with database received, avoiding duplicates
      const mergedReceived = [...formattedReceived];
      localReceived.forEach((localRec: any) => {
        if (!mergedReceived.find(r => r.sampleId === localRec.sampleId)) {
          setReceivedSamples(prev => [...prev, localRec]);
        }
      });
    }
  };

  const startScanning = async () => {
    try {
      console.log('🎥 Starting QR code scanner...');
      setIsScanning(true);
      setScanError('');
      setScanResult('');

      // Check if running on HTTPS or localhost
      const isSecureContext = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
      if (!isSecureContext) {
        throw new Error('Camera access requires HTTPS or localhost. Use manual entry instead.');
      }

      // Check if browser supports required APIs
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser. Use manual entry instead.');
      }

      console.log('📹 Creating BrowserQRCodeReader (optimized for QR codes)...');
      const codeReader = new BrowserQRCodeReader();
      codeReaderRef.current = codeReader;

      console.log('📹 Requesting camera permissions...');

      // Get available cameras first
      console.log('📹 Listing video input devices...');
      const devices = await codeReader.listVideoInputDevices();
      console.log('📹 Available devices:', devices);
      setAvailableCameras(devices);

      if (devices.length === 0) {
        throw new Error('No camera devices found');
      }

      // Try to find the best camera based on facing mode
      let selectedDeviceId = null;

      // Look for a camera with the desired facing mode (back camera preferred)
      const preferredFacing = currentCameraFacing;
      console.log(`📹 Looking for camera with facing mode: ${preferredFacing}`);

      // First try with facingMode constraint
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: preferredFacing },
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 }
          }
        });
        console.log(`✅ Camera permission granted with ${preferredFacing} camera`);

        // Get the actual device ID from the stream
        const track = stream.getVideoTracks()[0];
        const settings = track.getSettings();
        selectedDeviceId = settings.deviceId;
        console.log('📹 Auto-selected device:', selectedDeviceId, 'facing:', settings.facingMode);

        // Stop the test stream
        stream.getTracks().forEach(track => track.stop());
      } catch (facingModeError) {
        console.log('📹 Facing mode constraint failed, trying first available camera...');

        // Fallback to first available camera
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              deviceId: devices[0].deviceId,
              width: { ideal: 1280, min: 640 },
              height: { ideal: 720, min: 480 }
            }
          });
          console.log('✅ Camera permission granted with fallback camera');
          selectedDeviceId = devices[0].deviceId;
          stream.getTracks().forEach(track => track.stop());
        } catch (fallbackError) {
          console.error('❌ Camera permission denied:', fallbackError);
          throw new Error('Camera permission is required for QR code scanning. Use manual entry instead.');
        }
      }

      if (!selectedDeviceId) {
        selectedDeviceId = devices[0].deviceId;
      }

      console.log('📹 Starting video decode...');
      await codeReader.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current,
        (result, err) => {
          if (result) {
            const text = result.getText();
            console.log('✅ QR code scanned successfully:', text);
            setScanResult(text);
            processScanResult(text);
            stopScanning();
          }
          if (err && !(err instanceof NotFoundException)) {
            console.error('📹 Scanner error:', err);
            // Don't show error for NotFoundException as it's normal when no barcode is detected
            if (err.name !== 'NotFoundException') {
              setScanError('Error scanning QR code. Please try again.');
            }
          }
        }
      );
      console.log('✅ Scanner started successfully');
    } catch (error: any) {
      console.error('❌ Error starting scanner:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      setScanError(error.message || 'Failed to start camera');
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    console.log('🛑 Stopping QR code scanner...');
    try {
      if (codeReaderRef.current) {
        console.log('📹 Resetting code reader...');
        codeReaderRef.current.reset();
        codeReaderRef.current = null;
        console.log('✅ Code reader reset successfully');
      }
      setIsScanning(false);
      console.log('✅ Scanner stopped');
    } catch (error) {
      console.error('❌ Error stopping scanner:', error);
      setIsScanning(false);
    }
  };

  const switchCamera = async () => {
    if (!isScanning) return;

    console.log('🔄 Switching camera...');
    const newFacing = currentCameraFacing === 'environment' ? 'user' : 'environment';
    console.log(`📹 Switching from ${currentCameraFacing} to ${newFacing}`);

    // Stop current scanning
    stopScanning();

    // Update facing mode
    setCurrentCameraFacing(newFacing);

    // Small delay to ensure camera is released
    setTimeout(() => {
      startScanning();
    }, 500);
  };

  const processScanResult = async (sampleId: string) => {
    console.log('🔍 Processing scanned sample:', sampleId);

    // Basic validation - accept any non-empty string as a valid sample ID
    if (!sampleId || sampleId.trim().length === 0) {
      setScanError('Invalid sample ID - cannot be empty');
      return;
    }

    const trimmedSampleId = sampleId.trim();

    // The scanned QR code content IS the consolidation request ID
    // Find the matching consolidation request automatically
    const matchingRequest = sampleRequests.find(request => request.id === trimmedSampleId);

    if (!matchingRequest) {
      setScanError(`No consolidation request found for ID: ${trimmedSampleId}`);
      console.error('❌ No matching consolidation request found for:', trimmedSampleId);
      return;
    }

    console.log('✅ Found matching consolidation request:', matchingRequest);

    // Automatically set the found request and sample ID
    setScannedSampleId(trimmedSampleId);
    setSelectedRequestId(matchingRequest.id);

    // Directly open photo capture
    setShowPhotoCapture(true);

    setScanResult(`Sample for: ${matchingRequest.productName} - Take a photo`);
    setScanError('');

    console.log('📸 Opening photo capture for automatic consolidation request selection');
  };

  const completeReceivedSample = async () => {
    if (!scannedSampleId || !samplePhoto || !selectedRequestId) {
      setScanError('Please scan a sample and take a photo');
      return;
    }

    const request = sampleRequests.find(r => r.id === selectedRequestId);
    if (!request) {
      setScanError('Selected consolidation request not found');
      return;
    }

    // Record the received sample in database with photo
    const dbSample = await sampleService.recordReceivedSample({
      id: `RS-${Date.now()}`,
      sample_request_id: selectedRequestId,
      barcode: scannedSampleId,
      received_by: user?.id || '',
      received_at: new Date().toISOString(),
      status: 'in_warehouse',
      photo: samplePhoto
    });

    if (!dbSample) {
      setScanError('Failed to record sample. Please try again.');
      return;
    }

    // Create local sample for UI update
    const newSample: ReceivedSample = {
      id: dbSample.id,
      sampleId: dbSample.barcode,
      userId: request.userId,
      productName: request.productName,
      receivedAt: dbSample.received_at,
      receivedBy: user?.name || 'Staff',
      status: dbSample.status
    };

    // Update UI
    const updatedReceived = [...receivedSamples, newSample];
    setReceivedSamples(updatedReceived);

    // Also update localStorage for backward compatibility
    localStorage.setItem('receivedSamples', JSON.stringify(updatedReceived));

    // Reload data to get updated counts from database
    await loadSampleData();

    // Reset states
    setScannedSampleId('');
    setSamplePhoto('');
    setShowPhotoCapture(false);
    setSelectedRequestId('');
    setScanResult(`Sample received successfully: ${request.productName}`);
    setScanError('');

    // Show success for 3 seconds then clear
    setTimeout(() => {
      setScanResult('');
    }, 3000);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      processScanResult(manualInput.trim());
      setManualInput('');
    }
  };


  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setSamplePhoto(base64String);
    };
    reader.readAsDataURL(file);
  };

  const filteredRequests = sampleRequests.filter(request => {
    const matchesSearch = request.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.userName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || request.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const filteredReceived = receivedSamples.filter(sample => {
    const matchesSearch = sample.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sample.sampleId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || sample.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sample Management</h1>
        <p className="text-sm text-gray-600 mt-1">Scan and track incoming sample shipments</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('scan')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'scan'
                  ? 'border-[#00b4d8] text-[#00b4d8]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Scan className="h-4 w-4 inline mr-2" />
              Scan Samples
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'requests'
                  ? 'border-[#00b4d8] text-[#00b4d8]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Package className="h-4 w-4 inline mr-2" />
              Sample Requests
            </button>
            <button
              onClick={() => setActiveTab('received')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'received'
                  ? 'border-[#00b4d8] text-[#00b4d8]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <CheckCircle className="h-4 w-4 inline mr-2" />
              Received Samples
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'scan' && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">QR Code Scanner</h2>

                {!isScanning ? (
                  <div className="text-center space-y-4">
                    <Package className="h-16 w-16 text-gray-400 mx-auto" />
                    <p className="text-gray-600">Ready to scan sample barcodes</p>
                    <button
                      onClick={startScanning}
                      className="bg-[#00b4d8] text-white px-6 py-2 rounded-lg hover:bg-[#0096c7]"
                    >
                      <Scan className="h-4 w-4 inline mr-2" />
                      Start QR Scanner
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-black rounded-lg overflow-hidden">
                      <video ref={videoRef} className="w-full h-64 object-cover" />
                    </div>
                    <div className="flex gap-3">
                      {availableCameras.length > 1 && (
                        <button
                          onClick={switchCamera}
                          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center"
                          title="Switch Camera"
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          Switch Camera
                        </button>
                      )}
                      <button
                        onClick={stopScanning}
                        className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 flex-1"
                      >
                        Stop Scanning
                      </button>
                    </div>
                  </div>
                )}

                {scanResult && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 inline mr-2" />
                    <span className="text-green-800">{scanResult}</span>
                  </div>
                )}

                {scanError && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <XCircle className="h-5 w-5 text-red-600 inline mr-2" />
                    <span className="text-red-800">{scanError}</span>
                  </div>
                )}
              </div>


              {showPhotoCapture && (
                <div className="bg-blue-50 rounded-lg p-6 border-2 border-blue-300">
                  <h3 className="text-lg font-semibold mb-4 text-blue-900">
                    <Camera className="h-5 w-5 inline mr-2" />
                    Take Sample Photo
                  </h3>

                  <div className="space-y-4">
                    {scannedSampleId && (
                      <p className="text-sm text-blue-800">
                        Sample ID: <span className="font-mono font-bold">{scannedSampleId}</span>
                      </p>
                    )}

                    {!samplePhoto ? (
                      <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center">
                        <Camera className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                        <p className="text-blue-700 mb-4">Upload a photo of the sample</p>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                        >
                          <Upload className="h-4 w-4 inline mr-2" />
                          Choose Photo
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <img
                          src={samplePhoto}
                          alt="Sample"
                          className="w-full max-w-md mx-auto rounded-lg shadow-lg"
                        />
                        <div className="flex gap-3">
                          <button
                            onClick={() => setSamplePhoto('')}
                            className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                          >
                            Retake Photo
                          </button>
                          <button
                            onClick={completeReceivedSample}
                            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 inline mr-2" />
                            Complete Receipt
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Manual Entry</h3>
                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    💡 <strong>Tip:</strong> If QR code scanning doesn't work, you can manually enter any sample ID from the label.
                    Any format is accepted (barcode, QR code, text, numbers, etc.)
                  </p>
                </div>
                <form onSubmit={handleManualSubmit} className="flex gap-3">
                  <input
                    type="text"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="Enter any Sample ID or barcode text"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00b4d8] focus:border-transparent"
                  />
                  <button
                    type="submit"
                    className="bg-[#00b4d8] text-white px-6 py-2 rounded-lg hover:bg-[#0096c7]"
                  >
                    Submit
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'requests' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search requests..."
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00b4d8] focus:border-transparent"
                    />
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00b4d8] focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="partially_received">Partially Received</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sample ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredRequests.map((request) => (
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{request.id}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{request.productName}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{request.userName || 'N/A'}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">
                              {request.receivedSamples} samples received
                            </span>
                            <span className="text-xs text-gray-500">
                              (originally expected: {request.expectedSamples})
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            request.status === 'completed' ? 'bg-green-100 text-green-800' :
                            request.status === 'partially_received' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {request.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'received' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search samples..."
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00b4d8] focus:border-transparent"
                    />
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00b4d8] focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="in_warehouse">In Warehouse</option>
                    <option value="consolidated">Consolidated</option>
                    <option value="shipped">Shipped</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4">
                {filteredReceived.map((sample) => (
                  <div key={sample.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{sample.productName}</h3>
                        <p className="text-sm text-gray-600 mt-1">Sample ID: {sample.sampleId}</p>
                        <p className="text-sm text-gray-600">Received by: {sample.receivedBy}</p>
                        <p className="text-sm text-gray-600">
                          Received: {new Date(sample.receivedAt).toLocaleString()}
                        </p>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        sample.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                        sample.status === 'consolidated' ? 'bg-purple-100 text-purple-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {sample.status.replace('_', ' ')}
                      </span>
                    </div>
                    {sample.notes && (
                      <p className="mt-3 text-sm text-gray-600 bg-gray-50 rounded p-2">
                        Notes: {sample.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};