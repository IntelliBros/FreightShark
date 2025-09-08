import React, { useEffect, useState, useId } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { FileTextIcon, TruckIcon, PackageIcon, MapPinIcon, CalendarIcon, ClockIcon, DollarSignIcon, CheckCircleIcon, XIcon, DownloadIcon, SendIcon, ArrowLeftIcon, PrinterIcon, UserIcon } from 'lucide-react';
import { DataService } from '../../../services/DataService';
import { useToast } from '../../../context/ToastContext';
export const QuoteDetails = () => {
  const {
    id
  } = useParams<{
    id: string;
  }>();
  const navigate = useNavigate();
  const {
    addToast
  } = useToast();
  const [quote, setQuote] = useState<any>(null);
  const [quoteRequest, setQuoteRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  useEffect(() => {
    const fetchQuoteData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        // Fetch the quote
        const fetchedQuote = await DataService.getQuoteById(id);
        if (!fetchedQuote) {
          addToast('Quote not found', 'error');
          navigate('/staff/quotes/pending');
          return;
        }
        setQuote(fetchedQuote);
        // Fetch the original request
        const request = await DataService.getQuoteRequestById(fetchedQuote.requestId);
        setQuoteRequest(request);
      } catch (error) {
        console.error('Error fetching quote:', error);
        addToast('Failed to load quote details', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchQuoteData();
  }, [id, navigate, addToast]);
  const handleCreateShipment = async () => {
    if (!quote || !quoteRequest) return;
    setActionLoading(true);
    try {
      // Convert the approved quote to a shipment
      const shipment = await DataService.convertQuoteToShipment(quote.id);
      
      if (shipment) {
        addToast('Shipment created successfully from approved quote', 'success');
        navigate('/staff/shipments/active');
      } else {
        addToast('Failed to create shipment from quote', 'error');
      }
    } catch (error) {
      console.error('Error creating shipment:', error);
      addToast('Failed to create shipment', 'error');
    } finally {
      setActionLoading(false);
    }
  };
  const handleResendQuote = async () => {
    setActionLoading(true);
    try {
      // In a real app, this would resend the quote email
      await new Promise(resolve => setTimeout(resolve, 1000));
      addToast('Quote resent to customer successfully', 'success');
    } catch (error) {
      addToast('Failed to resend quote', 'error');
    } finally {
      setActionLoading(false);
    }
  };
  if (loading) {
    return <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>;
  }
  if (!quote || !quoteRequest) {
    return <div className="text-center py-8">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Quote not found
        </h3>
        <p className="text-gray-500 mb-4">
          The quote you're looking for doesn't exist or has been removed.
        </p>
        <Button variant="tertiary" onClick={() => navigate('/staff/quotes/pending')}>
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Quotes
        </Button>
      </div>;
  }
  const formatDate = dateString => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  return <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center">
          <Button variant="tertiary" className="mr-3" onClick={() => navigate(-1)}>
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Quote {quote.id}
            </h1>
            <div className="flex items-center mt-1">
              <Badge variant={quote.status === 'Accepted' ? 'success' : quote.status === 'Pending' ? 'warning' : quote.status === 'Rejected' ? 'danger' : 'default'} className="mr-2">
                {quote.status}
              </Badge>
              <span className="text-sm text-gray-600">
                Created: {formatDate(quote.createdAt)} • Expires:{' '}
                {formatDate(quote.expiresAt)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="secondary" size="sm" onClick={handleResendQuote} isLoading={actionLoading}>
            <SendIcon className="h-3.5 w-3.5 mr-1" />
            Resend Quote
          </Button>
          {quote.status === 'Accepted' && <Button variant="primary" size="sm" onClick={handleCreateShipment} isLoading={actionLoading}>
              <TruckIcon className="h-3.5 w-3.5 mr-1" />
              Create Shipment
            </Button>}
          <Button variant="tertiary" size="sm">
            <PrinterIcon className="h-3.5 w-3.5 mr-1" />
            Print
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <Card>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Customer</h2>
            <div className="space-y-3">
              <div className="flex items-start">
                <UserIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
                <div>
                  <h3 className="font-medium text-gray-900">
                    {quoteRequest.customer?.company || 'Customer Company'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {quoteRequest.customer?.name || 'Customer Name'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {quoteRequest.customer?.email || 'customer@example.com'}
                  </p>
                </div>
              </div>
            </div>
          </Card>
          <Card>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Supplier</h2>
            <div className="space-y-3">
              <div className="flex items-start">
                <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
                <div>
                  <h3 className="font-medium text-gray-900">
                    {quoteRequest.supplierDetails?.name || 'Supplier Name'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {quoteRequest.supplierDetails?.address || 'Supplier Address'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {quoteRequest.supplierDetails?.city || 'City'},{' '}
                    {quoteRequest.supplierDetails?.country || 'Country'}
                  </p>
                </div>
              </div>
            </div>
          </Card>
          <Card>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Timeline</h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <CalendarIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    Quote Created
                  </h3>
                  <p className="text-sm text-gray-600">
                    {formatDate(quote.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <ClockIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    Quote Expires
                  </h3>
                  <p className="text-sm text-gray-600">
                    {formatDate(quote.expiresAt)}
                  </p>
                </div>
              </div>
              {quote.status === 'Accepted' && <div className="flex items-start">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5 mr-2" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      Quote Accepted
                    </h3>
                    <p className="text-sm text-gray-600">
                      {formatDate(quote.updatedAt)}
                    </p>
                  </div>
                </div>}
            </div>
          </Card>
        </div>
        <div className="md:col-span-2 space-y-6">
          <Card>
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Quote Details
            </h2>
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Service Information
              </h3>
              <div className="flex items-center bg-gray-50 p-3 rounded-lg mb-4">
                <TruckIcon className="h-5 w-5 text-gray-500 mr-2" />
                <span className="text-gray-900 font-medium">
                  {quoteRequest.serviceType}
                </span>
                <div className="ml-auto">
                  <Badge variant="info">
                    {quote.rateType === 'per-kg' ? 'Per Kg Rate' : 'Flat Rate'}
                  </Badge>
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Cargo Information
              </h3>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <span className="text-xs text-gray-500 block">Cartons</span>
                  <span className="text-sm font-medium text-gray-900">
                    {quoteRequest.cargoDetails?.cartonCount || 0}
                  </span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <span className="text-xs text-gray-500 block">Weight</span>
                  <span className="text-sm font-medium text-gray-900">
                    {quoteRequest.cargoDetails?.grossWeight?.toFixed(2) || 0} kg
                  </span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <span className="text-xs text-gray-500 block">Volume</span>
                  <span className="text-sm font-medium text-gray-900">
                    {quoteRequest.cargoDetails?.cbm || 0} CBM
                  </span>
                </div>
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Destination Warehouses
            </h3>
            {quoteRequest.destinations?.map((dest, index) => {
            const warehouseRate = quote.warehouseRates.find(wr => wr.warehouseId === dest.id);
            return <div key={dest.id} className="mb-4 border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {dest.fbaWarehouse}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        Amazon Shipment ID: {dest.amazonShipmentId}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-700">
                        <span className="text-gray-500">Rate:</span> $
                        {warehouseRate?.ratePerKg?.toFixed(2) || 0}/kg
                      </div>
                      <div className="text-sm text-gray-700">
                        <span className="text-gray-500">Weight:</span>{' '}
                        {dest.weight?.toFixed(2) || 0} kg
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        <span className="text-gray-500">Subtotal:</span> $
                        {((warehouseRate?.ratePerKg || 0) * (dest.weight || 0)).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>;
          })}
            <h3 className="text-sm font-medium text-gray-500 mb-2 mt-6">
              Cost Breakdown
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="space-y-2">
                  {/* Base Rates */}
                  <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                    <span className="text-sm font-medium text-gray-900">
                      Base Shipping Rates
                    </span>
                  </div>
                  {quoteRequest.destinations?.map((dest, index) => {
                  const warehouseRate = quote.warehouseRates.find(wr => wr.warehouseId === dest.id);
                  const subtotal = (warehouseRate?.ratePerKg || 0) * (dest.weight || 0);
                  return <div key={`rate-${dest.id}`} className="flex justify-between items-center text-sm">
                        <span className="text-gray-700">
                          {dest.fbaWarehouse} ({dest.weight?.toFixed(2) || 0} kg
                          @ ${warehouseRate?.ratePerKg?.toFixed(2) || 0}/kg)
                        </span>
                        <span className="font-medium text-gray-900">
                          ${subtotal.toFixed(2)}
                        </span>
                      </div>;
                })}
                  {/* Other Charges */}
                  {quote.otherCharges?.length > 0 && <>
                      <div className="flex justify-between items-center pt-2 pb-2 border-b border-gray-200 mt-3">
                        <span className="text-sm font-medium text-gray-900">
                          Additional Charges
                        </span>
                      </div>
                      {quote.otherCharges.map((charge, index) => <div key={charge.id} className="flex justify-between items-center text-sm">
                          <span className="text-gray-700">
                            {charge.description}
                          </span>
                          <span className="font-medium text-gray-900">
                            ${charge.amount.toFixed(2)}
                          </span>
                        </div>)}
                    </>}
                  {/* Discounts */}
                  {quote.discounts?.length > 0 && <>
                      <div className="flex justify-between items-center pt-2 pb-2 border-b border-gray-200 mt-3">
                        <span className="text-sm font-medium text-gray-900">
                          Discounts
                        </span>
                      </div>
                      {quote.discounts.map((discount, index) => <div key={discount.id} className="flex justify-between items-center text-sm">
                          <span className="text-gray-700">
                            {discount.description}
                          </span>
                          <span className="font-medium text-green-600">
                            -${discount.amount.toFixed(2)}
                          </span>
                        </div>)}
                    </>}
                  {/* Totals */}
                  <div className="pt-2 mt-2 border-t border-gray-200">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-700">Subtotal</span>
                      <span className="font-medium text-gray-900">
                        ${quote.subtotal.toFixed(2)}
                      </span>
                    </div>
                    {quote.discounts?.length > 0 && <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-700">Discount Total</span>
                        <span className="font-medium text-green-600">
                          -$
                          {quote.discounts.reduce((sum, d) => sum + d.amount, 0).toFixed(2)}
                        </span>
                      </div>}
                    <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-200">
                      <span className="text-base font-medium text-gray-900">
                        Total
                      </span>
                      <span className="text-base font-bold text-blue-600">
                        ${quote.total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              {quote.notes && <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </h3>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">{quote.notes}</p>
                  </div>
                </div>}
              <div className="flex justify-end space-x-3 pt-4">
                <Button variant="secondary" size="sm">
                  <DownloadIcon className="h-4 w-4 mr-1" />
                  Download PDF
                </Button>
                {quote.status === 'Accepted' && <Button variant="primary" size="sm" onClick={handleCreateShipment} isLoading={actionLoading}>
                    <TruckIcon className="h-4 w-4 mr-1" />
                    Create Shipment
                  </Button>}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>;
};