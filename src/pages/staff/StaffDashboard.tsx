import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { FileTextIcon, TruckIcon, ClockIcon, ReceiptIcon, MessageCircleIcon, DollarSignIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContextV2';
import { QuoteRequest } from '../../services/DataService';

export const StaffDashboard = () => {
  const { user } = useAuth();
  const { quoteRequests, shipments, isLoading } = useData();
  const [pendingQuoteRequests, setPendingQuoteRequests] = useState<QuoteRequest[]>([]);

  useEffect(() => {
    // Filter quote requests that are awaiting quotes
    const awaitingQuotes = quoteRequests.filter(request => request.status === 'Awaiting Quote');
    setPendingQuoteRequests(awaitingQuotes);
  }, [quoteRequests]);

  // Calculate real-time stats for the cards
  const stats = useMemo(() => {
    // Count pending quote requests
    const quoteRequestsCount = quoteRequests.filter(req => req.status === 'Awaiting Quote').length;

    // Count shipments that need updates (In Transit, Awaiting Pickup, or Customs)
    const shipmentUpdatesCount = shipments.filter(s =>
      s.status === 'In Transit' ||
      s.status === 'Awaiting Pickup' ||
      s.status === 'Customs' ||
      s.status === 'In Progress'
    ).length;

    // Count unread messages from shipments that have messages
    const unreadMessagesCount = shipments.reduce((count, shipment) => {
      if (shipment.messages && Array.isArray(shipment.messages)) {
        const unread = shipment.messages.filter((m: any) => !m.read || m.isUnread);
        return count + unread.length;
      }
      return count;
    }, 0);

    // Count pending invoices (delivered shipments that need invoicing)
    const pendingInvoicesCount = shipments.filter(s => {
      // Check if shipment is delivered
      const isDelivered = s.status === 'Delivered' ||
        (s.destinations && s.destinations.length > 0 &&
         s.destinations.every((d: any) => d.deliveryStatus === 'delivered'));

      // Check if invoice needs to be created or is not paid
      const needsInvoice = !s.invoice ||
                          !s.invoice.id ||
                          (s.invoice.status && s.invoice.status !== 'Paid');

      return isDelivered && needsInvoice;
    }).length;

    return {
      quoteRequests: quoteRequestsCount,
      shipmentUpdates: shipmentUpdatesCount,
      unreadMessages: unreadMessagesCount,
      pendingInvoices: pendingInvoicesCount
    };
  }, [quoteRequests, shipments]);
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-[#1E2A45] rounded-full border-t-transparent animate-spin"></div>
      </div>;
  }
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#1E2A45]">
          Welcome back, {user?.name}
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Here are your tasks for today.
        </p>
      </div>

      {/* Tasks Overview - Real-time data */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 flex items-center">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mr-4">
            <FileTextIcon className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <div className="text-3xl font-bold text-[#1E2A45]">
              {stats.quoteRequests}
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
              {stats.shipmentUpdates}
            </div>
            <div className="text-sm text-gray-500">Active Shipments</div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 flex items-center">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mr-4">
            <MessageCircleIcon className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <div className="text-3xl font-bold text-[#1E2A45]">
              {stats.unreadMessages}
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
              {stats.pendingInvoices}
            </div>
            <div className="text-sm text-gray-500">Pending Invoices</div>
          </div>
        </div>
      </div>

      {/* Quote Requests Section */}
      <Card title="Pending Quote Requests" subtitle="Customer requests awaiting pricing" color="red" className="mb-6">
        {pendingQuoteRequests.length > 0 ? (
          <div className="space-y-4">
            {pendingQuoteRequests.map(request => (
              <div key={request.id} className="border border-gray-100 rounded-lg p-4 hover:border-gray-200 transition-colors">
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
                    {request.destinations?.length || 0}{' '}
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
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FileTextIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-gray-700 mb-1">
              No quote requests
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              All customer quote requests have been handled
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};