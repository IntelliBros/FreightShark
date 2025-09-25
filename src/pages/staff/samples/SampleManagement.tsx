import React, { useState, useEffect, useRef } from 'react';
import { Package, Scan, CheckCircle, XCircle, Search, Filter, Download, AlertCircle, Camera, Upload, TruckIcon, Link, CreditCard } from 'lucide-react';
import { BrowserQRCodeReader, BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { useData } from '../../../context/DataContextV2';
import { useAuth } from '../../../context/AuthContext';
import { sampleService } from '../../../services/sampleService';
import { sampleShipmentService, type SampleShipmentRequest } from '../../../services/sampleShipmentService';
import { notificationService } from '../../../services/NotificationService';
import { DataService } from '../../../services/DataService';
import { useNotifications } from '../../../context/NotificationsContext';

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
  const [activeTab, setActiveTab] = useState<'scan' | 'requests' | 'received' | 'shipments'>('scan');
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
  const [shipmentRequests, setShipmentRequests] = useState<SampleShipmentRequest[]>([]);
  const [selectedShipmentRequest, setSelectedShipmentRequest] = useState<SampleShipmentRequest | null>(null);
  const [paymentLink, setPaymentLink] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [packagePhoto, setPackagePhoto] = useState<string>('');
  const [shipmentSampleDetails, setShipmentSampleDetails] = useState<Record<string, any>>({});
  const [isUploadingSample, setIsUploadingSample] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserQRCodeReader | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSampleData();
    loadShipmentRequests();
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

  const loadShipmentRequests = async () => {
    try {
      const requests = await sampleShipmentService.getAllShipmentRequests();
      setShipmentRequests(requests);
      console.log('Loaded shipment requests:', requests);
    } catch (error) {
      console.error('Error loading shipment requests:', error);
    }
  };

  const loadShipmentSampleDetails = async (sampleIds: string[]) => {
    const details: Record<string, any> = {};
    for (const sampleId of sampleIds) {
      const sample = await sampleService.getSampleById(sampleId);
      if (sample) {
        details[sampleId] = sample;
      }
    }
    setShipmentSampleDetails(details);
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

    // Prevent double-clicking
    if (isUploadingSample) {
      return;
    }

    const request = sampleRequests.find(r => r.id === selectedRequestId);
    if (!request) {
      setScanError('Selected consolidation request not found');
      return;
    }

    // Set loading state
    setIsUploadingSample(true);

    try {
      // Record the received sample in database with photo and delivery address
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
        setIsUploadingSample(false);
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

      // Send email notification to customer
      try {
        // Get the customer data
        const customer = await DataService.getUsers().then(users =>
          users.find(u => u.id === request.userId)
        );

        if (customer) {
          // Send email notification with sample counts
          await notificationService.notifySampleReceived(
            {
              id: scannedSampleId, // Use the actual scanned sample ID, not the database record ID
              product_name: request.productName,
              consolidation_id: scannedSampleId,
              received_date: dbSample.received_at,
              received_count: request.receivedSamples + 1, // Add 1 for the current sample
              expected_count: request.expectedSamples
            },
            customer
          );

          // The notifySampleReceived method above handles both email and database notification creation
          // No need for separate localStorage logic here

          console.log('✅ Notifications sent to customer:', customer.email);
        }
      } catch (error) {
        console.error('Failed to send notifications:', error);
        // Don't fail the whole operation if notifications fail
      }

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
    } catch (error) {
      console.error('Error completing sample receipt:', error);
      setScanError('Failed to complete sample receipt. Please try again.');
    } finally {
      setIsUploadingSample(false);
    }
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
    <div className="space-y-4 md:space-y-6">
      <div className="px-4 md:px-0">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Sample Management</h1>
        <p className="text-sm text-gray-600 mt-1">Scan and track incoming sample shipments</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="flex -mb-px min-w-max md:min-w-0">
            <button
              onClick={() => setActiveTab('scan')}
              className={`px-3 md:px-6 py-3 text-xs md:text-sm font-medium border-b-2 whitespace-nowrap ${
                activeTab === 'scan'
                  ? 'border-[#00b4d8] text-[#00b4d8]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Scan className="h-4 w-4 inline mr-1 md:mr-2" />
              <span className="hidden sm:inline">Scan Samples</span>
              <span className="sm:hidden">Scan</span>
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-3 md:px-6 py-3 text-xs md:text-sm font-medium border-b-2 whitespace-nowrap ${
                activeTab === 'requests'
                  ? 'border-[#00b4d8] text-[#00b4d8]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Package className="h-4 w-4 inline mr-1 md:mr-2" />
              <span className="hidden sm:inline">Sample Requests</span>
              <span className="sm:hidden">Requests</span>
            </button>
            <button
              onClick={() => setActiveTab('received')}
              className={`px-3 md:px-6 py-3 text-xs md:text-sm font-medium border-b-2 whitespace-nowrap ${
                activeTab === 'received'
                  ? 'border-[#00b4d8] text-[#00b4d8]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <CheckCircle className="h-4 w-4 inline mr-1 md:mr-2" />
              <span className="hidden sm:inline">Received Samples</span>
              <span className="sm:hidden">Received</span>
            </button>
            <button
              onClick={() => setActiveTab('shipments')}
              className={`px-3 md:px-6 py-3 text-xs md:text-sm font-medium border-b-2 whitespace-nowrap ${
                activeTab === 'shipments'
                  ? 'border-[#00b4d8] text-[#00b4d8]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <TruckIcon className="h-4 w-4 inline mr-1 md:mr-2" />
              <span className="hidden sm:inline">Shipment Requests</span>
              <span className="sm:hidden">Shipments</span>
            </button>
          </nav>
        </div>

        <div className="p-4 md:p-6">
          {activeTab === 'scan' && (
            <div className="space-y-4 md:space-y-6">
              <div className="bg-gray-50 rounded-lg p-4 md:p-6">
                <h2 className="text-lg font-semibold mb-4">QR Code Scanner</h2>

                {!isScanning ? (
                  <div className="text-center space-y-4">
                    <Package className="h-16 w-16 text-gray-400 mx-auto" />
                    <p className="text-gray-600">Ready to scan sample barcodes</p>
                    <button
                      onClick={startScanning}
                      className="bg-[#00b4d8] text-white px-4 md:px-6 py-2 rounded-lg hover:bg-[#0096c7] w-full sm:w-auto"
                    >
                      <Scan className="h-4 w-4 inline mr-2" />
                      Start QR Scanner
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-black rounded-lg overflow-hidden">
                      <video ref={videoRef} className="w-full h-48 md:h-64 object-cover" />
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
                        className="bg-red-500 text-white px-4 md:px-6 py-2 rounded-lg hover:bg-red-600 flex-1"
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
                <div className="bg-blue-50 rounded-lg p-4 md:p-6 border-2 border-blue-300">
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
                          className="w-full max-w-sm md:max-w-md mx-auto rounded-lg shadow-lg"
                        />
                        <div className="flex gap-3">
                          <button
                            onClick={() => setSamplePhoto('')}
                            disabled={isUploadingSample}
                            className={`flex-1 px-4 py-2 rounded-lg text-white ${
                              isUploadingSample
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-gray-500 hover:bg-gray-600'
                            }`}
                          >
                            Retake Photo
                          </button>
                          <button
                            onClick={completeReceivedSample}
                            disabled={isUploadingSample}
                            className={`flex-1 px-4 py-2 rounded-lg text-white ${
                              isUploadingSample
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-green-600 hover:bg-green-700'
                            }`}
                          >
                            {isUploadingSample ? (
                              <>
                                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 inline mr-2" />
                                Complete Receipt
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-4 md:p-6">
                <h3 className="text-base md:text-lg font-semibold mb-4">Manual Entry</h3>
                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    💡 <strong>Tip:</strong> If QR code scanning doesn't work, you can manually enter any sample ID from the label.
                    Any format is accepted (barcode, QR code, text, numbers, etc.)
                  </p>
                </div>
                <form onSubmit={handleManualSubmit} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="Enter any Sample ID or barcode text"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00b4d8] focus:border-transparent"
                  />
                  <button
                    type="submit"
                    className="bg-[#00b4d8] text-white px-4 md:px-6 py-2 rounded-lg hover:bg-[#0096c7] w-full sm:w-auto"
                  >
                    Submit
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'requests' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search requests..."
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00b4d8] focus:border-transparent w-full sm:w-auto"
                    />
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00b4d8] focus:border-transparent w-full sm:w-auto"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="partially_received">Partially Received</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto -mx-4 sm:-mx-0 px-4 sm:px-0">
                <table className="w-full min-w-[600px]">
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
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
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
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00b4d8] focus:border-transparent w-full sm:w-auto"
                  >
                    <option value="all">All Status</option>
                    <option value="in_warehouse">In Warehouse</option>
                    <option value="consolidated">Consolidated</option>
                    <option value="shipped">Shipped</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-3 md:gap-4">
                {filteredReceived.map((sample) => (
                  <div key={sample.id} className="bg-white border border-gray-200 rounded-lg p-3 md:p-4">
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

          {activeTab === 'shipments' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
                <h2 className="text-base md:text-lg font-semibold">Sample Shipment Requests</h2>
                <button
                  onClick={loadShipmentRequests}
                  className="px-3 md:px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm md:text-base"
                >
                  Refresh
                </button>
              </div>

              {shipmentRequests.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <TruckIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No shipment requests at this time</p>
                </div>
              ) : (
                <div className="space-y-3 md:space-y-4">
                  {shipmentRequests.map((request) => (
                    <div key={request.id} className="bg-white border border-gray-200 rounded-lg p-3 md:p-4">
                      <div className="flex flex-col sm:flex-row items-start sm:justify-between mb-3 gap-2">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            Request #{request.id}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            User ID: {request.user_id}
                          </p>
                          <p className="text-sm text-gray-600">
                            Samples: {request.quantity} item(s)
                          </p>
                          <p className="text-sm text-gray-600">
                            Created: {new Date(request.created_at).toLocaleString()}
                          </p>
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          request.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                          request.status === 'paid' ? 'bg-green-100 text-green-800' :
                          request.status === 'payment_pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {request.status.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="bg-gray-50 rounded p-2 md:p-3 mb-3 text-sm md:text-base">
                        <p className="text-sm font-medium text-gray-700 mb-1">Delivery Address:</p>
                        <p className="text-sm text-gray-600">{request.delivery_address}</p>
                      </div>

                      {selectedShipmentRequest?.id === request.id ? (
                        <div className="space-y-3 border-t pt-3 overflow-x-auto">
                          {/* Sample Details */}
                          <div className="bg-blue-50 rounded-lg p-3 md:p-4 mb-3">
                            <h4 className="font-medium text-gray-900 mb-3">Sample Details</h4>
                            <div className="space-y-3">
                              {request.sample_ids.map((sampleId) => {
                                const sample = shipmentSampleDetails[sampleId];
                                return (
                                  <div key={sampleId} className="bg-white rounded-lg p-3 border border-blue-200">
                                    <div className="flex items-start justify-between mb-2">
                                      <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">
                                          {sample?.product_name || 'Loading...'}
                                        </p>
                                        <p className="text-xs text-gray-600">
                                          Sample ID: {sampleId}
                                        </p>
                                        {sample?.consolidation_id && (
                                          <p className="text-xs text-gray-600">
                                            Consolidation ID: {sample.consolidation_id}
                                          </p>
                                        )}
                                        {sample?.received_at && (
                                          <p className="text-xs text-gray-600">
                                            Received: {new Date(sample.received_at).toLocaleDateString()}
                                          </p>
                                        )}
                                      </div>
                                      {sample?.photos && sample.photos.length > 0 && (
                                        <div className="ml-3">
                                          <img
                                            src={sample.photos[0]}
                                            alt="Sample"
                                            className="w-12 h-12 md:w-16 md:h-16 object-cover rounded border border-gray-300 cursor-pointer hover:opacity-80"
                                            onClick={() => {
                                              const modal = document.createElement('div');
                                              modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
                                              modal.onclick = () => modal.remove();
                                              modal.innerHTML = `
                                                <img src="${sample.photos[0]}" class="max-w-[90vw] max-h-[90vh] rounded-lg" />
                                              `;
                                              document.body.appendChild(modal);
                                            }}
                                          />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Package Photo Upload */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Package Photo
                            </label>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      setPackagePhoto(reader.result as string);
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                                className="flex-1 text-sm"
                              />
                              {packagePhoto && (
                                <button
                                  onClick={async () => {
                                    const success = await sampleShipmentService.updatePackagePhoto(request.id, packagePhoto);
                                    if (success) {
                                      alert('Package photo uploaded');
                                      setPackagePhoto('');
                                      loadShipmentRequests();
                                    }
                                  }}
                                  className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                                >
                                  Upload
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Payment Link */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Payment Link
                            </label>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <input
                                type="url"
                                value={paymentLink}
                                onChange={(e) => setPaymentLink(e.target.value)}
                                placeholder="https://payment-provider.com/..."
                                className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm"
                              />
                              <button
                                onClick={async () => {
                                  if (paymentLink) {
                                    const success = await sampleShipmentService.updatePaymentLink(request.id, paymentLink);
                                    if (success) {
                                      // Send notifications to customer
                                      try {
                                        const customer = await DataService.getUsers().then(users =>
                                          users.find(u => u.id === request.user_id)
                                        );

                                        if (customer) {
                                          // Send email notification
                                          await notificationService.notifySamplePaymentLink(request, customer);

                                          // Add in-app notification
                                          // Create in-app notification via NotificationService
                                          await notificationService.createNotification({
                                            user_id: customer.id,
                                            type: 'invoice',
                                            title: 'Payment Required',
                                            message: `Payment link available for your sample shipment request ${request.id}`,
                                            icon: 'CreditCard',
                                            link: '/samples'
                                          });
                                        }
                                      } catch (error) {
                                        console.error('Failed to send payment link notifications:', error);
                                      }

                                      alert('Payment link added and customer notified');
                                      setPaymentLink('');
                                      loadShipmentRequests();
                                    }
                                  }
                                }}
                                className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                              >
                                Add Link
                              </button>
                            </div>
                          </div>

                          {/* Mark as Paid */}
                          {request.status === 'payment_pending' && (
                            <button
                              onClick={async () => {
                                const success = await sampleShipmentService.markAsPaid(request.id);
                                if (success) {
                                  alert('Marked as paid');
                                  loadShipmentRequests();
                                }
                              }}
                              className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                            >
                              <CreditCard className="h-4 w-4 inline mr-2" />
                              Mark as Paid
                            </button>
                          )}

                          {/* Tracking Number and Ship */}
                          {request.status === 'paid' && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tracking Number
                              </label>
                              <div className="flex flex-col sm:flex-row gap-2">
                                <input
                                  type="text"
                                  value={trackingNumber}
                                  onChange={(e) => setTrackingNumber(e.target.value)}
                                  placeholder="Enter tracking number"
                                  className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm"
                                />
                                <button
                                  onClick={async () => {
                                    if (trackingNumber) {
                                      const success = await sampleShipmentService.markAsShipped(request.id, trackingNumber);
                                      if (success) {
                                        // Send notifications to customer
                                        try {
                                          const customer = await DataService.getUsers().then(users =>
                                            users.find(u => u.id === request.user_id)
                                          );

                                          if (customer) {
                                            // Send email notification
                                            await notificationService.notifySampleShipped(
                                              { ...request, tracking_number: trackingNumber },
                                              customer
                                            );

                                            // Add in-app notification
                                            // Create in-app notification via NotificationService
                                            await notificationService.createNotification({
                                              user_id: customer.id,
                                              type: 'shipment',
                                              title: 'Sample Shipped',
                                              message: `Your samples have been shipped! Tracking: ${trackingNumber}`,
                                              icon: 'Truck',
                                              link: '/samples'
                                            });
                                          }
                                        } catch (error) {
                                          console.error('Failed to send shipping notifications:', error);
                                        }

                                        alert('Marked as shipped and customer notified');
                                        setTrackingNumber('');
                                        loadShipmentRequests();
                                      }
                                    }
                                  }}
                                  className="px-3 py-1 bg-purple-500 text-white text-sm rounded hover:bg-purple-600"
                                >
                                  Mark as Shipped
                                </button>
                              </div>
                            </div>
                          )}

                          <button
                            onClick={() => {
                              setSelectedShipmentRequest(null);
                              setPackagePhoto('');
                              setPaymentLink('');
                              setTrackingNumber('');
                              setShipmentSampleDetails({});
                            }}
                            className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          {request.payment_link && (
                            <a
                              href={request.payment_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 text-sm rounded hover:bg-blue-200 text-center"
                            >
                              <Link className="h-4 w-4 inline mr-1" />
                              Payment Link
                            </a>
                          )}
                          {request.tracking_number && (
                            <div className="flex-1 px-3 py-2 bg-purple-100 text-purple-700 text-sm rounded text-center">
                              Track: {request.tracking_number}
                            </div>
                          )}
                          {request.status !== 'shipped' && (
                            <button
                              onClick={async () => {
                                setSelectedShipmentRequest(request);
                                await loadShipmentSampleDetails(request.sample_ids);
                              }}
                              className="px-4 py-2 bg-[#00b4d8] text-white text-sm rounded hover:bg-[#0096c7]"
                            >
                              Manage
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};