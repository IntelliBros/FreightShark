import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ChatPanel } from '../../components/chat/ChatPanel';
import { FileTextIcon, TruckIcon, CheckCircleIcon, ClockIcon, DownloadIcon, MessageCircleIcon, CreditCardIcon, AlertCircleIcon, ChevronRightIcon, ChevronDownIcon, XIcon } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { DataService } from '../../services/DataService';
import { useData } from '../../context/DataContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const QuoteDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [quote, setQuote] = useState<any>(null);
  const [quoteRequest, setQuoteRequest] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [expandedSections, setExpandedSections] = useState({
    pricing: true,
    destinations: true,
    documents: true,
    timeline: true
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  
  // Check if user is staff based on the current route
  const isStaffView = location.pathname.startsWith('/staff');
  
  // Fetch quote data
  useEffect(() => {
    const fetchQuoteData = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const quoteData = await DataService.getQuoteById(id);
        if (quoteData) {
          console.log('Quote data:', quoteData);
          setQuote(quoteData);
          
          // Fetch related quote request if available
          if (quoteData.requestId) {
            const requestData = await DataService.getQuoteRequestById(quoteData.requestId);
            console.log('Quote request data:', requestData);
            console.log('Destination warehouses:', requestData?.destination_warehouses);
            setQuoteRequest(requestData);
          }
          
          // Fetch customer details
          if (quoteData.customerId) {
            const customerData = await DataService.getUserById(quoteData.customerId);
            console.log('Customer data:', customerData);
            setCustomer(customerData);
          }
        }
      } catch (error) {
        console.error('Error fetching quote:', error);
        addToast('Failed to load quote details', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchQuoteData();
  }, [id, addToast]);
  
  const toggleSection = (section: string) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section as keyof typeof expandedSections]
    });
  };
  
  const { refreshData } = useData();
  
  const handleAcceptQuote = async () => {
    setIsLoading(true);
    try {
      // Update quote status to Accepted first
      await DataService.updateQuote(id!, {
        status: 'Accepted'
      });
      
      // Convert the approved quote to a shipment
      const shipment = await DataService.convertQuoteToShipment(id!);
      
      if (shipment) {
        // Refresh data context to ensure shipments are updated
        await refreshData();
        addToast('Quote accepted successfully! Your shipment has been created and is being processed.', 'success');
        // Navigate to shipments list instead of individual shipment
        navigate('/shipments');
      } else {
        addToast('Failed to create shipment from quote. Please contact support.', 'error');
      }
    } catch (error) {
      console.error('Error accepting quote:', error);
      addToast('Failed to accept quote. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeclineQuote = () => {
    if (!declineReason.trim()) {
      addToast('Please provide a reason for declining the quote', 'error');
      return;
    }
    
    setIsLoading(true);
    // Simulate declining quote
    setTimeout(() => {
      addToast('Quote declined successfully', 'success');
      setShowDeclineModal(false);
      navigate('/quotes');
    }, 1000);
  };
  
  const handlePaymentMethod = () => {
    navigate('/payment-methods');
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'warning';
      case 'Accepted':
      case 'Finalized':
        return 'success';
      case 'Rejected':
        return 'danger';
      case 'Expired':
        return 'danger';
      default:
        return 'default';
    }
  };
  
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  
  const generateQuotePDF = () => {
    try {
      const doc = new jsPDF();
      
      // Colors matching the website
      const primaryColor = [37, 99, 235]; // Blue
      const secondaryColor = [107, 114, 128]; // Gray
      const accentColor = [16, 185, 129]; // Green
      
      // Header background
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, 210, 40, 'F');
      
      // Logo and title
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont(undefined, 'bold');
      doc.text('FREIGHT SHARK', 20, 20);
      doc.setFontSize(14);
      doc.setFont(undefined, 'normal');
      doc.text(`Quote ${id}`, 20, 32);
      
      // Status badge
      const statusColor = quote.status === 'Accepted' ? accentColor : 
                         quote.status === 'Pending' ? [251, 191, 36] : secondaryColor;
      doc.setFillColor(...statusColor);
      doc.roundedRect(150, 15, 40, 10, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.text(quote.status.toUpperCase(), 170, 22, { align: 'center' });
      
      // Reset text color
      doc.setTextColor(0, 0, 0);
      
      // Quote info section
      doc.setFontSize(10);
      doc.setTextColor(...secondaryColor);
      doc.text(`Created: ${formatDate(quote.created_at || quote.createdAt)}`, 20, 50);
      doc.text(`Expires: ${formatDate(quote.valid_until || quote.expiresAt)}`, 100, 50);
      
      // Customer & Supplier section
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Customer Information', 20, 65);
      doc.text('Supplier Information', 110, 65);
      
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      doc.text(customer?.company || 'N/A', 20, 73);
      doc.text(customer?.name || 'N/A', 20, 79);
      doc.text(customer?.email || 'N/A', 20, 85);
      
      doc.text(supplier.name || 'Unknown Supplier', 110, 73);
      const addressLines = (supplier.address || 'No address provided').match(/.{1,40}/g) || [];
      addressLines.forEach((line: string, index: number) => {
        doc.text(line, 110, 79 + (index * 6));
      });
      
      // Cargo Details section with table
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Cargo Details', 20, 100);
      
      const cargoData = [
        ['Gross Weight', `${cargoDetails.grossWeight || 0} kg`],
        ['Carton Count', `${cargoDetails.cartonCount || 0}`],
        ['CBM', `${cargoDetails.cbm || 0} m³`],
        ['Volumetric Weight', `${Math.round((cargoDetails.cbm || 0) * 167)} kg`],
        ['Chargeable Weight', `${Math.max(cargoDetails.grossWeight || 0, Math.round((cargoDetails.cbm || 0) * 167))} kg`]
      ];
      
      autoTable(doc, {
        startY: 105,
        head: [],
        body: cargoData,
        theme: 'plain',
        styles: {
          fontSize: 10,
          cellPadding: 2
        },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 40 },
          1: { cellWidth: 40 }
        },
        margin: { left: 20, right: 110 }
      });
      
      // Destinations section
      if (destinations && destinations.length > 0) {
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('Destinations', 20, (doc as any).lastAutoTable.finalY + 15);
        
        const destData = destinations.map((dest: any) => [
          dest.fbaWarehouse || 'N/A',
          `${dest.cartonCount || dest.cartons || 0}`,
          `${dest.weight || dest.grossWeight || 0} kg`,
          `${dest.volumetricWeight || Math.round((dest.cbm || 0) * 167)} kg`,
          formatDate(dest.eta || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString())
        ]);
        
        autoTable(doc, {
          startY: (doc as any).lastAutoTable.finalY + 20,
          head: [['Warehouse', 'Cartons', 'Weight', 'Vol. Weight', 'ETA']],
          body: destData,
          theme: 'striped',
          headStyles: {
            fillColor: primaryColor,
            textColor: [255, 255, 255],
            fontSize: 10,
            fontStyle: 'bold'
          },
          styles: {
            fontSize: 9,
            cellPadding: 3
          },
          margin: { left: 20, right: 20 }
        });
      }
      
      // Pricing Breakdown section
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      const pricingY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 15 : 150;
      doc.text('Pricing Breakdown', 20, pricingY);
      
      const pricingData = [];
      
      // Add warehouse rates
      warehouseRates.forEach((rate: any, index: number) => {
        let weight = rate.weight || rate.chargeableWeight;
        if (!weight && destinations && destinations[index]) {
          const dest = destinations[index];
          const destWeight = dest.weight || dest.grossWeight || 
                           (cargoDetails.grossWeight ? cargoDetails.grossWeight / destinations.length : 0);
          const destVolumetric = dest.volumetricWeight || 
                               Math.round((dest.cbm || (cargoDetails.cbm ? cargoDetails.cbm / destinations.length : 0)) * 167);
          weight = Math.max(destWeight, destVolumetric);
        }
        if (!weight) {
          weight = Math.max(
            cargoDetails.grossWeight || 0,
            Math.round((cargoDetails.cbm || 0) * 167)
          );
        }
        
        pricingData.push([
          `${rate.warehouse || `Warehouse ${index + 1}`} - Base Rate`,
          `${weight} kg @ ${formatCurrency(rate.ratePerKg || 0)}/kg`,
          formatCurrency(weight * (rate.ratePerKg || 0))
        ]);
      });
      
      // Add other charges
      otherCharges.forEach((charge: any) => {
        pricingData.push([
          charge.description || charge.name,
          '',
          formatCurrency(charge.amount || 0)
        ]);
      });
      
      // Add discounts
      discounts.forEach((discount: any) => {
        pricingData.push([
          discount.description || discount.name,
          '',
          `-${formatCurrency(discount.amount || 0)}`
        ]);
      });
      
      autoTable(doc, {
        startY: pricingY + 5,
        head: [['Description', 'Details', 'Amount']],
        body: pricingData,
        theme: 'plain',
        headStyles: {
          fillColor: [243, 244, 246],
          textColor: [0, 0, 0],
          fontSize: 10,
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 10,
          cellPadding: 3
        },
        columnStyles: {
          2: { halign: 'right', fontStyle: 'bold' }
        },
        margin: { left: 20, right: 20 }
      });
      
      // Total section
      const totalY = (doc as any).lastAutoTable.finalY + 5;
      doc.setDrawColor(...primaryColor);
      doc.setLineWidth(0.5);
      doc.line(20, totalY, 190, totalY);
      
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Total:', 140, totalY + 8);
      doc.setTextColor(...primaryColor);
      doc.setFontSize(16);
      doc.text(formatCurrency(quote.total_cost || quote.total || 0), 190, totalY + 8, { align: 'right' });
      
      // Footer
      doc.setTextColor(...secondaryColor);
      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');
      const pageHeight = doc.internal.pageSize.height;
      doc.text('This quote is valid until ' + formatDate(quote.valid_until || quote.expiresAt), 105, pageHeight - 20, { align: 'center' });
      doc.text('Thank you for choosing Freight Shark', 105, pageHeight - 15, { align: 'center' });
      doc.text('© 2025 Freight Shark. All rights reserved.', 105, pageHeight - 10, { align: 'center' });
      
      // Save the PDF
      doc.save(`Quote-${id}.pdf`);
      addToast('Quote PDF downloaded successfully', 'success');
    } catch (error) {
      console.error('Error generating PDF:', error);
      addToast('Failed to generate PDF', 'error');
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (!quote) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-medium text-gray-900">Quote not found</h3>
        <Button 
          variant="tertiary" 
          className="mt-4" 
          onClick={() => navigate(isStaffView ? '/staff/quotes' : '/quotes')}
        >
          Back to Quotes
        </Button>
      </div>
    );
  }
  
  // Extract data from quote and related objects
  // Handle both formats - nested in destination_warehouses or direct properties
  const warehouseData = quoteRequest?.destination_warehouses || {};
  const supplier = quoteRequest?.supplierDetails || warehouseData?.supplierDetails || {};
  const destinations = quoteRequest?.destinations || warehouseData?.destinations || [];
  const cargoDetails = quoteRequest?.cargoDetails || warehouseData?.cargoDetails || {};
  
  // Debug destinations data
  console.log('Destinations data:', destinations);
  console.log('Cargo details:', cargoDetails);
  const warehouseRates = quote.warehouseRates || quote.per_warehouse_costs || [];
  const otherCharges = quote.otherCharges || quote.additional_charges?.otherCharges || [];
  const discounts = quote.discounts || quote.additional_charges?.discounts || [];
  
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Quote {id}</h1>
          <Badge variant={getStatusColor(quote.status) as any}>
            {quote.status}
          </Badge>
        </div>
        <p className="text-gray-600 mt-1">
          Created on {formatDate(quote.created_at || quote.createdAt)} • Expires on {formatDate(quote.valid_until || quote.expiresAt)}
        </p>
      </div>

      <div className="mb-6 border-b border-gray-200">
        <nav className="flex -mb-px">
          <button
            className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'documents'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('documents')}
          >
            Documents
          </button>
        </nav>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-medium text-gray-900">
                Quote Summary
              </h2>
              <div className="text-sm text-gray-500">
                <span className="mr-1">Expires:</span>
                <span className="font-medium text-gray-900">
                  {formatDate(quote.valid_until || quote.expiresAt)}
                </span>
              </div>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Supplier
                  </h3>
                  <p className="text-gray-900">{supplier.name || 'Unknown Supplier'}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {supplier.address || 'No address provided'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Pickup Details
                  </h3>
                  <p className="text-gray-900">{formatDate(quoteRequest?.cargo_ready_date)}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Location: {quoteRequest?.pickup_location || 'Not specified'}
                  </p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Master Cargo
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <span className="text-xs text-gray-500">Gross Weight</span>
                    <p className="text-gray-900">
                      {cargoDetails.grossWeight || 0} kg
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Carton Count</span>
                    <p className="text-gray-900">
                      {cargoDetails.cartonCount || 0}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">
                      Volumetric Weight
                    </span>
                    <p className="text-gray-900">
                      {Math.round((cargoDetails.cbm || 0) * 167)} kg
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">
                      Chargeable Weight
                    </span>
                    <p className="text-gray-900 text-blue-600 font-medium">
                      {Math.max(cargoDetails.grossWeight || 0, Math.round((cargoDetails.cbm || 0) * 167))} kg
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Pricing Breakdown Section */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <button
                className="flex items-center justify-between w-full mb-4"
                onClick={() => toggleSection('pricing')}
              >
                <h3 className="text-lg font-medium text-gray-900">
                  Pricing Breakdown
                </h3>
                <ChevronDownIcon
                  className={`h-5 w-5 text-gray-400 transition-transform ${
                    expandedSections.pricing ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {expandedSections.pricing && (
                <div className="space-y-3">
                  {warehouseRates.map((rate: any, index: number) => {
                    // Calculate weight fallback from destinations if not in rate
                    let weight = rate.weight || rate.chargeableWeight;
                    if (!weight && destinations && destinations[index]) {
                      const dest = destinations[index];
                      const destWeight = dest.weight || dest.grossWeight || 
                                       (cargoDetails.grossWeight ? cargoDetails.grossWeight / destinations.length : 0);
                      const destVolumetric = dest.volumetricWeight || 
                                           Math.round((dest.cbm || (cargoDetails.cbm ? cargoDetails.cbm / destinations.length : 0)) * 167);
                      weight = Math.max(destWeight, destVolumetric);
                    }
                    // If still no weight, use total cargo weight
                    if (!weight) {
                      weight = Math.max(
                        cargoDetails.grossWeight || 0,
                        Math.round((cargoDetails.cbm || 0) * 167)
                      );
                    }
                    
                    return (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {rate.warehouse || `Warehouse ${index + 1}`} - Base Rate ({weight} kg @ {formatCurrency(rate.ratePerKg || 0)}/kg)
                        </span>
                        <span className="text-gray-900">
                          {formatCurrency(weight * (rate.ratePerKg || 0))}
                        </span>
                      </div>
                    );
                  })}
                  
                  {otherCharges.map((charge: any, index: number) => (
                    <div key={`charge-${index}`} className="flex justify-between text-sm">
                      <span className="text-gray-600">{charge.description || charge.name}</span>
                      <span className="text-gray-900">{formatCurrency(charge.amount || 0)}</span>
                    </div>
                  ))}
                  
                  {discounts.map((discount: any, index: number) => (
                    <div key={`discount-${index}`} className="flex justify-between text-sm">
                      <span className="text-gray-600">{discount.description || discount.name}</span>
                      <span className="text-green-600">-{formatCurrency(discount.amount || 0)}</span>
                    </div>
                  ))}
                  
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-900">Total:</span>
                      <span className="font-bold text-xl text-blue-600">
                        {formatCurrency(quote.total_cost || quote.total || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Destinations Section */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <button
                className="flex items-center justify-between w-full mb-4"
                onClick={() => toggleSection('destinations')}
              >
                <h3 className="text-lg font-medium text-gray-900">
                  Destinations ({destinations.length})
                </h3>
                <ChevronDownIcon
                  className={`h-5 w-5 text-gray-400 transition-transform ${
                    expandedSections.destinations ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {expandedSections.destinations && (
                <div className="space-y-4">
                  {destinations.map((dest: any, index: number) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {dest.fbaWarehouse || `Destination ${index + 1}`}
                          </h4>
                          {dest.amazonShipmentId && (
                            <p className="text-sm text-gray-500 mt-1">
                              Shipment ID: {dest.amazonShipmentId}
                            </p>
                          )}
                        </div>
                        <Badge variant="info">
                          ETA: {formatDate(dest.eta || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString())}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">Cartons</span>
                          <p className="text-gray-900 font-medium">
                            {dest.cartonCount || dest.cartons || 0}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Gross Weight</span>
                          <p className="text-gray-900 font-medium">
                            {dest.weight || dest.grossWeight || 0} kg
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Vol. Weight</span>
                          <p className="text-gray-900 font-medium">
                            {dest.volumetricWeight || 
                             (dest.cbm ? Math.round(dest.cbm * 167) : 
                              (cargoDetails.cbm && destinations.length > 0 ? 
                               Math.round((cargoDetails.cbm / destinations.length) * 167) : 0))} kg
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Chargeable</span>
                          <p className="text-blue-600 font-medium">
                            {dest.chargeableWeight || 
                             Math.max(
                               dest.weight || dest.grossWeight || 0, 
                               dest.volumetricWeight || 
                               (dest.cbm ? Math.round(dest.cbm * 167) : 
                                (cargoDetails.cbm && destinations.length > 0 ? 
                                 Math.round((cargoDetails.cbm / destinations.length) * 167) : 0))
                             )} kg
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Timeline Section */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <button
                className="flex items-center justify-between w-full mb-4"
                onClick={() => toggleSection('timeline')}
              >
                <h3 className="text-lg font-medium text-gray-900">Timeline</h3>
                <ChevronDownIcon
                  className={`h-5 w-5 text-gray-400 transition-transform ${
                    expandedSections.timeline ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {expandedSections.timeline && (
                <div className="space-y-3">
                  <div className="flex items-start">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-900">Quote created</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(quote.created_at || quote.createdAt)} by {customer?.name || 'Customer'}
                      </p>
                    </div>
                  </div>
                  {quote.status === 'Accepted' && (
                    <div className="flex items-start">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-900">Quote accepted</p>
                        <p className="text-xs text-gray-500">
                          {formatDate(quote.updated_at)} by {customer?.name || 'Customer'}
                        </p>
                      </div>
                    </div>
                  )}
                  {quote.status === 'Rejected' && (
                    <div className="flex items-start">
                      <XIcon className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-900">Quote rejected</p>
                        <p className="text-xs text-gray-500">
                          {formatDate(quote.updated_at)} by {customer?.name || 'Customer'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
          
          <div className="space-y-6">
            {/* Actions Card */}
            <Card>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Actions
              </h3>
              {!isStaffView && quote.status === 'Pending' && (
                <>
                  <Button
                    variant="primary"
                    className="w-full mb-3"
                    onClick={handleAcceptQuote}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Processing...' : 'Accept Quote'}
                  </Button>
                  <Button
                    variant="danger"
                    className="w-full mb-3"
                    onClick={() => setShowDeclineModal(true)}
                  >
                    Decline Quote
                  </Button>
                </>
              )}
              {!isStaffView && quote.status === 'Finalized' && (
                <>
                  <Button
                    variant="primary"
                    className="w-full mb-3"
                    onClick={handleAcceptQuote}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Processing...' : 'Accept Quote'}
                  </Button>
                  <Button
                    variant="danger"
                    className="w-full mb-3"
                    onClick={() => setShowDeclineModal(true)}
                  >
                    Decline Quote
                  </Button>
                </>
              )}
              {quote.status === 'Accepted' && (
                <div className="text-center py-4">
                  <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Quote has been accepted</p>
                </div>
              )}
              {quote.status === 'Rejected' && (
                <div className="text-center py-4">
                  <XIcon className="h-12 w-12 text-red-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Quote has been declined</p>
                </div>
              )}
              <Button variant="tertiary" className="w-full">
                Duplicate Quote
              </Button>
            </Card>
            
            {/* Timeline Card */}
            <Card>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Timeline
              </h3>
              <div className="space-y-3">
                <div className="flex items-start">
                  <FileTextIcon className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">Quote created</p>
                    <p className="text-xs text-gray-500">
                      {formatDate(quote.created_at || quote.createdAt)} by {customer?.name || 'Customer'}
                    </p>
                  </div>
                </div>
                {quote.status !== 'Pending' && (
                  <div className="flex items-start">
                    <ClockIcon className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">
                        Quote {quote.status.toLowerCase()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(quote.updated_at)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}
      
      {activeTab === 'documents' && (
        <Card>
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Documents
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <div className="flex items-center">
                <FileTextIcon className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Quote Document
                  </p>
                  <p className="text-xs text-gray-500">PDF • Generated on {formatDate(quote.created_at || quote.createdAt)}</p>
                </div>
              </div>
              <Button variant="tertiary" size="sm" onClick={generateQuotePDF}>
                <DownloadIcon className="h-4 w-4 mr-1" />
                Download
              </Button>
            </div>
            {quoteRequest?.documents?.map((doc: any, index: number) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-gray-200">
                <div className="flex items-center">
                  <FileTextIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {doc.name || `Document ${index + 1}`}
                    </p>
                    <p className="text-xs text-gray-500">{doc.type || 'Unknown'} • {doc.size || 'N/A'}</p>
                  </div>
                </div>
                <Button variant="tertiary" size="sm">
                  <DownloadIcon className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}
      
      {/* Decline Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Decline Quote
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for declining this quote. This will help us improve our service.
            </p>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="Enter your reason here..."
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
            />
            <div className="flex justify-end gap-3 mt-4">
              <Button
                variant="tertiary"
                onClick={() => setShowDeclineModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDeclineQuote}
                disabled={isLoading}
              >
                {isLoading ? 'Declining...' : 'Decline Quote'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};