import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { FileTextIcon, FileIcon, DownloadIcon, UploadIcon, FolderIcon, SearchIcon, FilterIcon, MoreHorizontalIcon, PlusIcon, FileArchiveIcon } from 'lucide-react';
import { DataService } from '../../services/DataService';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContextV2';
import { useToast } from '../../context/ToastContext';
import { generateInvoicePDF } from '../../utils/generateInvoicePDF';

// Document type interface
interface Document {
  id: string;
  name: string;
  type: string;
  shipmentId: string;
  size: string;
  uploadedAt: string;
  uploadedBy: string;
  url?: string;
  shipmentData?: any; // Store reference to shipment for invoice generation
  invoiceData?: any; // Store invoice data for PDF generation
}

// Document type mapping for icons and colors
const DOCUMENT_TYPES = {
  invoice: {
    label: 'Commercial Invoice',
    color: 'blue'
  },
  'packing-list': {
    label: 'Packing List',
    color: 'green'
  },
  awb: {
    label: 'Air Waybill',
    color: 'purple'
  },
  customs: {
    label: 'Customs Documentation',
    color: 'orange'
  },
  pod: {
    label: 'Proof of Delivery',
    color: 'teal'
  }
};

export const DocumentsHub = () => {
  const { user } = useAuth();
  const { shipments, refreshShipments } = useData();
  const { addToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [activeView, setActiveView] = useState('list'); // 'list' or 'grid'
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDocuments();
  }, [shipments]);

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      console.log('📁 Loading documents from shipments...');
      console.log('📦 Total shipments:', shipments?.length || 0);
      console.log('👤 Current user:', user?.id, user?.role);

      // Collect all documents from all user's shipments
      const allDocuments: Document[] = [];

      if (shipments && shipments.length > 0) {
        // Filter shipments for current user if not staff/admin
        const userShipments = user?.role === 'customer'
          ? shipments.filter(s => {
              const isMatch = s.customerId === user.id || s.customer_id === user.id;
              console.log(`Checking shipment ${s.id}: customerId=${s.customerId || s.customer_id}, userId=${user.id}, match=${isMatch}`);
              return isMatch;
            })
          : shipments;

        console.log(`📊 Filtered to ${userShipments.length} shipments for user`);

        userShipments.forEach((shipment, index) => {
          console.log(`📦 Processing shipment ${index + 1}/${userShipments.length}: ${shipment.id}`);
          console.log('   Full shipment data:', shipment);

          // Add invoice if it exists - handle both embedded invoice data and status-only invoices
          console.log('   Checking for invoice:', shipment.invoice);
          if (shipment.invoice) {
            const invoiceData = shipment.invoice;
            console.log('   Found invoice data:', invoiceData);

            // Create a complete invoice object with all necessary fields
            const completeInvoice = {
              id: invoiceData.id || invoiceData.invoice_number || `INV-${shipment.id}`,
              invoice_number: invoiceData.invoice_number || invoiceData.id || `INV-${shipment.id}`,
              shipment_id: shipment.id,
              customer_id: shipment.customerId || shipment.customer_id,
              status: invoiceData.status || 'Pending',
              issue_date: invoiceData.issue_date || invoiceData.createdAt || invoiceData.created_at || new Date().toISOString(),
              due_date: invoiceData.due_date || invoiceData.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              subtotal: invoiceData.subtotal || invoiceData.amount || 0,
              tax: invoiceData.tax || 0,
              total_amount: invoiceData.total_amount || invoiceData.totalAmount || invoiceData.amount || 0,
              paid_amount: invoiceData.paid_amount || invoiceData.paidAmount || 0,
              payment_date: invoiceData.payment_date || invoiceData.paymentDate || invoiceData.paidDate,
              payment_method: invoiceData.payment_method || invoiceData.paymentMethod || 'Pending',
              notes: invoiceData.notes || '',
              createdAt: invoiceData.createdAt || invoiceData.created_at || new Date().toISOString(),
              ...invoiceData // Include any other fields that might exist
            };

            console.log('   ✅ Adding invoice document for shipment', shipment.id);
            allDocuments.push({
              id: `invoice-${shipment.id}`,
              name: `Invoice ${completeInvoice.invoice_number}.pdf`,
              type: 'invoice',
              shipmentId: shipment.id,
              size: 'PDF',
              uploadedAt: new Date(completeInvoice.issue_date).toISOString().split('T')[0],
              uploadedBy: 'System',
              url: '#', // We'll generate the PDF on download
              shipmentData: shipment,
              invoiceData: completeInvoice
            });
          }

          // Add any other documents uploaded by staff
          if (shipment.documents && Array.isArray(shipment.documents)) {
            console.log('   ✅ Adding', shipment.documents.length, 'additional documents for shipment', shipment.id);
            shipment.documents.forEach((doc: any) => {
              allDocuments.push({
                id: doc.id || `doc-${Date.now()}-${Math.random()}`,
                name: doc.name || 'Untitled Document',
                type: doc.type || 'document',
                shipmentId: shipment.id,
                size: doc.size || 'Unknown',
                uploadedAt: doc.uploadedAt || doc.uploaded_at || new Date().toISOString().split('T')[0],
                uploadedBy: doc.uploadedBy || doc.uploaded_by || 'Staff',
                url: doc.url
              });
            });
          }
        });
      }

      console.log('📁 Total documents collected:', allDocuments.length);
      setDocuments(allDocuments);
    } catch (error) {
      console.error('Error loading documents:', error);
      addToast('Failed to load documents', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.shipmentId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleSelection = (id: string) => {
    if (selectedDocuments.includes(id)) {
      setSelectedDocuments(selectedDocuments.filter(docId => docId !== id));
    } else {
      setSelectedDocuments([...selectedDocuments, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedDocuments.length === filteredDocuments.length) {
      setSelectedDocuments([]);
    } else {
      setSelectedDocuments(filteredDocuments.map(doc => doc.id));
    }
  };

  const handleDownloadDocument = (doc: Document) => {
    try {
      if (doc.type === 'invoice' && doc.shipmentData && doc.invoiceData) {
        // Generate and download invoice PDF
        generateInvoicePDF(doc.shipmentData, doc.invoiceData);
        addToast('Invoice downloaded successfully', 'success');
      } else if (doc.url && doc.url !== '#') {
        // Check if it's a data URL (base64)
        if (doc.url.startsWith('data:')) {
          // Convert data URL to blob and download
          try {
            const arr = doc.url.split(',');
            const mime = arr[0].match(/:(.*?);/)?.[1] || 'application/octet-stream';
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while(n--) {
              u8arr[n] = bstr.charCodeAt(n);
            }
            const blob = new Blob([u8arr], { type: mime });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = doc.name || 'document';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            addToast('Document downloaded successfully', 'success');
          } catch (e) {
            console.error('Error processing base64 data:', e);
            addToast('Failed to download document', 'error');
          }
        } else if (doc.url.startsWith('blob:')) {
          // Handle blob URLs - download directly
          const link = document.createElement('a');
          link.href = doc.url;
          link.download = doc.name || 'document';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          addToast('Document downloaded successfully', 'success');
        } else if (doc.url.startsWith('http://') || doc.url.startsWith('https://')) {
          // Open regular URLs in new tab
          window.open(doc.url, '_blank');
          addToast('Opening document in new tab', 'success');
        } else {
          // Try to download as-is for other URL types
          const link = document.createElement('a');
          link.href = doc.url;
          link.download = doc.name || 'document';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          addToast('Document download started', 'success');
        }
      } else {
        // Create a placeholder download for documents without URLs
        const docInfo = `Document: ${doc.name}\nType: ${doc.type}\nShipment: ${doc.shipmentId}\nUploaded: ${doc.uploadedAt}\nUploaded By: ${doc.uploadedBy}\n\nNote: The actual document file is not available. Please contact support for assistance.`;
        const blob = new Blob([docInfo], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${doc.name || 'document'}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        addToast('Document information downloaded. Contact support for the actual file.', 'warning');
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      addToast('Failed to download document', 'error');
    }
  };

  const handleDownloadSelected = () => {
    // Download selected documents
    let downloadCount = 0;
    selectedDocuments.forEach(docId => {
      const doc = documents.find(d => d.id === docId);
      if (doc) {
        // Use the same download logic as individual downloads
        handleDownloadDocument(doc);
        downloadCount++;
      }
    });
    if (downloadCount > 0) {
      addToast(`Downloading ${downloadCount} document(s)`, 'success');
    } else {
      addToast('No documents selected for download', 'warning');
    }
  };

  // Delete functionality removed for customer-facing documents page
  // Only staff/admin should be able to delete documents

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'invoice':
      case 'packing-list':
      case 'customs':
        return <FileTextIcon className="h-5 w-5" />;
      case 'awb':
      case 'pod':
        return <FileIcon className="h-5 w-5" />;
      default:
        return <FileIcon className="h-5 w-5" />;
    }
  };

  const getDocumentColor = (type: string) => {
    const docType = DOCUMENT_TYPES[type as keyof typeof DOCUMENT_TYPES];
    return docType ? docType.color : 'gray';
  };

  const renderListView = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
              <input
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={selectedDocuments.length === filteredDocuments.length && filteredDocuments.length > 0}
                onChange={handleSelectAll}
              />
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Document
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Shipment
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Uploaded
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {filteredDocuments.map(document => (
            <tr key={document.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={selectedDocuments.includes(document.id)}
                  onChange={() => handleToggleSelection(document.id)}
                />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button
                  type="button"
                  className="text-blue-600 hover:text-blue-800 mr-3"
                  title="Download"
                  onClick={() => handleDownloadDocument(document)}
                >
                  <DownloadIcon className="h-4 w-4" />
                </button>
                <button type="button" className="text-gray-400 hover:text-gray-600" title="More options">
                  <MoreHorizontalIcon className="h-4 w-4" />
                </button>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 h-8 w-8 rounded-full bg-${getDocumentColor(document.type)}-100 flex items-center justify-center`}>
                    {getDocumentIcon(document.type)}
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {document.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      by {document.uploadedBy}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-${getDocumentColor(document.type)}-100 text-${getDocumentColor(document.type)}-800`}>
                  {DOCUMENT_TYPES[document.type as keyof typeof DOCUMENT_TYPES]?.label || document.type}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {document.shipmentId}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {document.uploadedAt}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredDocuments.map(document => (
        <div
          key={document.id}
          className={`border rounded-lg overflow-hidden transition ${
            selectedDocuments.includes(document.id) ? 'border-blue-500' : 'border-gray-200'
          }`}
        >
          <div className="p-4 flex items-start">
            <div className={`flex-shrink-0 h-10 w-10 rounded-lg bg-${getDocumentColor(document.type)}-100 flex items-center justify-center mr-4`}>
              {getDocumentIcon(document.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 truncate" title={document.name}>
                    {document.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {DOCUMENT_TYPES[document.type as keyof typeof DOCUMENT_TYPES]?.label || document.type}
                  </p>
                </div>
                <input
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={selectedDocuments.includes(document.id)}
                  onChange={() => handleToggleSelection(document.id)}
                />
              </div>
              <div className="mt-2 flex items-center text-xs text-gray-500">
                <span>Shipment: {document.shipmentId}</span>
                <span className="mx-2">•</span>
                <span>{document.size}</span>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-2 border-t border-gray-200 flex justify-between items-center">
            <span className="text-xs text-gray-500">
              Uploaded: {document.uploadedAt}
            </span>
            <div>
              <button
                type="button"
                className="text-blue-600 hover:text-blue-800 p-1"
                title="Download"
                onClick={() => handleDownloadDocument(document)}
              >
                <DownloadIcon className="h-4 w-4" />
              </button>
              <button type="button" className="text-gray-400 hover:text-gray-600 p-1 ml-1" title="More options">
                <MoreHorizontalIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Documents Hub</h1>
        <p className="text-gray-600 mt-1">
          Manage all your shipping documents in one place
        </p>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
            <div className="flex-1 flex items-center">
              <div className="relative flex-1 max-w-lg">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SearchIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button
                type="button"
                className="ml-3 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FilterIcon className="h-4 w-4 mr-1" />
                Filter
              </button>
            </div>
            <div className="flex space-x-3">
              <div className="inline-flex shadow-sm rounded-md">
                <button
                  type="button"
                  className={`relative inline-flex items-center px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                    activeView === 'list' ? 'text-blue-600 z-10' : 'text-gray-700'
                  } hover:bg-gray-50 focus:z-10 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500`}
                  onClick={() => setActiveView('list')}
                >
                  List
                </button>
                <button
                  type="button"
                  className={`relative inline-flex items-center px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                    activeView === 'grid' ? 'text-blue-600 z-10' : 'text-gray-700'
                  } hover:bg-gray-50 focus:z-10 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500`}
                  onClick={() => setActiveView('grid')}
                >
                  Grid
                </button>
              </div>
              <Button variant="primary">
                <UploadIcon className="h-4 w-4 mr-1" />
                Upload
              </Button>
            </div>
          </div>
        </div>

        {selectedDocuments.length > 0 && (
          <div className="bg-blue-50 px-6 py-3 border-b border-blue-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-sm font-medium text-blue-800">
                  {selectedDocuments.length} document{selectedDocuments.length !== 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={handleDownloadSelected}
                >
                  <DownloadIcon className="h-4 w-4 mr-1" />
                  Download
                </button>
                <button
                  type="button"
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <FileArchiveIcon className="h-4 w-4 mr-1" />
                  Archive
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-2 text-sm text-gray-500">Loading documents...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12">
              <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No documents</h3>
              <p className="mt-1 text-sm text-gray-500">No documents have been uploaded yet.</p>
              <div className="mt-6">
                <Button variant="primary">
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Upload Document
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center">
                  <FolderIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <h2 className="text-lg font-medium text-gray-900">
                    All Documents
                  </h2>
                  <Badge variant="default" className="ml-2">
                    {filteredDocuments.length}
                  </Badge>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <span>Sorted by: </span>
                  <select className="ml-2 border-0 bg-transparent text-gray-500 focus:ring-0 focus:outline-none">
                    <option>Upload date (newest)</option>
                    <option>Upload date (oldest)</option>
                    <option>Name (A-Z)</option>
                    <option>Name (Z-A)</option>
                    <option>Type</option>
                  </select>
                </div>
              </div>
              {filteredDocuments.length > 0 ? (
                activeView === 'list' ? renderListView() : renderGridView()
              ) : (
                <div className="text-center py-12">
                  <FileTextIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    No documents found
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm ? `No documents matching "${searchTerm}"` : "You haven't uploaded any documents yet"}
                  </p>
                  <Button variant="primary">
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Upload Document
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};