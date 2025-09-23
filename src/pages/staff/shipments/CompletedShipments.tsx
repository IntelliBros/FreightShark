import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { TruckIcon, SearchIcon, FilterIcon, ChevronDownIcon, CheckCircleIcon, DownloadIcon, FileTextIcon } from 'lucide-react';
import { useData } from '../../context/DataContextV2';
import { DataService } from '../../../services/DataService';

// Mock completed shipments data (fallback only)
const MOCK_COMPLETED_SHIPMENTS = [{
  id: 'SH-1230',
  customer: {
    name: 'Acme Imports',
    email: 'john@acmeimports.com'
  },
  status: 'Delivered',
  origin: 'Guangzhou, CN',
  destination: 'FBA ONT8, CA, USA',
  carrier: 'DHL Express',
  trackingNumber: '1Z999AA10123456780',
  departureDate: '2023-10-15',
  deliveryDate: '2023-10-25',
  totalCartons: 22,
  totalWeight: 310,
  invoiceStatus: 'Paid',
  invoiceNumber: 'INV-5675'
}, {
  id: 'SH-1231',
  customer: {
    name: 'Global Traders Inc',
    email: 'lisa@globaltraders.com'
  },
  status: 'Delivered',
  origin: 'Shenzhen, CN',
  destination: 'FBA BFI4, WA, USA',
  carrier: 'UPS',
  trackingNumber: '1Z999AA10123456781',
  departureDate: '2023-10-18',
  deliveryDate: '2023-10-28',
  totalCartons: 15,
  totalWeight: 240,
  invoiceStatus: 'Paid',
  invoiceNumber: 'INV-5676'
}, {
  id: 'SH-1232',
  customer: {
    name: 'Prime Sellers LLC',
    email: 'mike@primesellers.com'
  },
  status: 'Delivered',
  origin: 'Yiwu, CN',
  destination: 'FBA ATL6, GA, USA',
  carrier: 'FedEx',
  trackingNumber: '1Z999AA10123456782',
  departureDate: '2023-10-20',
  deliveryDate: '2023-10-30',
  totalCartons: 28,
  totalWeight: 380,
  invoiceStatus: 'Pending',
  invoiceNumber: 'INV-5677'
}];
export const CompletedShipments = () => {
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { shipments, quoteRequests } = useData();
  const [users, setUsers] = useState<any[]>([]);

  // Fetch users on mount
  React.useEffect(() => {
    DataService.getUsers().then(setUsers);
  }, []);

  // Transform shipments data to match the display format
  const completedShipments = useMemo(() => {
    return shipments
      .filter(shipment => shipment.status === 'Delivered')
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

        // Get delivery date
        let deliveryDate = null;
        if (shipment.actual_delivery) {
          deliveryDate = new Date(shipment.actual_delivery).toLocaleDateString();
        } else if (shipment.destinations && shipment.destinations.length > 0) {
          // Check if all destinations are delivered
          const allDelivered = shipment.destinations.filter((d: any) => d.deliveredAt);
          if (allDelivered.length > 0) {
            // Get the latest delivery date
            deliveryDate = new Date(Math.max(...allDelivered.map((d: any) => new Date(d.deliveredAt).getTime()))).toLocaleDateString();
          }
        }

        // Get tracking numbers from SO numbers
        const soNumbers = shipment.destinations
          ?.map((d: any) => d.soNumber)
          .filter((so: string) => so && so !== '');
        const trackingNumber = soNumbers && soNumbers.length > 0
          ? soNumbers.join(', ')
          : 'N/A';

        // Get invoice status
        let invoiceStatus = 'Not Created';
        let invoiceNumber = '';
        if (shipment.invoice) {
          if (shipment.invoice.status === 'Paid') {
            invoiceStatus = 'Paid';
          } else if (shipment.invoice.id) {
            invoiceStatus = 'Pending';
          }
          invoiceNumber = shipment.invoice.id || shipment.invoice.invoiceNumber || '';
        }

        return {
          id: shipment.id,
          customer: {
            name: customer?.company || 'Unknown Company',
            email: customer?.email || 'unknown@example.com'
          },
          status: 'Delivered',
          origin: quoteRequest?.supplierDetails?.city
            ? `${quoteRequest.supplierDetails.city}, ${quoteRequest.supplierDetails.country}`
            : 'China',
          destination: firstDest ? `${firstDest.fbaWarehouse}, USA` : 'USA',
          carrier: 'DHL Express', // You might want to get this from actual data
          trackingNumber,
          departureDate: shipment.createdAt || shipment.created_at ? new Date(shipment.createdAt || shipment.created_at).toLocaleDateString() : 'N/A',
          deliveryDate: deliveryDate || 'N/A',
          totalCartons: shipment.masterCargo?.actualCartons ||
                       shipment.destinations?.reduce((sum, d) => sum + (d.actualCartons || d.cartons || 0), 0) || 0,
          totalWeight: shipment.masterCargo?.actualWeight ||
                      shipment.destinations?.reduce((sum, d) => sum + (d.actualWeight || d.weight || d.estimatedWeight || 0), 0) || 0,
          invoiceStatus,
          invoiceNumber
        };
      });
  }, [shipments, quoteRequests, users]);

  const filteredShipments = (completedShipments.length > 0 ? completedShipments : MOCK_COMPLETED_SHIPMENTS).filter(shipment => {
    if (searchTerm === '') return true;
    const searchLower = searchTerm.toLowerCase();
    return shipment.id.toLowerCase().includes(searchLower) || shipment.customer.name.toLowerCase().includes(searchLower) || shipment.destination.toLowerCase().includes(searchLower) || shipment.origin.toLowerCase().includes(searchLower) || shipment.trackingNumber.toLowerCase().includes(searchLower) || shipment.invoiceNumber.toLowerCase().includes(searchLower);
  });
  const getInvoiceStatusBadge = (status: string) => {
    switch (status) {
      case 'Paid':
        return <Badge variant="success">{status}</Badge>;
      case 'Pending':
        return <Badge variant="warning">{status}</Badge>;
      case 'Overdue':
        return <Badge variant="danger">{status}</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };
  return <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Completed Shipments
          </h1>
          <p className="text-gray-600 mt-1">
            View and manage shipments that have been delivered
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="secondary">
            <DownloadIcon className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Link to="/staff/shipments/active">
            <Button variant="primary">Active Shipments</Button>
          </Link>
        </div>
      </div>
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative flex-grow max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input type="text" className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="Search by ID, customer, destination, invoice..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date Range
                </label>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-gray-500">From</label>
                    <input type="date" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500">To</label>
                    <input type="date" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                  </div>
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
                  Invoice Status
                </label>
                <div className="space-y-2">
                  {['Paid', 'Pending', 'Overdue'].map(status => <label key={status} className="flex items-center">
                      <input type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                      <span className="ml-2 text-sm text-gray-700">
                        {status}
                      </span>
                    </label>)}
                </div>
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
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-2">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-3">
                      <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircleIcon className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center">
                        <h3 className="text-lg font-medium text-gray-900 mr-2">
                          {shipment.id}
                        </h3>
                        <Badge variant="success">Delivered</Badge>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {shipment.customer.name} • {shipment.customer.email}
                      </p>
                      <div className="mt-2 text-sm text-gray-700">
                        <span className="text-gray-500">Route:</span>{' '}
                        {shipment.origin} → {shipment.destination}
                      </div>
                      <div className="mt-1 text-sm text-gray-700">
                        <span className="text-gray-500">Carrier:</span>{' '}
                        {shipment.carrier} • {shipment.trackingNumber}
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-sm">
                    <div className="mb-2">
                      <span className="text-gray-500 block">Departed:</span>
                      <span className="text-gray-900">
                        {shipment.departureDate}
                      </span>
                    </div>
                    <div className="mb-2">
                      <span className="text-gray-500 block">Delivered:</span>
                      <span className="text-gray-900">
                        {shipment.deliveryDate}
                      </span>
                    </div>
                    <div className="mb-2">
                      <span className="text-gray-500 block">Cartons:</span>
                      <span className="text-gray-900">
                        {shipment.totalCartons}
                      </span>
                    </div>
                    <div className="mb-2">
                      <span className="text-gray-500 block">Weight:</span>
                      <span className="text-gray-900">
                        {shipment.totalWeight} kg
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-sm mb-4">
                    <div className="mb-2">
                      <span className="text-gray-500 block">Invoice:</span>
                      <div className="flex items-center">
                        <span className="text-gray-900 mr-2">
                          {shipment.invoiceNumber}
                        </span>
                        {getInvoiceStatusBadge(shipment.invoiceStatus)}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Link to={`/staff/shipments/${shipment.id}`}>
                      <Button variant="primary" size="sm">
                        View Details
                      </Button>
                    </Link>
                    <Link to={`/staff/invoices/${shipment.invoiceNumber}`}>
                      <Button variant="secondary" size="sm">
                        View Invoice
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>) : <Card>
            <div className="text-center py-12">
              <TruckIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                No completed shipments found
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