import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { FileTextIcon, TruckIcon, ArrowRightIcon, ClockIcon, ReceiptIcon, UsersIcon, MessageCircleIcon, AlertCircleIcon, DollarSignIcon, CheckCircleIcon, MailIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { DataService, QuoteRequest, Shipment } from '../../services/DataService';
// Mock data for messages and invoices
const unreadMessages = [{
  id: 'MSG-123',
  customer: 'John Doe (Acme Imports)',
  message: 'When will my shipment clear customs?',
  time: '10:30 AM',
  shipmentId: 'SH-1234'
}, {
  id: 'MSG-124',
  customer: 'Lisa Wong (Global Traders Inc)',
  message: 'Need to update delivery address for FBA ONT8',
  time: 'Yesterday',
  shipmentId: 'SH-1235'
}];
const invoicesPendingCreation = [{
  id: 'SH-1230',
  customer: 'Prime Sellers LLC',
  status: 'Delivered',
  deliveredDate: '2023-11-01',
  amount: 'Not Invoiced'
}, {
  id: 'SH-1231',
  customer: 'Acme Imports',
  status: 'Delivered',
  deliveredDate: '2023-11-02',
  amount: 'Not Invoiced'
}];
export const StaffDashboard = () => {
  const {
    user
  } = useAuth();
  const {
    quoteRequests,
    shipments,
    isLoading
  } = useData();
  const [pendingQuoteRequests, setPendingQuoteRequests] = useState<QuoteRequest[]>([]);
  const [pendingShipmentUpdates, setPendingShipmentUpdates] = useState<Shipment[]>([]);
  useEffect(() => {
    // Filter quote requests that are awaiting quotes
    const awaitingQuotes = quoteRequests.filter(request => request.status === 'Awaiting Quote');
    setPendingQuoteRequests(awaitingQuotes);
    // Filter shipments that need updates (In Transit or Awaiting Pickup)
    const needsUpdate = shipments.filter(shipment => shipment.status === 'In Transit' || shipment.status === 'Awaiting Pickup');
    setPendingShipmentUpdates(needsUpdate);
  }, [quoteRequests, shipments]);
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-[#1E2A45] rounded-full border-t-transparent animate-spin"></div>
      </div>;
  }
  return <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#1E2A45]">
          Welcome back, {user?.name}
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Here are your tasks for today.
        </p>
      </div>

      {/* Tasks Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 flex items-center">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mr-4">
            <FileTextIcon className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <div className="text-3xl font-bold text-[#1E2A45]">
              {pendingQuoteRequests.length}
            </div>
            <div className="text-sm text-gray-500">Quote Requests</div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 flex items-center">
          <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mr-4">
            <TruckIcon className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <div className="text-3xl font-bold text-[#1E2A45]">
              {pendingShipmentUpdates.length}
            </div>
            <div className="text-sm text-gray-500">Shipment Updates</div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 flex items-center">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mr-4">
            <MessageCircleIcon className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <div className="text-3xl font-bold text-[#1E2A45]">
              {unreadMessages.length}
            </div>
            <div className="text-sm text-gray-500">Unread Messages</div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 flex items-center">
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mr-4">
            <ReceiptIcon className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <div className="text-3xl font-bold text-[#1E2A45]">
              {invoicesPendingCreation.length}
            </div>
            <div className="text-sm text-gray-500">Pending Invoices</div>
          </div>
        </div>
      </div>

      {/* Quote Requests Section */}
      <Card title="Pending Quote Requests" subtitle="Customer requests awaiting pricing" color="red" className="mb-6">
        {pendingQuoteRequests.length > 0 ? <div className="space-y-4">
            {pendingQuoteRequests.map(request => <div key={request.id} className="border border-gray-100 rounded-lg p-4 hover:border-gray-200 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center">
                      <h3 className="text-[#1E2A45] font-medium text-sm mr-2">
                        {request.id}
                      </h3>
                      <Badge variant="danger">Awaiting Quote</Badge>
                      {new Date(request.dueBy) <= new Date(Date.now() + 24 * 60 * 60 * 1000) && <Badge variant="danger" className="ml-2">
                          Urgent
                        </Badge>}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Customer: {request.customer?.company || 'Unknown Company'}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 flex items-center">
                      <ClockIcon className="w-3 h-3 mr-1 text-gray-400" />
                      Requested: {request.requestedDate} • Due: {request.dueBy}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {request.serviceType} • {request.destinations?.length || 0}{' '}
                    destination{(request.destinations?.length || 0) > 1 ? 's' : ''}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-600">
                    Destination{(request.destinations?.length || 0) > 1 ? 's' : ''}:{' '}
                    {request.destinations?.map(d => d.fbaWarehouse).join(', ') || 'No destinations'}
                  </div>
                  <Link to={`/staff/quotes/provide/${request.id}`}>
                    <Button variant="primary" size="sm">
                      <DollarSignIcon className="h-3.5 w-3.5 mr-1" />
                      Provide Quote
                    </Button>
                  </Link>
                </div>
              </div>)}
          </div> : <div className="text-center py-8">
            <FileTextIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-gray-700 mb-1">
              No quote requests
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              All customer quote requests have been handled
            </p>
          </div>}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        {/* Shipment Updates Section */}
        <Card title="Shipment Updates Needed" subtitle="Shipments requiring status updates" color="amber">
          {pendingShipmentUpdates.length > 0 ? <div className="space-y-4">
              {pendingShipmentUpdates.map(shipment => <div key={shipment.id} className="border border-gray-100 rounded-lg p-4 hover:border-gray-200 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center">
                        <h3 className="text-[#1E2A45] font-medium text-sm mr-2">
                          {shipment.id}
                        </h3>
                        <Badge variant={shipment.status === 'In Transit' ? 'info' : 'warning'}>
                          {shipment.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Customer ID: {shipment.customerId}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {shipment.destinations?.map(d => d.fbaWarehouse).join(' → ') || 'No destinations'}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-start">
                      <AlertCircleIcon className="h-4 w-4 text-amber-500 mr-1.5 mt-0.5" />
                      <div className="text-xs">
                        <span className="text-gray-700 font-medium">
                          Update needed:
                        </span>
                        <span className="text-gray-600 ml-1">
                          {shipment.status === 'Awaiting Pickup' ? 'Pickup Confirmation' : 'Transit Update'}
                        </span>
                        <div className="text-gray-500 mt-0.5">
                          Last updated:{' '}
                          {new Date(shipment.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <Link to={`/staff/shipments/update?id=${shipment.id}`}>
                      <Button variant="secondary" size="sm">
                        Update Status
                      </Button>
                    </Link>
                  </div>
                </div>)}
            </div> : <div className="text-center py-8">
              <TruckIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <h3 className="text-sm font-medium text-gray-700 mb-1">
                No updates needed
              </h3>
              <p className="text-xs text-gray-500 mb-3">
                All shipments are up to date
              </p>
            </div>}
        </Card>

        {/* Messages Section */}
        <Card title="Unread Messages" subtitle="Customer inquiries requiring response" color="blue">
          {unreadMessages.length > 0 ? <div className="space-y-4">
              {unreadMessages.map(message => <div key={message.id} className="border border-gray-100 rounded-lg p-4 hover:border-gray-200 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-medium text-sm text-gray-900">
                      {message.customer}
                    </div>
                    <div className="text-xs text-gray-500">{message.time}</div>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">
                    {message.message}
                  </p>
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-gray-500">
                      Re: Shipment {message.shipmentId}
                    </div>
                    <Link to={`/staff/messages/${message.id}`}>
                      <Button variant="secondary" size="sm">
                        <MailIcon className="h-3.5 w-3.5 mr-1" />
                        Reply
                      </Button>
                    </Link>
                  </div>
                </div>)}
              <div className="flex justify-center">
                <Link to="/staff/messages">
                  <Button variant="link" size="sm">
                    View All Messages
                  </Button>
                </Link>
              </div>
            </div> : <div className="text-center py-8">
              <MessageCircleIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <h3 className="text-sm font-medium text-gray-700 mb-1">
                No new messages
              </h3>
              <p className="text-xs text-gray-500 mb-3">
                All customer inquiries have been addressed
              </p>
            </div>}
        </Card>
      </div>

      {/* Invoices Section */}
      <Card title="Shipments Awaiting Invoice" subtitle="Completed shipments requiring invoicing" color="green">
        {invoicesPendingCreation.length > 0 ? <div className="space-y-4">
            {invoicesPendingCreation.map(shipment => <div key={shipment.id} className="border border-gray-100 rounded-lg p-4 hover:border-gray-200 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center">
                      <h3 className="text-[#1E2A45] font-medium text-sm mr-2">
                        {shipment.id}
                      </h3>
                      <Badge variant="success">{shipment.status}</Badge>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Customer: {shipment.customer}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 flex items-center">
                      <CheckCircleIcon className="w-3 h-3 mr-1 text-gray-400" />
                      Delivered on: {shipment.deliveredDate}
                    </div>
                  </div>
                  <div className="text-sm font-medium text-amber-600">
                    {shipment.amount}
                  </div>
                </div>
                <div className="flex justify-end">
                  <Link to={`/staff/invoices/create?shipmentId=${shipment.id}`}>
                    <Button variant="primary" size="sm">
                      <ReceiptIcon className="h-3.5 w-3.5 mr-1" />
                      Create Invoice
                    </Button>
                  </Link>
                </div>
              </div>)}
          </div> : <div className="text-center py-8">
            <ReceiptIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-gray-700 mb-1">
              No invoices pending
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              All completed shipments have been invoiced
            </p>
          </div>}
      </Card>
    </div>;
};