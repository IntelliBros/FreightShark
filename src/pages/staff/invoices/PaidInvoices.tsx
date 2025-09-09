import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { ReceiptIcon, SearchIcon, FilterIcon, ChevronDownIcon, CheckCircleIcon, DownloadIcon, FileTextIcon } from 'lucide-react';
import { useData } from '../../../context/DataContext';

export const PaidInvoices = () => {
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { shipments, refreshData } = useData();
  
  // Refresh data on mount to get latest invoices
  useEffect(() => {
    refreshData();
  }, []);
  
  // Get all paid invoices from shipments
  const paidInvoices = shipments
    .filter(shipment => shipment.invoice && shipment.invoice.status === 'Paid')
    .map(shipment => ({
      id: shipment.invoice.id,
      shipmentId: shipment.id,
      customer: shipment.customer,
      status: shipment.invoice.status,
      amount: shipment.invoice.amount || shipment.invoice.total,
      issueDate: new Date(shipment.invoice.createdAt).toLocaleDateString('en-US'),
      dueDate: shipment.invoice.dueDate,
      paidDate: shipment.invoice.paidDate || new Date().toLocaleDateString('en-US'),
      paymentMethod: shipment.invoice.paymentMethod || 'Bank Transfer',
      transactionId: shipment.invoice.transactionId || `txn_${Date.now()}`,
      warehouseDetails: shipment.invoice.warehouseDetails,
      additionalServices: shipment.invoice.additionalServices,
      adjustments: shipment.invoice.adjustments
    }));
  
  const filteredInvoices = paidInvoices.filter(invoice => {
    if (searchTerm === '') return true;
    const searchLower = searchTerm.toLowerCase();
    return invoice.id.toLowerCase().includes(searchLower) || invoice.shipmentId.toLowerCase().includes(searchLower) || (invoice.customer.name || '').toLowerCase().includes(searchLower) || (invoice.customer.company || '').toLowerCase().includes(searchLower) || (invoice.customer.email || '').toLowerCase().includes(searchLower) || invoice.transactionId.toLowerCase().includes(searchLower);
  });
  return <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Paid Invoices</h1>
          <p className="text-gray-600 mt-1">
            View and manage completed invoice payments
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="secondary">
            <DownloadIcon className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Link to="/staff/invoices/pending">
            <Button variant="primary">Pending Invoices</Button>
          </Link>
        </div>
      </div>
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative flex-grow max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input type="text" className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="Search by invoice ID, shipment, customer, transaction..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
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
                  Payment Date Range
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
                  Amount Range
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500">
                      Min ($)
                    </label>
                    <input type="number" min="0" step="100" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500">
                      Max ($)
                    </label>
                    <input type="number" min="0" step="100" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <div className="space-y-2">
                  {['Credit Card', 'Bank Transfer', 'PayPal', 'Check'].map(method => <label key={method} className="flex items-center">
                        <input type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                        <span className="ml-2 text-sm text-gray-700">
                          {method}
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
        {filteredInvoices.length > 0 ? filteredInvoices.map(invoice => <div key={invoice.id} className="bg-white border border-gray-200 hover:border-blue-300 rounded-lg shadow-sm transition p-5">
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
                          {invoice.id}
                        </h3>
                        <Badge variant="success">Paid</Badge>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {invoice.customer?.company || 'Unknown Company'}
                      </p>
                      <div className="mt-2 text-sm text-gray-700">
                        <span className="text-gray-500">Contact:</span>{' '}
                        {invoice.customer?.name || 'Unknown Customer'} • {invoice.customer?.email || 'No email'}
                      </div>
                      <div className="mt-1 text-sm text-gray-700">
                        <span className="text-gray-500">Shipment:</span>{' '}
                        <Link to={`/staff/shipments/${invoice.shipmentId}`} className="text-blue-600 hover:underline">
                          {invoice.shipmentId}
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-sm">
                    <div className="mb-2">
                      <span className="text-gray-500 block">Amount:</span>
                      <span className="text-xl font-medium text-gray-900">
                        ${invoice.amount.toFixed(2)}
                      </span>
                    </div>
                    <div className="mb-2">
                      <span className="text-gray-500 block">Issue Date:</span>
                      <span className="text-gray-900">{invoice.issueDate}</span>
                    </div>
                    <div className="mb-2">
                      <span className="text-gray-500 block">Due Date:</span>
                      <span className="text-gray-900">{invoice.dueDate}</span>
                    </div>
                    <div className="mb-2">
                      <span className="text-gray-500 block">Payment Date:</span>
                      <span className="text-green-600 font-medium">
                        {invoice.paidDate}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-sm mb-4">
                    <div className="mb-2">
                      <span className="text-gray-500 block">
                        Payment Method:
                      </span>
                      <span className="text-gray-900">
                        {invoice.paymentMethod}
                      </span>
                    </div>
                    <div className="mb-2">
                      <span className="text-gray-500 block">
                        Transaction ID:
                      </span>
                      <span className="text-gray-900">
                        {invoice.transactionId}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="primary" size="sm">
                      <DownloadIcon className="h-4 w-4 mr-1" />
                      PDF
                    </Button>
                    <Button variant="secondary" size="sm">
                      <FileTextIcon className="h-4 w-4 mr-1" />
                      Receipt
                    </Button>
                  </div>
                </div>
              </div>
            </div>) : <Card>
            <div className="text-center py-12">
              <ReceiptIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                No paid invoices found
              </h3>
              <p className="text-gray-500 mb-4">
                No invoices match your search criteria
              </p>
              <Button variant="primary" onClick={() => setSearchTerm('')}>
                Clear Search
              </Button>
            </div>
          </Card>}
      </div>
    </div>;
};