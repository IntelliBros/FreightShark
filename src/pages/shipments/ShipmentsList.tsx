import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { TruckIcon, SearchIcon, FilterIcon, ChevronDownIcon, ClockIcon, MapPinIcon, PackageIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

export const ShipmentsList = () => {
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();
  const { shipments, refreshData } = useData();
  
  // Refresh data when component mounts to get latest shipments
  useEffect(() => {
    refreshData();
  }, []);
  
  // Filter shipments for current customer
  const customerShipments = shipments.filter(s => s.customerId === user?.id);

  const filteredShipments = customerShipments.filter(shipment => {
    if (searchTerm === '') return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      shipment.id.toLowerCase().includes(searchLower) ||
      shipment.status.toLowerCase().includes(searchLower) ||
      shipment.destinations.some(d => 
        d.fbaWarehouse.toLowerCase().includes(searchLower) ||
        d.amazonShipmentId.toLowerCase().includes(searchLower)
      )
    );
  });

  const getStatusBadge = (shipment: any) => {
    // Check if invoice is paid but IDs are missing
    if (shipment.invoice?.status === 'Paid' && 
        shipment.destinations?.some((d: any) => !d.amazonShipmentId || d.amazonShipmentId === '')) {
      return <Badge variant="error">Missing Shipment IDs</Badge>;
    }
    
    // If invoice is paid and all IDs are provided, show In Progress
    if (shipment.invoice?.status === 'Paid' && 
        shipment.destinations?.every((d: any) => d.amazonShipmentId && d.amazonShipmentId !== '')) {
      return <Badge variant="info">In Progress</Badge>;
    }
    
    const status = shipment.status;
    switch (status) {
      case 'Awaiting Pickup':
        return <Badge variant="warning">Waiting for Pickup</Badge>;
      case 'In Transit':
      case 'Customs':
        return <Badge variant="info">In Progress</Badge>;
      case 'Delivered':
        return <Badge variant="success">Delivered</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const getProgressPercentage = (shipment: any) => {
    // Status flow: Waiting for Pickup (20%) -> Invoice Payment (10%) -> Shipment IDs (10%) -> In Progress (40%) -> Delivered (20%)
    
    // If invoice not paid yet
    if (shipment.invoice?.status !== 'Paid') {
      if (shipment.status === 'Awaiting Pickup') {
        return 20; // Waiting for Pickup only
      }
      return 0;
    }
    
    // If invoice is paid but missing shipment IDs
    if (shipment.invoice?.status === 'Paid' && 
        shipment.destinations?.some((d: any) => !d.amazonShipmentId || d.amazonShipmentId === '')) {
      return 30; // Waiting (20%) + Payment (10%)
    }
    
    // If invoice is paid and all IDs are provided - this means shipment is at least "In Progress"
    if (shipment.invoice?.status === 'Paid' && 
        shipment.destinations?.every((d: any) => d.amazonShipmentId && d.amazonShipmentId !== '')) {
      // Check actual shipment status
      switch (shipment.status) {
        case 'Delivered':
          return 100; // All complete
        case 'Awaiting Pickup':
          // If still awaiting pickup but has IDs, just completed ID step
          return 40; // Waiting (20%) + Payment (10%) + IDs (10%)
        default:
          // Any other status with payment and IDs means "In Progress"
          // This includes 'In Transit', 'Customs', or any intermediate status
          return 80; // Waiting (20%) + Payment (10%) + IDs (10%) + In Progress (40%)
      }
    }
    
    // Fallback based on status only (shouldn't reach here often)
    const status = shipment.status;
    switch (status) {
      case 'Awaiting Pickup':
        return 20;
      case 'In Transit':
      case 'Customs':
        return 80;
      case 'Delivered':
        return 100;
      default:
        return 0;
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Shipments</h1>
        <p className="text-gray-600 mt-1">
          Track and manage all your active and completed shipments
        </p>
      </div>

      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative flex-grow max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Search by ID, destination, Amazon shipment ID..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => setFilterOpen(!filterOpen)}
              className="flex items-center"
            >
              <FilterIcon className="h-4 w-4 mr-1" />
              Filter
              <ChevronDownIcon
                className={`h-4 w-4 ml-1 transition-transform ${
                  filterOpen ? 'rotate-180' : ''
                }`}
              />
            </Button>
          </div>
        </div>

        {filterOpen && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <div className="space-y-2">
                  {['Awaiting Pickup', 'In Transit', 'Customs', 'Delivered'].map(
                    status => (
                      <label key={status} className="flex items-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          {status}
                        </span>
                      </label>
                    )
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Destination
                </label>
                <select className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                  <option value="">All Destinations</option>
                  <option>FBA ONT8</option>
                  <option>FBA BFI4</option>
                  <option>FBA MDW2</option>
                  <option>FBA ATL6</option>
                  <option>FBA DFW7</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date Range
                </label>
                <select className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                  <option value="">All Time</option>
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                  <option>Last 90 days</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="tertiary" className="mr-2">
                Reset Filters
              </Button>
              <Button variant="primary">Apply Filters</Button>
            </div>
          </div>
        )}
      </Card>

      <div className="space-y-4">
        {filteredShipments.length > 0 ? (
          filteredShipments.map(shipment => (
            <div
              key={shipment.id}
              className="bg-white border border-gray-200 hover:border-blue-300 rounded-lg shadow-sm transition p-5"
            >
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                <div className="lg:col-span-2">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-3">
                      <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <TruckIcon className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center">
                        <h3 className="text-lg font-medium text-gray-900 mr-2">
                          {shipment.id}
                        </h3>
                        {getStatusBadge(shipment)}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Quote ID: {shipment.quoteId}
                      </p>
                      <div className="mt-2 text-sm text-gray-700">
                        <span className="font-medium">Destinations:</span>
                        <div className="mt-1 space-y-1">
                          {shipment.destinations.map(dest => (
                            <div key={dest.id} className="flex items-center text-xs">
                              <MapPinIcon className="h-3 w-3 text-gray-400 mr-1" />
                              {dest.fbaWarehouse} - {dest.amazonShipmentId}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500">Progress</span>
                      <span className="text-gray-700">
                        {getProgressPercentage(shipment)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${getProgressPercentage(shipment)}%`
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-700">
                    <div className="flex items-center mb-1">
                      <ClockIcon className="h-3 w-3 text-gray-500 mr-1" />
                      <span>Created: {new Date(shipment.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center mb-1">
                      <ClockIcon className="h-3 w-3 text-gray-500 mr-1" />
                      <span>Est. Delivery: {new Date(shipment.estimatedDelivery).toLocaleDateString()}</span>
                    </div>
                    {shipment.trackingEvents && shipment.trackingEvents.length > 0 && (
                      <div className="text-xs text-gray-600 mt-2 italic">
                        Last update: {shipment.trackingEvents[shipment.trackingEvents.length - 1].description}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-sm mb-4">
                    <div className="mb-2">
                      <span className="text-gray-500 block">Total Cartons:</span>
                      <span className="text-gray-900 font-medium">
                        {shipment.destinations.reduce((sum, d) => sum + (d.cartons || 0), 0)}
                      </span>
                    </div>
                    <div className="mb-2">
                      <span className="text-gray-500 block">Est. Weight:</span>
                      <span className="text-gray-900 font-medium">
                        {shipment.destinations.reduce((sum, d) => sum + (d.estimatedWeight || 0), 0)} kg
                      </span>
                    </div>
                    <div className="mb-2">
                      <span className="text-gray-500 block">Est. Total:</span>
                      <span className="text-gray-900 font-medium">
                        ${shipment.estimatedTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <Link to={`/shipments/${shipment.id}`}>
                    <Button variant="primary" size="sm" className="w-full">
                      View Details
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))
        ) : (
          <Card>
            <div className="text-center py-12">
              <PackageIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                No shipments found
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm
                  ? 'No shipments match your search criteria'
                  : "You don't have any shipments yet"}
              </p>
              {searchTerm && (
                <Button variant="primary" onClick={() => setSearchTerm('')}>
                  Clear Search
                </Button>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};