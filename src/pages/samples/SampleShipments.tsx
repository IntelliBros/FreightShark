import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { PackageIcon, TruckIcon, ClockIcon, CheckCircleIcon, DollarSignIcon, MapPinIcon, CalendarIcon, CopyIcon, ExternalLinkIcon, ImageIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { sampleShipmentService, type SampleShipmentRequest } from '../../services/sampleShipmentService';
import { sampleService } from '../../services/sampleService';

export const SampleShipments = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [shipmentRequests, setShipmentRequests] = useState<SampleShipmentRequest[]>([]);
  const [sampleDetails, setSampleDetails] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<SampleShipmentRequest | null>(null);

  useEffect(() => {
    if (user) {
      loadShipmentRequests();
    }
  }, [user]);

  const loadShipmentRequests = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const requests = await sampleShipmentService.getUserShipmentRequests(user.id);
      setShipmentRequests(requests);

      // Load sample details for all requests
      const allSampleIds = requests.flatMap(r => r.sample_ids);
      const uniqueSampleIds = [...new Set(allSampleIds)];

      const details: Record<string, any> = {};
      for (const sampleId of uniqueSampleIds) {
        const sample = await sampleService.getSampleById(sampleId);
        if (sample) {
          details[sampleId] = sample;
        }
      }
      setSampleDetails(details);
    } catch (error) {
      console.error('Error loading shipment requests:', error);
      addToast('Failed to load shipment requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      addToast(`${label} copied to clipboard`, 'success');
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'payment_pending':
        return 'info';
      case 'paid':
        return 'success';
      case 'shipped':
        return 'primary';
      case 'delivered':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="w-4 h-4" />;
      case 'payment_pending':
        return <DollarSignIcon className="w-4 h-4" />;
      case 'paid':
        return <CheckCircleIcon className="w-4 h-4" />;
      case 'shipped':
        return <TruckIcon className="w-4 h-4" />;
      case 'delivered':
        return <CheckCircleIcon className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00b4d8] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading shipment requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Sample Shipments</h1>
        <p className="text-gray-600 mt-1">Track your sample shipment requests</p>
      </div>

      {shipmentRequests.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <PackageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">No Shipment Requests</h3>
            <p className="text-gray-500">You haven't created any sample shipment requests yet.</p>
            <p className="text-gray-500 mt-2">Go to the Sample Consolidation page to request shipments for your warehouse samples.</p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6">
          {shipmentRequests.map((request) => (
            <Card key={request.id}>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Request {request.id}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      <CalendarIcon className="inline w-3 h-3 mr-1" />
                      Created {new Date(request.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={getStatusColor(request.status)}>
                    {getStatusIcon(request.status)}
                    <span className="ml-1">{formatStatus(request.status)}</span>
                  </Badge>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Delivery Address</p>
                    <p className="text-sm text-gray-600">{request.delivery_address}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Quantity</p>
                    <p className="text-sm text-gray-600">{request.quantity} sample(s)</p>
                  </div>
                </div>

                {request.payment_link && request.status === 'payment_pending' && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-900 mb-2">Payment Required</p>
                    <a
                      href={request.payment_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLinkIcon className="w-4 h-4 mr-1" />
                      Click here to complete payment
                    </a>
                  </div>
                )}

                {request.tracking_number && (
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700 mb-1">Tracking Number</p>
                      <div className="flex items-center gap-2">
                        <a
                          href={`https://t.17track.net/en#nums=${request.tracking_number}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm bg-gray-100 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
                        >
                          <TruckIcon className="w-3 h-3" />
                          <span className="font-mono">{request.tracking_number}</span>
                          <ExternalLinkIcon className="w-3 h-3" />
                        </a>
                        <button
                          onClick={() => copyToClipboard(request.tracking_number!, 'Tracking number')}
                          className="text-gray-500 hover:text-gray-700"
                          title="Copy tracking number"
                        >
                          <CopyIcon className="w-4 h-4" />
                        </button>
                      </div>
                      {request.shipped_at && (
                        <p className="text-xs text-gray-500 mt-1">
                          Shipped on {new Date(request.shipped_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    {request.package_photo && (
                      <div className="flex-shrink-0">
                        <img
                          src={request.package_photo}
                          alt="Package"
                          className="w-20 h-20 object-cover rounded-lg shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => {
                            const modal = document.createElement('div');
                            modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
                            modal.onclick = () => modal.remove();
                            modal.innerHTML = `
                              <img src="${request.package_photo}" class="max-w-[90%] max-h-[90%] rounded-lg" />
                            `;
                            document.body.appendChild(modal);
                          }}
                          title="Click to enlarge"
                        />
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <button
                    onClick={() => setSelectedRequest(selectedRequest?.id === request.id ? null : request)}
                    className="text-sm text-[#00b4d8] hover:text-[#0096b8] font-medium"
                  >
                    {selectedRequest?.id === request.id ? 'Hide' : 'View'} Sample Details
                  </button>
                </div>

                {selectedRequest?.id === request.id && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Included Samples</h4>
                    <div className="space-y-2">
                      {request.sample_ids.map((sampleId) => {
                        const sample = sampleDetails[sampleId];
                        return (
                          <div key={sampleId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {sample?.product_name || 'Unknown Product'}
                              </p>
                              <p className="text-xs text-gray-500">
                                Sample ID: {sampleId}
                              </p>
                            </div>
                            <Badge variant="default">
                              {sample?.status || 'Unknown'}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};