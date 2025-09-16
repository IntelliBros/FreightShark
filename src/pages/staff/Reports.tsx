import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { ChevronUpIcon, ChevronDownIcon, FilterIcon, DownloadIcon, SearchIcon, EyeIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DataService } from '../../services/DataService';

type SortField = 'id' | 'customer' | 'origin' | 'destination' | 'status' | 'createdAt' | 'deliveryDate' | 'actualWeight' | 'invoice';
type SortDirection = 'asc' | 'desc';

export const Reports = () => {
  const { shipments, quoteRequests, quotes } = useData();
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [users, setUsers] = useState<any[]>([]);

  // Fetch users on mount
  React.useEffect(() => {
    DataService.getUsers().then(setUsers);
  }, []);

  // Process shipments data - expand each shipment into multiple rows per warehouse
  const processedShipments = useMemo(() => {
    const rows: any[] = [];
    
    shipments.forEach(shipment => {
      
      const customer = users.find(u => u.id === shipment.customerId);
      const quoteRequest = quoteRequests.find(req => 
        req.customerId === shipment.customerId && 
        req.status === 'Quote Accepted'
      );
      
      // Find the accepted quote for this shipment to get the locked-in commission rate
      const acceptedQuote = quotes.find((q: any) => 
        q.id === shipment.quoteId && q.status === 'Accepted'
      );
      if (!acceptedQuote && shipment.quoteId) {
        console.log('No accepted quote found for shipment:', shipment.id, 'with quoteId:', shipment.quoteId);
      }
      const commissionRatePerKg = acceptedQuote?.commissionRatePerKg || 0.50; // Default to $0.50 if not found
      
      const origin = quoteRequest?.supplierDetails?.city 
        ? `${quoteRequest.supplierDetails.city}, ${quoteRequest.supplierDetails.country}`
        : 'China';
      
      // Determine invoice status based on invoice data
      let invoiceStatus = 'Not Created';
      if (shipment.invoice) {
        // Check the actual status field first
        if (shipment.invoice.status) {
          invoiceStatus = shipment.invoice.status;
        } else if (shipment.invoice.id && shipment.invoice.createdAt) {
          // If invoice exists but no explicit status, it's pending
          invoiceStatus = 'Pending';
        }
      }
      
      // Determine display status - override with "Missing Shipment IDs" if invoice is paid but IDs are missing
      let displayStatus = shipment.status;
      if (invoiceStatus === 'Paid' && shipment.status !== 'In Transit' && shipment.status !== 'Delivered') {
        // Check if any destination is missing shipment IDs
        const hasMissingIds = (shipment.destinations || []).some((d: any) => 
          !d.amazonShipmentId || d.amazonShipmentId === ''
        );
        if (hasMissingIds) {
          displayStatus = 'Missing Shipment IDs';
        }
      }
      
      const invoiceAmount = shipment.invoice?.totalAmount || shipment.invoice?.amount || 0;
      
      // Debug logging for FS-00013
      if (shipment.id === 'FS-00013') {
        console.log('FS-00013 Debug:', {
          shipment,
          invoice: shipment.invoice,
          destinations: shipment.destinations,
          invoiceStatus,
          displayStatus
        });
      }
      
      // If shipment has no destinations, create a single row with data from invoice if available
      let destinations = shipment.destinations && shipment.destinations.length > 0 
        ? shipment.destinations 
        : null;
      
      // If no destinations, try to get data from invoice warehouse details
      if (!destinations) {
        let placeholderDestination: any = {
          fbaWarehouse: '-',
          id: null,
          cartons: 0,
          estimatedWeight: 0,
          actualWeight: null,
          soNumber: null,
          amazonReferenceId: null,
          amazonShipmentId: null
        };
        
        // If invoice exists with warehouse details, use that data
        if (shipment.invoice?.warehouseDetails?.[0]) {
          const firstWarehouse = shipment.invoice.warehouseDetails[0];
          placeholderDestination.cartons = firstWarehouse.cartons || firstWarehouse.totalCartons || 0;
          placeholderDestination.estimatedWeight = firstWarehouse.chargeableWeight || firstWarehouse.actualWeight || 0;
          placeholderDestination.actualWeight = firstWarehouse.actualWeight || null;
        }
        
        destinations = [placeholderDestination];
      }
      
      // Create a row for each destination warehouse
      destinations.forEach((dest: any, index: number) => {
        const warehouseSuffix = (shipment.destinations?.length || 0) > 1 ? `-${index + 1}` : '';
        
        // Find the delivered event if status is Delivered
        let deliveryDate: Date | null = null;
        if (shipment.status === 'Delivered' && shipment.trackingEvents) {
          const deliveredEvent = shipment.trackingEvents
            .filter((event: any) => 
              event.description?.toLowerCase().includes('delivered') ||
              event.status?.toLowerCase() === 'delivered'
            )
            .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
          
          if (deliveredEvent) {
            deliveryDate = new Date(deliveredEvent.date);
          }
        }
        
        // Find the warehouse-specific invoice amount and chargeable weight
        let warehouseInvoiceAmount = null;
        let chargeableWeight = null;
        let invoicedActualWeight = null;
        
        // Debug logging for FS-00013
        if (shipment.id === 'FS-00013') {
          console.log('FS-00013 Invoice extraction for dest:', dest, {
            hasInvoice: !!shipment.invoice,
            invoiceId: shipment.invoice?.id,
            invoiceCreatedAt: shipment.invoice?.createdAt,
            warehouseDetails: shipment.invoice?.warehouseDetails
          });
        }
        
        if (shipment.invoice && shipment.invoice.id && shipment.invoice.createdAt) {
          if (shipment.invoice.warehouseDetails && shipment.invoice.warehouseDetails.length > 0) {
            // Debug log for FS-00013
            if (shipment.id === 'FS-00013') {
              console.log('FS-00013 Processing warehouse details:', {
                destFbaWarehouse: dest.fbaWarehouse,
                destId: dest.id,
                index,
                warehouseDetailsCount: shipment.invoice.warehouseDetails.length,
                firstWarehouseDetail: shipment.invoice.warehouseDetails[0]
              });
            }
            
            // Always use invoice data, regardless of destination matching
            // This handles cases where destinations were added after invoice creation
            let warehouseDetail = null;
            
            // If there's only one warehouse detail in invoice, always use it
            if (shipment.invoice.warehouseDetails.length === 1) {
              warehouseDetail = shipment.invoice.warehouseDetails[0];
              if (shipment.id === 'FS-00013') {
                console.log('FS-00013: Using single warehouse detail from invoice');
              }
            } else {
              // For multiple warehouse details, try to match first
              warehouseDetail = shipment.invoice.warehouseDetails.find((wd: any) => 
                wd.warehouse === dest.fbaWarehouse || 
                wd.warehouseId === dest.id
              );
              
              // If no match, use index-based fallback
              if (!warehouseDetail && index < shipment.invoice.warehouseDetails.length) {
                warehouseDetail = shipment.invoice.warehouseDetails[index];
                if (shipment.id === 'FS-00013') {
                  console.log('FS-00013: Using index-based warehouse detail');
                }
              }
            }
            
            if (warehouseDetail) {
              warehouseInvoiceAmount = warehouseDetail.subtotal || warehouseDetail.amount || null;
              chargeableWeight = warehouseDetail.chargeableWeight || null;
              invoicedActualWeight = warehouseDetail.actualWeight || null;
              
              if (shipment.id === 'FS-00013') {
                console.log('FS-00013: Extracted from warehouse detail:', {
                  warehouseInvoiceAmount,
                  chargeableWeight,
                  invoicedActualWeight
                });
              }
            }
          }
          
          // If still no invoice amount found, check the invoice totals directly
          if (!warehouseInvoiceAmount && shipment.invoice) {
            warehouseInvoiceAmount = shipment.invoice.amount || shipment.invoice.total || shipment.invoice.totalAmount || null;
            
            // Try to get total chargeable weight from invoice
            if (!chargeableWeight) {
              chargeableWeight = shipment.invoice.totalChargeableWeight || 
                                shipment.invoice.chargeableWeight ||
                                (shipment.invoice.warehouseDetails?.[0]?.chargeableWeight) || 
                                null;
            }
            
            // Try to get total actual weight
            if (!invoicedActualWeight) {
              invoicedActualWeight = shipment.invoice.totalActualWeight || 
                                    shipment.invoice.actualWeight ||
                                    (shipment.invoice.warehouseDetails?.[0]?.actualWeight) || 
                                    null;
            }
          }
        }
        
        // Debug logging for FS-00013 - what was extracted
        if (shipment.id === 'FS-00013') {
          console.log('FS-00013 Extracted invoice data:', {
            warehouseInvoiceAmount,
            chargeableWeight,
            invoicedActualWeight
          });
        }
        
        // Calculate commission ONLY on invoiced chargeable weight, not estimates
        const warehouseCommission = chargeableWeight ? (chargeableWeight * commissionRatePerKg) : null;
        
        // Get the quote weight for this warehouse from the accepted quote
        let quoteWeight = null;
        if (acceptedQuote && acceptedQuote.warehouseRates && acceptedQuote.warehouseRates.length > 0) {
          if (shipment.id === 'FS-00013') {
            console.log('FS-00013 Quote warehouse rates:', acceptedQuote.warehouseRates);
          }
          
          // Always try to use quote data, even if destinations don't match
          let warehouseRate = null;
          
          // If there's only one warehouse rate, always use it
          if (acceptedQuote.warehouseRates.length === 1) {
            warehouseRate = acceptedQuote.warehouseRates[0];
            if (shipment.id === 'FS-00013') {
              console.log('FS-00013: Using single warehouse rate from quote');
            }
          } else {
            // For multiple rates, try to match first
            warehouseRate = acceptedQuote.warehouseRates.find((wr: any) => 
              wr.warehouseId === dest.id || wr.warehouse === dest.fbaWarehouse
            );
            
            // If no match, use index-based fallback
            if (!warehouseRate && index < acceptedQuote.warehouseRates.length) {
              warehouseRate = acceptedQuote.warehouseRates[index];
              if (shipment.id === 'FS-00013') {
                console.log('FS-00013: Using index-based warehouse rate');
              }
            }
          }
          
          if (warehouseRate) {
            quoteWeight = warehouseRate.chargeableWeight || warehouseRate.weight || null;
            if (shipment.id === 'FS-00013') {
              console.log('FS-00013: Extracted quote weight:', quoteWeight);
            }
          }
        }
        
        // Final debug log for FS-00013
        if (shipment.id === 'FS-00013') {
          console.log('FS-00013 Destination data:', dest);
          console.log('FS-00013 Final row data:', {
            totalCartons: dest.cartons || dest.actualCartons || dest.estimatedCartons || (shipment.invoice?.warehouseDetails?.[0]?.cartons) || (shipment.invoice?.warehouseDetails?.[0]?.totalCartons) || 0,
            displayWeight: dest.chargeableWeight || dest.actualWeight || dest.weight || null,
            quoteWeight,
            finalInvoiceAmount: warehouseInvoiceAmount,
            commission: warehouseCommission
          });
        }
        
        rows.push({
          id: `${shipment.id}${warehouseSuffix}`,
          parentShipmentId: shipment.id,
          warehouseIndex: index + 1,
          totalWarehouses: shipment.destinations?.length || 0,
          customer: customer?.name || 'Unknown',
          customerId: shipment.customerId,
          origin,
          destination: dest.fbaWarehouse,
          status: displayStatus,
          createdAt: new Date(shipment.createdAt),
          deliveryDate: deliveryDate,
          isDelivered: shipment.status === 'Delivered',
          // Try to get cartons from multiple sources - destination data, invoice data, or quote data
          totalCartons: dest.cartons || 
                       dest.actualCartons || 
                       dest.estimatedCartons || 
                       (shipment.invoice?.warehouseDetails?.[0]?.cartons) ||
                       (shipment.invoice?.warehouseDetails?.[0]?.totalCartons) ||
                       0,
          totalWeight: dest.estimatedWeight || dest.weight || dest.grossWeight || 0,
          actualWeight: dest.actualWeight || null,
          // Use chargeable weight from destination data (this is what should be shown in Weight column)
          displayWeight: dest.chargeableWeight || dest.actualWeight || dest.weight || null,
          quoteWeight: quoteWeight, // Weight used in the original quote
          soNumber: dest.soNumber || '-',
          amazonReferenceId: dest.amazonReferenceId || '-',
          invoiceStatus,
          // Show warehouse-specific invoice amount from staff-generated invoice
          finalInvoiceAmount: warehouseInvoiceAmount,
          commission: warehouseCommission,
          commissionRate: commissionRatePerKg,
          missingShipmentId: shipment.invoice?.status === 'Paid' && 
            (!dest.amazonShipmentId || dest.amazonShipmentId === ''),
          amazonShipmentId: dest.amazonShipmentId || '-',
          trackingEvents: shipment.trackingEvents,
          documents: shipment.documents
        });
      });
    });
    
    return rows;
  }, [shipments, quoteRequests, users]);

  // Filter and sort shipments
  const filteredAndSortedShipments = useMemo(() => {
    let filtered = processedShipments;
    
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(shipment => 
        shipment.id.toLowerCase().includes(search) ||
        shipment.parentShipmentId.toLowerCase().includes(search) ||
        shipment.customer.toLowerCase().includes(search) ||
        shipment.origin.toLowerCase().includes(search) ||
        shipment.destination.toLowerCase().includes(search) ||
        shipment.soNumber.toLowerCase().includes(search) ||
        shipment.amazonShipmentId.toLowerCase().includes(search) ||
        shipment.amazonReferenceId.toLowerCase().includes(search)
      );
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(shipment => shipment.status === statusFilter);
    }
    
    // Sort
    const sorted = [...filtered].sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];
      
      if (sortField === 'invoice') {
        aValue = a.finalInvoiceAmount || 0;
        bValue = b.finalInvoiceAmount || 0;
      }
      
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sorted;
  }, [processedShipments, searchTerm, statusFilter, sortField, sortDirection]);

  // Calculate summary totals
  const summaryTotals = useMemo(() => {
    const totals = {
      rowCount: 0,
      cartons: 0,
      weight: 0,
      invoiceAmount: 0,
      commission: 0
    };
    
    filteredAndSortedShipments.forEach(shipment => {
      totals.rowCount++;
      totals.cartons += shipment.totalCartons || 0;
      totals.weight += shipment.displayWeight || 0;
      totals.invoiceAmount += shipment.finalInvoiceAmount || 0;
      totals.commission += shipment.commission || 0;
    });
    
    return totals;
  }, [filteredAndSortedShipments]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered': return 'text-green-700 bg-green-50';
      case 'In Transit': 
      case 'In Progress': return 'text-blue-700 bg-blue-50';
      case 'Customs': return 'text-orange-700 bg-orange-50';
      case 'Awaiting Pickup': 
      case 'Booking Confirmed': return 'text-yellow-700 bg-yellow-50';
      case 'Pending':
      case 'Pending Payment': return 'text-amber-700 bg-amber-50';
      case 'Missing Shipment IDs': return 'text-red-700 bg-red-50';
      default: return 'text-gray-700 bg-gray-50';
    }
  };

  const getInvoiceStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'text-green-700 bg-green-50';
      case 'Pending': return 'text-yellow-700 bg-yellow-50';
      case 'Overdue': return 'text-red-700 bg-red-50';
      case 'Not Created': return 'text-gray-500 bg-gray-50';
      default: return 'text-gray-700 bg-gray-50';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      year: '2-digit',
      month: '2-digit', 
      day: '2-digit' 
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const truncateText = (text: string, maxLength: number = 50) => {
    if (!text || text === '-') return text;
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const exportToCSV = () => {
    const headers = ['Shipment ID', 'SO Number', 'Customer', 'Origin', 'Destination', 'Status', 'Created', 'Delivered', 'Cartons', 'Weight (kg)', 'Quote Weight (kg)', 'Reference ID', 'Amazon ID', 'Invoice Status', 'Final Invoice Amount', 'Commission Rate', 'Commission'];
    const rows = filteredAndSortedShipments.map(s => [
      s.id,
      s.soNumber,
      s.customer,
      s.origin,
      s.destination,
      s.status,
      formatDate(s.createdAt),
      s.deliveryDate ? formatDate(s.deliveryDate) : '-',
      s.totalCartons,
      s.displayWeight ? `${s.displayWeight.toFixed(2)}` : '-',
      s.quoteWeight ? `${s.quoteWeight.toFixed(2)}` : '-',
      s.amazonReferenceId,
      s.amazonShipmentId,
      s.invoiceStatus,
      s.finalInvoiceAmount ? formatCurrency(s.finalInvoiceAmount) : '-',
      `$${(s.commissionRate || 0.50).toFixed(2)}/kg`,
      s.commission ? formatCurrency(s.commission) : '-'
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shipments-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <div className="opacity-40">
        <ChevronUpIcon className="h-3 w-3 -mb-1" />
        <ChevronDownIcon className="h-3 w-3" />
      </div>;
    }
    return sortDirection === 'asc' 
      ? <ChevronUpIcon className="h-3 w-3 text-blue-600" />
      : <ChevronDownIcon className="h-3 w-3 text-blue-600" />;
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Shipments Report</h1>
            <p className="text-sm text-gray-500 mt-1">Complete overview of all shipments</p>
          </div>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <DownloadIcon className="h-4 w-4" />
            <span className="text-sm font-medium">Export CSV</span>
          </button>
        </div>
        
        {/* Filters */}
        <div className="flex gap-3">
          <div className="relative flex-1 max-w-md">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search shipments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Awaiting Pickup">Awaiting Pickup</option>
            <option value="In Transit">In Transit</option>
            <option value="In Progress">In Progress</option>
            <option value="Customs">Customs</option>
            <option value="Delivered">Delivered</option>
          </select>
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
            <FilterIcon className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">{filteredAndSortedShipments.length} records</span>
          </div>
        </div>
      </div>
      
      {/* Table */}
      <div className="flex-1 overflow-auto relative">
        <div className="overflow-x-auto">
          <table className="w-auto min-w-full relative">
            <thead className="bg-gray-50 sticky top-0 z-10 border-b border-gray-200">
            {/* Summary Row */}
            {filteredAndSortedShipments.length > 0 && (
              <tr className="bg-white border-b-2 border-gray-300">
                <td className="px-3 py-2 max-w-[300px] sticky left-0 z-20 bg-white border-r border-gray-200">
                  <span className="text-sm font-semibold text-gray-900 block truncate">{summaryTotals.rowCount} rows</span>
                </td>
                <td className="px-3 py-2 max-w-[300px]">
                  <span className="text-sm font-semibold text-gray-600 block truncate">-</span>
                </td>
                <td className="px-3 py-2 max-w-[300px]">
                  <span className="text-sm font-semibold text-gray-600 block truncate">-</span>
                </td>
                <td className="px-3 py-2 max-w-[300px]">
                  <span className="text-sm font-semibold text-gray-600 block truncate">-</span>
                </td>
                <td className="px-3 py-2 max-w-[300px]">
                  <span className="text-sm font-semibold text-gray-600 block truncate">-</span>
                </td>
                <td className="px-3 py-2">
                  <span className="text-sm font-semibold text-gray-600">-</span>
                </td>
                <td className="px-3 py-2">
                  <span className="text-sm font-semibold text-gray-600 whitespace-nowrap">-</span>
                </td>
                <td className="px-3 py-2">
                  <span className="text-sm font-semibold text-gray-600 whitespace-nowrap">-</span>
                </td>
                <td className="px-3 py-2">
                  <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">{summaryTotals.cartons}</span>
                </td>
                <td className="px-3 py-2">
                  <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">{summaryTotals.weight.toFixed(2)} kg</span>
                </td>
                <td className="px-3 py-2">
                  <span className="text-sm font-semibold text-gray-600">-</span>
                </td>
                <td className="px-3 py-2 max-w-[300px]">
                  <span className="text-sm font-semibold text-gray-600 block truncate">-</span>
                </td>
                <td className="px-3 py-2 max-w-[300px]">
                  <span className="text-sm font-semibold text-gray-600 block truncate">-</span>
                </td>
                <td className="px-3 py-2">
                  <span className="text-sm font-semibold text-gray-600">-</span>
                </td>
                <td className="px-3 py-2">
                  <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">{formatCurrency(summaryTotals.invoiceAmount)}</span>
                </td>
                <td className="px-3 py-2">
                  <span className="text-sm font-semibold text-gray-600 whitespace-nowrap">-</span>
                </td>
                <td className="px-3 py-2">
                  <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">{formatCurrency(summaryTotals.commission)}</span>
                </td>
                <td className="px-3 py-2">
                  <span className="text-sm font-semibold text-gray-600">-</span>
                </td>
              </tr>
            )}
            <tr>
              <th className="px-3 py-3 text-left sticky left-0 z-20 bg-gray-50 border-r border-gray-200">
                <button
                  onClick={() => handleSort('id')}
                  className="flex items-center gap-1 text-xs font-medium text-gray-700 hover:text-gray-900 whitespace-nowrap"
                >
                  Shipment ID
                  <SortIcon field="id" />
                </button>
              </th>
              <th className="px-3 py-3 text-left">
                <span className="text-xs font-medium text-gray-700 whitespace-nowrap">SO Number</span>
              </th>
              <th className="px-3 py-3 text-left">
                <button
                  onClick={() => handleSort('customer')}
                  className="flex items-center gap-1 text-xs font-medium text-gray-700 hover:text-gray-900 whitespace-nowrap"
                >
                  Customer
                  <SortIcon field="customer" />
                </button>
              </th>
              <th className="px-3 py-3 text-left">
                <button
                  onClick={() => handleSort('origin')}
                  className="flex items-center gap-1 text-xs font-medium text-gray-700 hover:text-gray-900 whitespace-nowrap"
                >
                  Origin
                  <SortIcon field="origin" />
                </button>
              </th>
              <th className="px-3 py-3 text-left">
                <button
                  onClick={() => handleSort('destination')}
                  className="flex items-center gap-1 text-xs font-medium text-gray-700 hover:text-gray-900 whitespace-nowrap"
                >
                  Destination
                  <SortIcon field="destination" />
                </button>
              </th>
              <th className="px-3 py-3 text-left">
                <button
                  onClick={() => handleSort('status')}
                  className="flex items-center gap-1 text-xs font-medium text-gray-700 hover:text-gray-900 whitespace-nowrap"
                >
                  Status
                  <SortIcon field="status" />
                </button>
              </th>
              <th className="px-3 py-3 text-left">
                <button
                  onClick={() => handleSort('createdAt')}
                  className="flex items-center gap-1 text-xs font-medium text-gray-700 hover:text-gray-900 whitespace-nowrap"
                >
                  Created
                  <SortIcon field="createdAt" />
                </button>
              </th>
              <th className="px-3 py-3 text-left">
                <button
                  onClick={() => handleSort('deliveryDate')}
                  className="flex items-center gap-1 text-xs font-medium text-gray-700 hover:text-gray-900 whitespace-nowrap"
                >
                  Delivered
                  <SortIcon field="deliveryDate" />
                </button>
              </th>
              <th className="px-3 py-3 text-left">
                <span className="text-xs font-medium text-gray-700 whitespace-nowrap">Cartons</span>
              </th>
              <th className="px-3 py-3 text-left">
                <button
                  onClick={() => handleSort('actualWeight')}
                  className="flex items-center gap-1 text-xs font-medium text-gray-700 hover:text-gray-900 whitespace-nowrap"
                >
                  Weight
                  <SortIcon field="actualWeight" />
                </button>
              </th>
              <th className="px-3 py-3 text-left">
                <span className="text-xs font-medium text-gray-700 whitespace-nowrap">Quote Weight</span>
              </th>
              <th className="px-3 py-3 text-left">
                <span className="text-xs font-medium text-gray-700 whitespace-nowrap">Reference ID</span>
              </th>
              <th className="px-3 py-3 text-left">
                <span className="text-xs font-medium text-gray-700 whitespace-nowrap">Amazon ID</span>
              </th>
              <th className="px-3 py-3 text-left">
                <span className="text-xs font-medium text-gray-700 whitespace-nowrap">Invoice Status</span>
              </th>
              <th className="px-3 py-3 text-left">
                <button
                  onClick={() => handleSort('invoice')}
                  className="flex items-center gap-1 text-xs font-medium text-gray-700 hover:text-gray-900 whitespace-nowrap"
                >
                  Final Invoice
                  <SortIcon field="invoice" />
                </button>
              </th>
              <th className="px-3 py-3 text-left">
                <span className="text-xs font-medium text-gray-700 whitespace-nowrap">Commission Rate</span>
              </th>
              <th className="px-3 py-3 text-left">
                <span className="text-xs font-medium text-gray-700 whitespace-nowrap">Commission</span>
              </th>
              <th className="px-3 py-3 text-left">
                <span className="text-xs font-medium text-gray-700 whitespace-nowrap">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedShipments.map((shipment, index) => (
              <tr 
                key={shipment.id} 
                className={`${
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                } hover:bg-blue-50 transition-colors border-b border-gray-100`}
              >
                <td className={`px-3 py-3 max-w-[300px] sticky left-0 z-10 border-r border-gray-200 ${
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                }`}>
                  <span className="text-sm font-medium text-gray-900 block truncate" title={shipment.id}>
                    {truncateText(shipment.id)}
                  </span>
                </td>
                <td className="px-3 py-3 max-w-[300px]">
                  <span className="text-sm text-gray-600 font-mono text-xs block truncate" title={shipment.soNumber}>
                    {truncateText(shipment.soNumber)}
                  </span>
                </td>
                <td className="px-3 py-3 max-w-[300px]">
                  <span className="text-sm text-gray-900 block truncate" title={shipment.customer}>
                    {truncateText(shipment.customer)}
                  </span>
                </td>
                <td className="px-3 py-3 max-w-[300px]">
                  <span className="text-sm text-gray-600 block truncate" title={shipment.origin}>
                    {truncateText(shipment.origin)}
                  </span>
                </td>
                <td className="px-3 py-3 max-w-[300px]">
                  <span className="text-sm text-gray-600 block truncate" title={shipment.destination}>
                    {truncateText(shipment.destination)}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${getStatusColor(shipment.status)}`}>
                      {shipment.status}
                    </span>
                    {shipment.missingShipmentId && (
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full text-red-700 bg-red-50 whitespace-nowrap">
                        Missing ID
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-3">
                  <span className="text-sm text-gray-600 whitespace-nowrap">{formatDate(shipment.createdAt)}</span>
                </td>
                <td className="px-3 py-3">
                  <span className={`text-sm whitespace-nowrap ${shipment.isDelivered ? 'text-green-700 font-medium' : 'text-gray-600'}`}>
                    {shipment.deliveryDate ? formatDate(shipment.deliveryDate) : '-'}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <span className="text-sm text-gray-900 whitespace-nowrap">{shipment.totalCartons}</span>
                </td>
                <td className="px-3 py-3">
                  {shipment.displayWeight ? (
                    <span className="text-sm text-gray-900 whitespace-nowrap">{shipment.displayWeight.toFixed(2)} kg</span>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </td>
                <td className="px-3 py-3">
                  {shipment.quoteWeight ? (
                    <span className="text-sm text-gray-900 whitespace-nowrap">{shipment.quoteWeight.toFixed(2)} kg</span>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </td>
                <td className="px-3 py-3 max-w-[300px]">
                  <span className="text-sm text-gray-600 font-mono text-xs block truncate" title={shipment.amazonReferenceId}>
                    {truncateText(shipment.amazonReferenceId)}
                  </span>
                </td>
                <td className="px-3 py-3 max-w-[300px]">
                  <span className="text-sm text-gray-600 font-mono text-xs block truncate" title={shipment.amazonShipmentId}>
                    {truncateText(shipment.amazonShipmentId)}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${getInvoiceStatusColor(shipment.invoiceStatus)}`}>
                    {shipment.invoiceStatus}
                  </span>
                </td>
                <td className="px-3 py-3">
                  {shipment.finalInvoiceAmount ? (
                    <span className="text-sm text-gray-900 whitespace-nowrap">
                      {formatCurrency(shipment.finalInvoiceAmount)}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </td>
                <td className="px-3 py-3">
                  <span className="text-sm text-gray-900 whitespace-nowrap">
                    ${(shipment.commissionRate || 0.50).toFixed(2)}/kg
                  </span>
                </td>
                <td className="px-3 py-3">
                  {shipment.commission ? (
                    <span className="text-sm text-gray-900 whitespace-nowrap">
                      {formatCurrency(shipment.commission)}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </td>
                <td className="px-3 py-3">
                  <Link
                    to={`/staff/shipments/${shipment.parentShipmentId}`}
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                  >
                    <EyeIcon className="h-4 w-4" />
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
        
      {filteredAndSortedShipments.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-gray-400 mb-4">
            <FilterIcon className="h-12 w-12" />
          </div>
          <p className="text-gray-600 text-lg font-medium">No shipments found</p>
          <p className="text-gray-500 text-sm mt-1">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
};