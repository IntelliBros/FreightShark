import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { TruckIcon, SearchIcon, FilterIcon, ChevronDownIcon, ClockIcon, MapPinIcon, ArrowRightIcon } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { DataService } from '../../../services/DataService';

export const ActiveShipments = () => {
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { shipments, quoteRequests } = useData();
  const [users, setUsers] = useState<any[]>([]);

  // Fetch users on mount
  React.useEffect(() => {
    DataService.getUsers().then(setUsers);
  }, []);

  // Transform shipments to match the display format
  const activeShipments = useMemo(() => {
    return shipments
      .filter(shipment => 
        shipment.status !== 'Delivered' && 
        shipment.status !== 'Cancelled' // Show all non-delivered, non-cancelled shipments
      )
      .map(shipment => {
        // Find the customer
        const customer = users.find(u => u.id === shipment.customerId);
        
        // Find the related quote request for supplier details
        const quoteRequest = quoteRequests.find(req => 
          req.customerId === shipment.customerId && 
          req.status === 'Quote Accepted'
        );
        
        // Get first destination for display
        const firstDest = shipment.destinations && shipment.destinations.length > 0 
          ? shipment.destinations[0] 
          : null;
        
        // Check if missing shipment IDs
        const missingShipmentIds = shipment.invoice?.status === 'Paid' && 
          shipment.destinations?.some((d: any) => !d.amazonShipmentId || d.amazonShipmentId === '');
        
        // Calculate progress based on status
        // Status flow: Waiting for Pickup (5%) -> Final Invoice Ready (5%) -> Missing Shipment IDs (10%) -> In Progress (40%) -> Delivered (40%)
        let progress = 0;

        // Stage 1: Waiting for Pickup (5%)
        if (shipment.status === 'Awaiting Pickup') {
          progress = 5;
        }

        // Stage 2: Final Invoice Ready (5%, cumulative: 10%)
        if (shipment.invoice) {
          progress = 10;
        }

        // Stage 3: Invoice Paid but Missing Shipment IDs (10%, cumulative: 20%)
        if (shipment.invoice?.status === 'Paid' && missingShipmentIds) {
          progress = 20;
        }

        // Stage 4: In Progress - IDs provided (40%, cumulative: 60%)
        if (shipment.invoice?.status === 'Paid' &&
            shipment.destinations?.every((d: any) => d.amazonShipmentId && d.amazonShipmentId !== '')) {
          // IDs provided, shipment is now in progress
          if (shipment.status === 'Delivered') {
            progress = 100; // Stage 5: Delivered (40%, cumulative: 100%)
          } else {
            // Any non-delivered status with payment and IDs means "In Progress"
            progress = 60;
          }
        }

        // Override for delivered status regardless of other conditions
        if (shipment.status === 'Delivered') {
          progress = 100;
        }
        
        // Get latest tracking event
        const latestEvent = shipment.trackingEvents && shipment.trackingEvents.length > 0
          ? shipment.trackingEvents[shipment.trackingEvents.length - 1]
          : null;
        
        // Get tracking numbers from SO numbers
        const soNumbers = shipment.destinations
          .map((d: any) => d.soNumber)
          .filter((so: string) => so && so !== '');
        const trackingNumber = soNumbers.length > 0 
          ? soNumbers.join(', ')
          : 'Pending';
        
        return {
          id: shipment.id,
          customer: {
            name: customer?.company || 'Unknown Company',
            email: customer?.email || 'unknown@example.com'
          },
          status: (() => {
            // Determine status based on the new flow
            if (shipment.status === 'Delivered') {
              return 'Delivered';
            }
            if (shipment.invoice?.status === 'Paid' && missingShipmentIds) {
              return 'Missing Shipment IDs';
            }
            if (shipment.invoice?.status === 'Paid' &&
                shipment.destinations?.every((d: any) => d.amazonShipmentId && d.amazonShipmentId !== '')) {
              return 'In Progress';
            }
            if (shipment.invoice) {
              return 'Final Invoice Ready';
            }
            if (shipment.status === 'Awaiting Pickup') {
              return 'Waiting for Pickup';
            }
            return shipment.status;
          })(),
          rawShipment: shipment,
          origin: quoteRequest?.supplierDetails?.city
            ? `${quoteRequest.supplierDetails.city}, ${quoteRequest.supplierDetails.country}`
            : 'China',
          destination: firstDest ? `${firstDest.fbaWarehouse}, USA` : 'USA',
          trackingNumber,
          progress,
          statusDate: (() => {
            // Get the appropriate date based on current status
            if (shipment.status === 'Delivered' && shipment.deliveredAt) {
              return `Delivered: ${new Date(shipment.deliveredAt).toLocaleDateString()}`;
            }
            if (shipment.invoice?.status === 'Paid' &&
                shipment.destinations?.every((d: any) => d.amazonShipmentId && d.amazonShipmentId !== '')) {
              // In Progress - show when IDs were provided
              return `In Progress: ${shipment.invoice?.paidAt ? new Date(shipment.invoice.paidAt).toLocaleDateString() : 'Date pending'}`;
            }
            if (shipment.invoice?.status === 'Paid' && missingShipmentIds) {
              // Missing Shipment IDs - show when invoice was paid
              return `Invoice Paid: ${shipment.invoice?.paidAt ? new Date(shipment.invoice.paidAt).toLocaleDateString() : 'Date pending'}`;
            }
            if (shipment.invoice) {
              // Final Invoice Ready - show when invoice was generated
              return `Invoice Generated: ${shipment.invoice?.createdAt ? new Date(shipment.invoice.createdAt).toLocaleDateString() : 'Date pending'}`;
            }
            // Waiting for Pickup - show when shipment was created
            return `Booking Confirmed: ${shipment.createdAt || shipment.created_at ? new Date(shipment.createdAt || shipment.created_at).toLocaleDateString() : 'Date pending'}`;
          })(),
          lastActivity: latestEvent && latestEvent.description
            ? latestEvent.description
            : 'Awaiting updates',
          totalCartons: shipment.masterCargo?.actualCartons ||
                       shipment.destinations?.reduce((sum, d) => sum + (d.actualCartons || d.cartons || 0), 0) || 0,
          totalWeight: shipment.masterCargo?.actualWeight ||
                      shipment.destinations?.reduce((sum, d) => sum + (d.actualWeight || d.weight || d.estimatedWeight || 0), 0) || 0
        };
      });
  }, [shipments, quoteRequests, users]);

  const filteredShipments = activeShipments.filter(shipment => {
    if (searchTerm === '') return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      shipment.id.toLowerCase().includes(searchLower) || 
      shipment.customer.name.toLowerCase().includes(searchLower) || 
      shipment.destination.toLowerCase().includes(searchLower) || 
      shipment.origin.toLowerCase().includes(searchLower) || 
      shipment.trackingNumber.toLowerCase().includes(searchLower)
    );
  });
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Waiting for Pickup':
      case 'Awaiting Pickup':
        return <Badge variant="warning">Waiting for Pickup</Badge>;
      case 'Final Invoice Ready':
        return <Badge variant="secondary">Final Invoice Ready</Badge>;
      case 'Missing Shipment IDs':
        return <Badge variant="error">{status}</Badge>;
      case 'In Progress':
      case 'In Transit':
      case 'Customs':
      case 'Customs Clearance':
        return <Badge variant="info">In Progress</Badge>;
      case 'Delivered':
      case 'Out for Delivery':
        return <Badge variant="success">Delivered</Badge>;
      case 'Booking Confirmed':
        return <Badge variant="secondary">Booking Confirmed</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };
  return <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Active Shipments</h1>
          <p className="text-gray-600 mt-1">
            Monitor and manage shipments currently in progress
          </p>
        </div>
      </div>
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative flex-grow max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input type="text" className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="Search by ID, customer, destination..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setFilterOpen(!filterOpen)} className="flex items-center">
              <FilterIcon className="h-4 w-4 mr-1" />
              Filter
              <ChevronDownIcon className={`h-4 w-4 ml-1 transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
            </Button>
          </div>
        </div>
        {filterOpen && <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <div className="space-y-2">
                  {['Awaiting Pickup', 'In Transit', 'Customs Clearance', 'Out for Delivery'].map(status => <label key={status} className="flex items-center">
                      <input type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                      <span className="ml-2 text-sm text-gray-700">
                        {status}
                      </span>
                    </label>)}
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
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="tertiary" className="mr-2">
                Reset Filters
              </Button>
              <Button variant="primary">Apply Filters</Button>
            </div>
          </div>}
      </Card>
      <div className="space-y-4">
        {filteredShipments.length > 0 ? filteredShipments.map(shipment => <div key={shipment.id} className="bg-white border border-gray-200 hover:border-blue-300 rounded-lg shadow-sm transition p-5">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                <div className="lg:col-span-2">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-3">
                      <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <TruckIcon className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center">
                        <h3 className="text-lg font-medium text-gray-900 mr-2">
                          {shipment.id}
                        </h3>
                        {getStatusBadge(shipment.status)}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {shipment.customer.name} • {shipment.customer.email}
                      </p>
                      <div className="mt-2 text-sm text-gray-700 flex items-center">
                        <MapPinIcon className="h-3 w-3 text-gray-500 mr-1" />
                        <span>
                          {shipment.origin} → {shipment.destination}
                        </span>
                      </div>
                      {shipment.trackingNumber !== 'Pending' && (
                        <div className="mt-1 text-sm text-gray-700">
                          <span className="text-gray-500">Tracking:</span>{' '}
                          <span className="text-xs text-blue-600 hover:underline cursor-pointer">
                            {shipment.trackingNumber}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-2">
                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500">Progress</span>
                      <span className="text-gray-700">
                        {shipment.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{
                  width: `${shipment.progress}%`
                }}></div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-700">
                    <div className="flex items-center mb-1">
                      <ClockIcon className="h-3 w-3 text-gray-500 mr-1" />
                      <span>{shipment.statusDate}</span>
                    </div>
                    <div className="text-xs text-gray-600 mt-2 italic">
                      Last activity: {shipment.lastActivity}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-sm">
                    <div className="mb-2">
                      <span className="text-gray-500 block">Cartons:</span>
                      <span className="text-gray-900">
                        {shipment.totalCartons}
                      </span>
                    </div>
                    <div className="mb-4">
                      <span className="text-gray-500 block">Weight:</span>
                      <span className="text-gray-900">
                        {shipment.totalWeight} kg
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Link to={`/staff/shipments/${shipment.id}`}>
                      <Button variant="primary" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>) : <Card>
            <div className="text-center py-12">
              <TruckIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                No active shipments found
              </h3>
              <p className="text-gray-500 mb-4">
                No shipments match your search criteria
              </p>
              <Button variant="primary" onClick={() => setSearchTerm('')}>
                Clear Search
              </Button>
            </div>
          </Card>}
      </div>
    </div>;
};