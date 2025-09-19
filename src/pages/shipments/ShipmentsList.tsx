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
    // First check if all destinations are delivered
    if (shipment.destinations?.length > 0 &&
        shipment.destinations.every((d: any) => d.deliveryStatus === 'delivered')) {
      return <Badge variant="success">Delivered</Badge>;
    }

    // Check if overall shipment status is Delivered
    if (shipment.status === 'Delivered' || shipment.status === 'delivered') {
      return <Badge variant="success">Delivered</Badge>;
    }

    // Check if invoice is paid but IDs are missing - this takes priority
    // Check both destinations array and invoice warehouseDetails
    if (shipment.invoice?.status === 'Paid') {
      // Check if IDs are missing in destinations or in invoice warehouseDetails
      const destinationsHaveMissingIds = shipment.destinations?.length > 0
        ? shipment.destinations.some((d: any) => !d.amazonShipmentId || d.amazonShipmentId === '')
        : false;

      const warehouseDetailsHaveMissingIds = shipment.invoice?.warehouseDetails?.length > 0
        ? shipment.invoice.warehouseDetails.some((w: any) => !w.amazonShipmentId || w.amazonShipmentId === '')
        : false;

      // If either source shows missing IDs, display the error badge
      if (destinationsHaveMissingIds || warehouseDetailsHaveMissingIds) {
        return <Badge variant="error">Missing Shipment IDs</Badge>;
      }
    }

    // Check the status from database
    const status = shipment.status;
    
    // Handle "In Progress" status - but only if all IDs are provided when invoice is paid
    if (status === 'In Progress') {
      // If invoice is paid, check if IDs are provided
      if (shipment.invoice?.status === 'Paid') {
        if (shipment.destinations?.every((d: any) => d.amazonShipmentId && d.amazonShipmentId !== '')) {
          return <Badge variant="info">In Progress</Badge>;
        }
        // If we get here, some IDs are missing, which should have been caught above
        return <Badge variant="error">Missing Shipment IDs</Badge>;
      }
      // If no invoice or not paid, show In Progress
      return <Badge variant="info">In Progress</Badge>;
    }
    
    switch (status) {
      case 'Awaiting Pickup':
        return <Badge variant="warning">Waiting for Pickup</Badge>;
      case 'In Transit':
      case 'Customs':
        return <Badge variant="info">In Progress</Badge>;
      case 'Delivered':
        return <Badge variant="success">Delivered</Badge>;
      case 'Pending Payment':
        return <Badge variant="warning">Pending Payment</Badge>;
      case 'Booking Confirmed':
        return <Badge variant="default">Booking Confirmed</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const getProgressPercentage = (shipment: any) => {
    // First check if all destinations are delivered
    if (shipment.destinations?.length > 0 &&
        shipment.destinations.every((d: any) => d.deliveryStatus === 'delivered')) {
      return 100;
    }

    // Check if overall status is Delivered
    if (shipment.status === 'Delivered' || shipment.status === 'delivered') {
      return 100;
    }

    // Simplified progress based on status since invoices are created by staff
    const status = shipment.status;

    // If shipment has been created, it's at least at booking confirmed stage
    if (status === 'Booking Confirmed' || status === 'Awaiting Pickup') {
      return 20;
    }

    // Check if invoice exists and is paid
    if (shipment.invoice?.status === 'Paid') {
      // If paid but missing IDs
      if (shipment.destinations?.some((d: any) => !d.amazonShipmentId || d.amazonShipmentId === '')) {
        return 30;
      }
      // If paid and has IDs, check actual status
      if (status === 'In Transit' || status === 'Customs' || status === 'In Progress') {
        return 70;
      }
      if (status === 'Out for Delivery') {
        return 90;
      }
      return 40; // Paid but still waiting
    }

    // Status-based progress without invoice
    switch (status) {
      case 'In Transit':
      case 'Customs':
      case 'In Progress':
        return 50;
      case 'Out for Delivery':
        return 80;
      default:
        return 20; // Default for any shipment that exists
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
                      <span>Created: {shipment.createdAt ? new Date(shipment.createdAt).toLocaleDateString() : 'Date not available'}</span>
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
                        {(() => {
                          // Try to get cartons from multiple sources
                          let totalCartons = 0;

                          // First try destinations
                          if (shipment.destinations && shipment.destinations.length > 0) {
                            totalCartons = shipment.destinations.reduce((sum, d) =>
                              sum + (d.actualCartons || d.cartons || d.estimatedCartons || 0), 0);
                          }

                          // If still 0, try invoice warehouse details
                          if (totalCartons === 0 && shipment.invoice?.warehouseDetails) {
                            totalCartons = shipment.invoice.warehouseDetails.reduce((sum, w) =>
                              sum + (w.cartons || w.actualCartons || 0), 0);
                          }

                          // If still 0, try masterCargo
                          if (totalCartons === 0 && shipment.masterCargo) {
                            totalCartons = shipment.masterCargo.actualCartons ||
                                         shipment.masterCargo.estimatedCartonCount ||
                                         shipment.masterCargo.cartonCount || 0;
                          }

                          // If still 0, try cargoDetails
                          if (totalCartons === 0 && shipment.cargoDetails) {
                            totalCartons = shipment.cargoDetails.cartonCount ||
                                         shipment.cargoDetails.actualCartonCount || 0;
                          }

                          return totalCartons;
                        })()}
                      </span>
                    </div>
                    <div className="mb-2">
                      <span className="text-gray-500 block">Est. Weight:</span>
                      <span className="text-gray-900 font-medium">
                        {(() => {
                          // Try to get weight from multiple sources
                          let totalWeight = 0;

                          // First try destinations
                          if (shipment.destinations && shipment.destinations.length > 0) {
                            totalWeight = shipment.destinations.reduce((sum, d) =>
                              sum + (d.actualWeight || d.weight || d.estimatedWeight || d.grossWeight || 0), 0);
                          }

                          // If still 0, try invoice warehouse details
                          if (totalWeight === 0 && shipment.invoice?.warehouseDetails) {
                            totalWeight = shipment.invoice.warehouseDetails.reduce((sum, w) =>
                              sum + (w.actualWeight || w.weight || w.chargeableWeight || 0), 0);
                          }

                          // If still 0, try masterCargo
                          if (totalWeight === 0 && shipment.masterCargo) {
                            totalWeight = shipment.masterCargo.actualWeight ||
                                        shipment.masterCargo.grossWeight ||
                                        shipment.masterCargo.estimatedWeight || 0;
                          }

                          return totalWeight;
                        })()} kg
                      </span>
                    </div>
                    {(shipment.invoice?.amount || shipment.estimatedTotal) && (
                      <div className="mb-2">
                        <span className="text-gray-500 block">Est. Total:</span>
                        <span className="text-gray-900 font-medium">
                          ${(shipment.invoice?.amount || shipment.estimatedTotal || 0).toLocaleString()}
                        </span>
                      </div>
                    )}
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