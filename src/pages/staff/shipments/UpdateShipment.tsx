import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { SearchIcon, UploadIcon, SaveIcon, PackageIcon, MapPinIcon, FileTextIcon, TrashIcon } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { useData } from '../../../context/DataContext';
import { DataService } from '../../../services/DataService';

// Shipment statuses
const WAREHOUSE_STATUSES = [
  { value: 'awaiting-pickup', label: 'Awaiting Pickup' },
  { value: 'picked-up', label: 'Picked Up' },
  { value: 'in-transit', label: 'In Transit' },
  { value: 'customs-clearance', label: 'Customs Clearance' },
  { value: 'customs-cleared', label: 'Customs Cleared' },
  { value: 'out-for-delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'exception', label: 'Exception' }
];

interface WarehouseUpdate {
  warehouseId: string;
  soNumber: string;
  status: string;
  documents: File[];
}

export const UpdateShipment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();
  const { shipments, refreshData } = useData();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShipments, setSelectedShipments] = useState<string[]>([]);
  const [warehouseUpdates, setWarehouseUpdates] = useState<Record<string, Record<string, WarehouseUpdate>>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Get shipment ID from URL query params if provided
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const shipmentId = searchParams.get('id');
    if (shipmentId) {
      setSearchTerm(shipmentId);
      setSelectedShipments([shipmentId]);
    }
  }, [location]);

  // Filter shipments based on search
  const filteredShipments = shipments.filter(shipment => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      shipment.id.toLowerCase().includes(searchLower) ||
      shipment.customer?.company?.toLowerCase().includes(searchLower) ||
      shipment.customer?.name?.toLowerCase().includes(searchLower) ||
      shipment.destinations?.some((d: any) => 
        d.fbaWarehouse.toLowerCase().includes(searchLower) ||
        d.amazonShipmentId?.toLowerCase().includes(searchLower)
      )
    );
  });

  // Initialize warehouse updates when shipments change
  useEffect(() => {
    const updates: Record<string, Record<string, WarehouseUpdate>> = {};
    
    filteredShipments.forEach(shipment => {
      if (!updates[shipment.id]) {
        updates[shipment.id] = {};
      }
      
      shipment.destinations?.forEach((dest: any) => {
        if (!updates[shipment.id][dest.id]) {
          updates[shipment.id][dest.id] = {
            warehouseId: dest.id,
            soNumber: dest.soNumber || '',
            status: shipment.status || 'awaiting-pickup',
            documents: []
          };
        }
      });
    });
    
    setWarehouseUpdates(prevUpdates => {
      // Merge with existing updates to preserve user input
      const merged = { ...updates };
      Object.keys(prevUpdates).forEach(shipmentId => {
        if (merged[shipmentId]) {
          Object.keys(prevUpdates[shipmentId]).forEach(warehouseId => {
            if (merged[shipmentId][warehouseId]) {
              merged[shipmentId][warehouseId] = {
                ...merged[shipmentId][warehouseId],
                ...prevUpdates[shipmentId][warehouseId]
              };
            }
          });
        }
      });
      return merged;
    });
  }, [filteredShipments]);

  const handleWarehouseUpdate = (
    shipmentId: string, 
    warehouseId: string, 
    field: keyof WarehouseUpdate, 
    value: any
  ) => {
    setWarehouseUpdates(prev => ({
      ...prev,
      [shipmentId]: {
        ...prev[shipmentId],
        [warehouseId]: {
          ...prev[shipmentId][warehouseId],
          [field]: value
        }
      }
    }));
  };

  const handleFileUpload = (shipmentId: string, warehouseId: string, files: FileList | null) => {
    if (files) {
      const fileArray = Array.from(files);
      handleWarehouseUpdate(shipmentId, warehouseId, 'documents', fileArray);
    }
  };

  const toggleShipmentSelection = (shipmentId: string) => {
    setSelectedShipments(prev => 
      prev.includes(shipmentId) 
        ? prev.filter(id => id !== shipmentId)
        : [...prev, shipmentId]
    );
  };

  const handleSubmit = async () => {
    if (selectedShipments.length === 0) {
      addToast('Please select at least one shipment to update', 'error');
      return;
    }

    setIsLoading(true);
    try {
      // Get current user for document uploads
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const userId = currentUser.id || 'STAFF-001';
      
      // Process updates for each selected shipment
      for (const shipmentId of selectedShipments) {
        const shipment = shipments.find(s => s.id === shipmentId);
        if (!shipment) continue;

        const updates = warehouseUpdates[shipmentId];
        if (!updates) continue;

        // Update each warehouse
        for (const warehouseId of Object.keys(updates)) {
          const update = updates[warehouseId];
          const warehouse = shipment.destinations.find((d: any) => d.id === warehouseId);
          
          // Update SO number if provided
          if (update.soNumber && update.soNumber !== warehouse?.soNumber) {
            await DataService.updateWarehouseSoNumber(shipmentId, warehouseId, update.soNumber);
            
            // Add tracking event for SO number update
            await DataService.addTrackingEvent(shipmentId, {
              date: new Date().toISOString(),
              status: 'SO Number Updated',
              location: 'System',
              description: `SO number updated to ${update.soNumber} for ${warehouse?.fbaWarehouse}`
            });
          }

          // Add tracking event for status change
          if (update.status && update.status !== shipment.status) {
            await DataService.addTrackingEvent(shipmentId, {
              date: new Date().toISOString(),
              status: update.status,
              location: 'System Update',
              description: `Status updated to ${update.status} for ${warehouse?.fbaWarehouse}`
            });
            
            // Update the shipment status
            await DataService.updateShipment(shipmentId, { status: update.status });
          }

          // Handle document uploads
          if (update.documents.length > 0) {
            for (const file of update.documents) {
              await DataService.addDocumentToShipment(shipmentId, {
                name: file.name,
                type: file.type,
                size: file.size,
                warehouseId: warehouseId,
                uploadedBy: userId
              });
            }
            
            // Add tracking event for document upload
            await DataService.addTrackingEvent(shipmentId, {
              date: new Date().toISOString(),
              status: 'Documents Uploaded',
              location: 'System',
              description: `${update.documents.length} document(s) uploaded for ${warehouse?.fbaWarehouse}`
            });
          }
        }
      }

      await refreshData();
      addToast(`Successfully updated ${selectedShipments.length} shipment(s)`, 'success');
      
      // Clear selections and reset warehouse updates
      setSelectedShipments([]);
      setSearchTerm('');
      setWarehouseUpdates({});
    } catch (error) {
      console.error('Error updating shipments:', error);
      addToast('Failed to update shipments. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Update Shipment Status</h1>
        <p className="text-gray-600 mt-1">
          Update SO numbers, upload documents, and change status for multiple shipments and warehouses
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Search by shipment ID, customer, or warehouse..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Selected Count and Actions */}
      {selectedShipments.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
          <span className="text-sm text-blue-700">
            {selectedShipments.length} shipment(s) selected
          </span>
          <Button 
            variant="primary" 
            size="sm"
            onClick={handleSubmit}
            isLoading={isLoading}
          >
            <SaveIcon className="h-4 w-4 mr-1" />
            Save All Updates
          </Button>
        </div>
      )}

      {/* Shipment Cards */}
      <div className="space-y-6">
        {filteredShipments.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <PackageIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-gray-500 mb-1">No shipments found</h3>
              <p className="text-sm text-gray-400">Try adjusting your search criteria</p>
            </div>
          </Card>
        ) : (
          filteredShipments.map(shipment => (
            <Card key={shipment.id} className={`${selectedShipments.includes(shipment.id) ? 'ring-2 ring-blue-500' : ''}`}>
              {/* Shipment Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={selectedShipments.includes(shipment.id)}
                    onChange={() => toggleShipmentSelection(shipment.id)}
                  />
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-medium text-gray-900">
                      {shipment.id}
                    </h3>
                    <span className="text-sm text-gray-500">
                      {shipment.customer?.company || 'Unknown Company'} • {shipment.customer?.name}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="info" className="text-xs">{shipment.status}</Badge>
                  <span className="text-xs text-gray-400">
                    Created: {new Date(shipment.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Warehouse Lines */}
              <div className="border-t border-gray-200 pt-3">
                <div className="space-y-2">
                  {shipment.destinations?.map((warehouse: any) => {
                    const update = warehouseUpdates[shipment.id]?.[warehouse.id];
                    return (
                      <div key={warehouse.id} className="bg-gray-50 rounded-lg p-2">
                        <div className="flex items-center gap-3">
                          {/* Warehouse Info */}
                          <div className="flex items-center min-w-[200px]">
                            <MapPinIcon className="h-3 w-3 text-gray-400 mr-1" />
                            <span className="font-medium text-xs text-gray-900">
                              {warehouse.fbaWarehouse}
                            </span>
                            {warehouse.amazonShipmentId && (
                              <span className="ml-2 text-xs text-gray-500">
                                ID: {warehouse.amazonShipmentId}
                              </span>
                            )}
                            {warehouse.amazonReferenceId && (
                              <span className="ml-2 text-xs text-gray-400">
                                Ref: {warehouse.amazonReferenceId}
                              </span>
                            )}
                          </div>
                          
                          {/* SO Number */}
                          <div className="flex-1">
                            <input
                              type="text"
                              className="block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="SO Number"
                              value={update?.soNumber || ''}
                              onChange={(e) => handleWarehouseUpdate(
                                shipment.id, 
                                warehouse.id, 
                                'soNumber', 
                                e.target.value
                              )}
                            />
                          </div>

                          {/* Status */}
                          <div className="flex-1">
                            <select
                              className="block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              value={update?.status || 'awaiting-pickup'}
                              onChange={(e) => handleWarehouseUpdate(
                                shipment.id, 
                                warehouse.id, 
                                'status', 
                                e.target.value
                              )}
                            >
                              {WAREHOUSE_STATUSES.map(status => (
                                <option key={status.value} value={status.value}>
                                  {status.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Documents */}
                          <div className="flex-1">
                            <div className="flex items-center">
                              <label className="flex items-center justify-center w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 bg-white text-xs text-gray-700 hover:bg-gray-50 cursor-pointer">
                                <UploadIcon className="h-3 w-3 mr-1" />
                                {update?.documents?.length > 0 
                                  ? `${update.documents.length} file(s)` 
                                  : 'Upload'}
                                <input
                                  type="file"
                                  className="hidden"
                                  multiple
                                  onChange={(e) => handleFileUpload(
                                    shipment.id, 
                                    warehouse.id, 
                                    e.target.files
                                  )}
                                />
                              </label>
                              {update?.documents?.length > 0 && (
                                <button
                                  className="ml-1 text-red-500 hover:text-red-700"
                                  onClick={() => handleWarehouseUpdate(
                                    shipment.id, 
                                    warehouse.id, 
                                    'documents', 
                                    []
                                  )}
                                >
                                  <TrashIcon className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Floating Save Button */}
      {selectedShipments.length > 0 && (
        <div className="fixed bottom-6 right-6">
          <Button 
            variant="primary" 
            onClick={handleSubmit}
            isLoading={isLoading}
            className="shadow-lg"
          >
            <SaveIcon className="h-5 w-5 mr-2" />
            Save {selectedShipments.length} Shipment(s)
          </Button>
        </div>
      )}
    </div>
  );
};