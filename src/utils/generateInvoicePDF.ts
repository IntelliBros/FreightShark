import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Extend jsPDF type
declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable: {
      finalY: number;
    };
  }
}

export const generateInvoicePDF = (shipment: any, invoice: any) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  // Colors
  const primaryColor = '#2563EB'; // Blue
  const darkColor = '#1F2937';
  const grayColor = '#6B7280';
  const lightGray = '#F9FAFB';
  
  // Minimal header - just company name and invoice title
  doc.setTextColor(37, 99, 235);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('FREIGHT SHARK', 20, 25);
  
  // Invoice title on the right
  doc.setTextColor(31, 41, 55);
  doc.setFontSize(20);
  doc.text('INVOICE', pageWidth - 20, 25, { align: 'right' });
  
  // Thin accent line
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(0.5);
  doc.line(20, 32, pageWidth - 20, 32);
  
  // Invoice details section - more compact
  let yPos = 42;
  
  // Invoice metadata in a clean grid
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);

  // Left side - Invoice details
  doc.text('Invoice #', 20, yPos);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  doc.text(invoice.invoice_number || invoice.id || `INV-${shipment.id}`, 20, yPos + 5);

  // Center - Date
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text('Date', 80, yPos);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  const invoiceDate = invoice.issue_date || invoice.createdAt || invoice.created_at || new Date().toISOString();
  doc.text(new Date(invoiceDate).toLocaleDateString(), 80, yPos + 5);

  // Right side - Status
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text('Status', pageWidth - 60, yPos);
  if (invoice.status === 'Paid') {
    doc.setTextColor(16, 185, 129); // Green
    doc.setFont('helvetica', 'bold');
    doc.text('PAID', pageWidth - 60, yPos + 5);
  } else {
    doc.setTextColor(239, 68, 68); // Red
    doc.setFont('helvetica', 'bold');
    doc.text('PENDING', pageWidth - 60, yPos + 5);
  }
  doc.setTextColor(31, 41, 55);
  
  // Billing and Shipping Information - cleaner layout
  yPos += 15;
  
  // Bill To - no background
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(107, 114, 128);
  doc.text('BILL TO', 20, yPos);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(31, 41, 55);
  doc.setFontSize(10);
  doc.text(shipment.customer?.company || 'Customer Company', 20, yPos + 6);
  doc.setFontSize(9);
  doc.text(shipment.customer?.name || 'Customer Name', 20, yPos + 11);
  doc.text(shipment.customer?.email || 'customer@email.com', 20, yPos + 16);
  if (shipment.customer?.phone) {
    doc.text(shipment.customer.phone, 20, yPos + 21);
  }
  
  // Ship From - on the right
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(107, 114, 128);
  doc.text('SHIP FROM', 110, yPos);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(31, 41, 55);
  doc.setFontSize(9);
  const supplierLines = shipment.origin ? shipment.origin.split(',').slice(0, 3) : ['Supplier Address'];
  supplierLines.forEach((line: string, index: number) => {
    doc.text(line.trim(), 110, yPos + 6 + (index * 5));
  });
  
  // Shipment reference numbers - inline
  yPos += 30;
  
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text(`Shipment: ${shipment.id}`, 20, yPos);
  doc.text(`Quote: ${shipment.quoteId || 'N/A'}`, pageWidth - 80, yPos);
  
  // Line items table
  yPos += 10;
  
  // Simple line separator before table
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.2);
  doc.line(20, yPos - 2, pageWidth - 20, yPos - 2);
  
  // Prepare table data
  const tableData: any[] = [];
  
  // Add warehouse charges
  if (invoice.warehouseDetails && invoice.warehouseDetails.length > 0) {
    invoice.warehouseDetails.forEach((warehouse: any) => {
      tableData.push([
        `${warehouse.warehouse} - Freight Charges`,
        warehouse.soNumber || 'N/A',
        `${warehouse.cartons} cartons`,
        `${warehouse.chargeableWeight} kg @ $${warehouse.ratePerKg}/kg`,
        `$${warehouse.subtotal.toFixed(2)}`
      ]);
    });
  }
  
  // Add additional services
  if (invoice.additionalServices && invoice.additionalServices.length > 0) {
    invoice.additionalServices.forEach((service: any) => {
      tableData.push([
        service.description,
        '-',
        '-',
        'Service Charge',
        `$${service.amount.toFixed(2)}`
      ]);
    });
  }
  
  // Add adjustments
  if (invoice.adjustments && invoice.adjustments.length > 0) {
    invoice.adjustments.forEach((adjustment: any) => {
      tableData.push([
        adjustment.description,
        '-',
        '-',
        'Adjustment',
        `$${adjustment.amount.toFixed(2)}`
      ]);
    });
  }
  
  // Generate the table with minimal styling
  autoTable(doc, {
    startY: yPos + 3,
    head: [['Description', 'SO Number', 'Qty', 'Details', 'Amount']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [249, 250, 251],
      textColor: [75, 85, 99],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left'
    },
    bodyStyles: {
      textColor: [31, 41, 55],
      fontSize: 8
    },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 30 },
      2: { cellWidth: 15 },
      3: { cellWidth: 40 },
      4: { halign: 'right', cellWidth: 25 }
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251]
    },
    margin: { left: 20, right: 20 }
  });
  
  // Total section - cleaner
  yPos = doc.lastAutoTable.finalY + 5;
  
  // Separator line
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.2);
  doc.line(pageWidth - 100, yPos, pageWidth - 20, yPos);
  
  yPos += 8;
  const totalBoxX = pageWidth - 90;
  const totalBoxWidth = 70;
  
  // Subtotal
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text('Subtotal', totalBoxX, yPos);
  doc.setTextColor(31, 41, 55);
  const subtotalAmount = invoice.subtotal || invoice.amount || invoice.total_amount || invoice.totalAmount || 0;
  doc.text(`$${Number(subtotalAmount).toFixed(2)}`, totalBoxX + totalBoxWidth, yPos, { align: 'right' });

  // Tax
  yPos += 6;
  doc.setTextColor(107, 114, 128);
  doc.text('Tax', totalBoxX, yPos);
  doc.setTextColor(31, 41, 55);
  const taxAmount = invoice.tax || 0;
  doc.text(`$${Number(taxAmount).toFixed(2)}`, totalBoxX + totalBoxWidth, yPos, { align: 'right' });

  // Total amount - emphasized but not with background
  yPos += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(37, 99, 235);
  doc.text('Total', totalBoxX, yPos);
  doc.setFontSize(12);
  const totalAmount = invoice.total_amount || invoice.totalAmount || invoice.amount || (Number(subtotalAmount) + Number(taxAmount));
  doc.text(`$${Number(totalAmount).toFixed(2)}`, totalBoxX + totalBoxWidth, yPos, { align: 'right' });
  
  // Notes section
  if (invoice.notes) {
    yPos += 20;
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('NOTES:', 20, yPos);
    
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(31, 41, 55);
    const noteLines = doc.splitTextToSize(invoice.notes, pageWidth - 40);
    doc.text(noteLines, 20, yPos);
    yPos += noteLines.length * 4;
  }
  
  // Payment instructions - subtle
  if (invoice.status !== 'Paid') {
    yPos += 20;
    
    doc.setDrawColor(239, 68, 68); // Red border
    doc.setLineWidth(0.3);
    doc.line(20, yPos - 2, 25, yPos - 2);
    
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT DUE', 20, yPos + 3);
    
    doc.setFont('helvetica', 'normal');
    doc.text('Please remit payment to avoid delays in shipment processing.', 20, yPos + 8);
  }
  
  // Footer - minimal
  const footerY = pageHeight - 15;
  
  doc.setTextColor(156, 163, 175);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Freight Shark | www.freightshark.com | support@freightshark.com', pageWidth / 2, footerY, { align: 'center' });
  
  // Save the PDF
  const invoiceNumber = invoice.invoice_number || invoice.id || `INV-${shipment.id}`;
  doc.save(`Invoice_${invoiceNumber}_${shipment.id}.pdf`);
};