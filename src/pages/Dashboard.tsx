import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { TruckIcon, PackageIcon, ArrowRightIcon, ClockIcon, CheckCircleIcon, AlertCircleIcon, BellIcon, BoxIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContextV2';
import { usePageTitle } from '../hooks/usePageTitle';
import { DataService } from '../services/DataService';
import { sampleShipmentService } from '../services/sampleShipmentService';

export const Dashboard = () => {
  const { user } = useAuth();
  const { shipments } = useData();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [sampleShipmentRequests, setSampleShipmentRequests] = useState<any[]>([]);

  usePageTitle('Dashboard');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch announcements
        const announcementData = await DataService.getAnnouncements();
        // Get only the 3 most recent announcements
        setAnnouncements(announcementData.slice(0, 3));

        // Fetch sample shipment requests for the user
        if (user) {
          const requests = await sampleShipmentService.getUserShipmentRequests(user.id);
          setSampleShipmentRequests(requests);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [user]);
  
  // Filter shipments for current user
  const userShipments = useMemo(() => {
    if (!user) return [];
    console.log('Dashboard - All shipments:', shipments);
    console.log('Dashboard - Current user:', user.id);
    const filtered = shipments.filter(shipment =>
      // Check both camelCase and snake_case for compatibility
      (shipment.customerId === user.id) || (shipment.customer_id === user.id)
    );
    console.log('Dashboard - User shipments:', filtered);
    return filtered;
  }, [shipments, user]);
  
  // Get active shipments (any shipment with approved quote that is not yet complete/delivered)
  const activeShipments = useMemo(() => {
    console.log('Dashboard - Filtering active shipments from:', userShipments);
    const active = userShipments
      .filter(shipment => {
        const hasQuote = shipment.quoteId || shipment.quote_id;
        const isNotDelivered = shipment.status !== 'Delivered';
        const isNotCancelled = shipment.status !== 'Cancelled';
        console.log('Shipment check:', {
          id: shipment.id,
          hasQuote,
          quoteId: shipment.quoteId,
          quote_id: shipment.quote_id,
          status: shipment.status,
          isNotDelivered,
          isNotCancelled,
          passes: hasQuote && isNotDelivered && isNotCancelled
        });
        // Active = has an associated quote and is not delivered
        return hasQuote && isNotDelivered && isNotCancelled;
      })
      .map(shipment => {
        // Calculate progress based on status
        // Status flow: Waiting for Pickup (20%) -> Invoice Payment (10%) -> Shipment IDs (10%) -> In Progress (40%) -> Delivered (20%)
        let progress = 0;
        let displayStatus = shipment.status;
        
        // Check for Missing Shipment IDs status
        if (shipment.invoice?.status === 'Paid' && 
            shipment.destinations?.some((d: any) => !d.amazonShipmentId || d.amazonShipmentId === '')) {
          displayStatus = 'Missing Shipment IDs';
          progress = 30; // Waiting (20%) + Payment (10%)
        } else if (shipment.invoice?.status === 'Paid' && 
                   shipment.destinations?.every((d: any) => d.amazonShipmentId && d.amazonShipmentId !== '')) {
          // IDs provided, check actual status
          switch (shipment.status) {
            case 'Delivered':
              displayStatus = 'Delivered';
              progress = 100;
              break;
            case 'Awaiting Pickup':
              displayStatus = 'Waiting for Pickup';
              progress = 40; // Waiting (20%) + Payment (10%) + IDs (10%)
              break;
            default:
              // Any other status with payment and IDs means "In Progress"
              displayStatus = 'In Progress';
              progress = 80; // Waiting (20%) + Payment (10%) + IDs (10%) + In Progress (40%)
          }
        } else {
          switch (shipment.status) {
            case 'Awaiting Pickup': 
              displayStatus = 'Waiting for Pickup';
              progress = 20; 
              break;
            case 'In Transit':
            case 'Customs':
              displayStatus = 'In Progress';
              progress = 80; 
              break;
            case 'Delivered': 
              progress = 100; 
              break;
          }
        }
        
        // Get first destination for display
        const firstDest = shipment.destinations[0];
        
        return {
          id: shipment.id,
          status: displayStatus,
          from: 'China', // You can enhance this by adding origin to the data model
          to: firstDest ? firstDest.fbaWarehouse : 'N/A',
          progress
        };
      });

    console.log('Dashboard - Active shipments result:', active);
    return active;
  }, [userShipments]);
  
  // Calculate stats
  const stats = useMemo(() => ({
    activeShipments: activeShipments.length,
    completedShipments: userShipments.filter(s => s.status === 'Delivered').length,
    // Count actual sample shipment requests
    sampleShipments: sampleShipmentRequests.length
  }), [activeShipments, userShipments, sampleShipmentRequests]);
  return <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">
          Welcome back, {user?.name}
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Here's what's happening with your shipments.
        </p>
      </div>
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 flex items-center">
          <div className="w-12 h-12 rounded-full bg-[#00b4d8]/10 flex items-center justify-center mr-4">
            <TruckIcon className="w-5 h-5 text-[#00b4d8]" />
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900">{stats.activeShipments}</div>
            <div className="text-sm text-gray-500">Active Shipments</div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 flex items-center">
          <div className="w-12 h-12 rounded-full bg-[#00b4d8]/10 flex items-center justify-center mr-4">
            <PackageIcon className="w-5 h-5 text-[#00b4d8]" />
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900">{stats.sampleShipments}</div>
            <div className="text-sm text-gray-500">Sample Shipments</div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 flex items-center">
          <div className="w-12 h-12 rounded-full bg-[#00b4d8]/10 flex items-center justify-center mr-4">
            <CheckCircleIcon className="w-5 h-5 text-[#00b4d8]" />
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900">{stats.completedShipments}</div>
            <div className="text-sm text-gray-500">Complete Shipments</div>
          </div>
        </div>
      </div>
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-start">
            <div className="flex-1 pr-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                New Shipment
              </h3>
              <p className="text-sm text-gray-500 mb-5 leading-relaxed">
                Ready to get started with a new shipment? Click the button below to request a quote.
              </p>
              <Link to="/quotes/new" className="inline-block">
                <button className="flex items-center justify-center px-5 py-2 rounded-md bg-[#2E3B55] text-white hover:bg-[#1e2940] transition-colors">
                  <span className="text-sm font-medium">New Quote</span>
                </button>
              </Link>
            </div>
            <div className="w-32 h-32 flex-shrink-0">
              <img src="/new-shipment-icon.svg" alt="New Shipment" className="w-full h-full object-contain" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-start">
            <div className="flex-1 pr-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Sample Shipment
              </h3>
              <p className="text-sm text-gray-500 mb-5 leading-relaxed">
                Ready to get started with a new sample shipment? Click the button below to begin.
              </p>
              <Link to="/samples" className="inline-block">
                <button className="flex items-center justify-center px-5 py-2 rounded-md bg-[#2E3B55] text-white hover:bg-[#1e2940] transition-colors">
                  <span className="text-sm font-medium">Sample Shipment</span>
                </button>
              </Link>
            </div>
            <div className="w-32 h-32 flex-shrink-0">
              <img src="/sample-shipment-icon.svg" alt="Sample Shipment" className="w-full h-full object-contain" />
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card title="Active Shipments" subtitle="Your current shipments in progress" color="blue">
          {activeShipments.length > 0 ? <div className="space-y-4">
              {activeShipments.slice(0, 3).map(shipment => <div key={shipment.id} className="border border-gray-100 rounded-lg p-4 hover:border-gray-200 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <Link to={`/shipments/${shipment.id}`} className="text-gray-900 hover:underline font-medium text-sm">
                        Shipment {shipment.id}
                      </Link>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {shipment.from} → {shipment.to}
                      </div>
                    </div>
                    <Badge variant={shipment.status === 'In Transit' ? 'info' : 'warning'}>
                      {shipment.status}
                    </Badge>
                  </div>
                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500">Progress</span>
                      <span className="text-gray-700">
                        {shipment.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="bg-[#00b4d8] h-1.5 rounded-full" style={{
                  width: `${shipment.progress}%`
                }}></div>
                    </div>
                  </div>
                  <div className="flex justify-end items-center text-xs">
                    <Link to={`/shipments/${shipment.id}`} className="flex items-center text-[#00b4d8] hover:text-[#0096b8]">
                      <span className="mr-1">View Details</span>
                      <ArrowRightIcon className="w-3 h-3" />
                    </Link>
                  </div>
                </div>)}
              {activeShipments.length > 3 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <Link to="/shipments" className="flex items-center justify-center text-sm text-[#00b4d8] hover:text-[#0096b8] font-medium">
                    View all {activeShipments.length} shipments
                    <ArrowRightIcon className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              )}
            </div> : <div className="text-center py-8">
              <PackageIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <h3 className="text-sm font-medium text-gray-700 mb-1">
                No active shipments
              </h3>
              <p className="text-xs text-gray-500 mb-3">
                Start by creating a new quote
              </p>
              <Link to="/quotes/new">
                <Button variant="primary" size="sm">
                  Create Quote
                </Button>
              </Link>
            </div>}
        </Card>
        <Card title="Announcements" subtitle="Latest updates and notifications">
          {announcements.length === 0 ? (
            <div className="text-center py-8">
              <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <ClockIcon className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">
                No announcements
              </h3>
              <p className="text-xs text-gray-500">
                Check back later for important updates
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.map((announcement) => (
                <div key={announcement.id} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900">
                        {announcement.title}
                      </h3>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {announcement.content}
                      </p>
                      <div className="flex items-center mt-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          announcement.priority === 'high'
                            ? 'bg-red-100 text-red-800'
                            : announcement.priority === 'medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          <BellIcon className="w-3 h-3 mr-1" />
                          {announcement.priority}
                        </span>
                        <span className="text-xs text-gray-500 ml-3">
                          {new Date(announcement.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Link
                    to={`/announcements/${announcement.id}`}
                    className="text-xs text-blue-600 hover:text-blue-800 mt-2 inline-block"
                  >
                    Read more →
                  </Link>
                </div>
              ))}
              <Link
                to="/announcements"
                className="block text-center text-sm text-blue-600 hover:text-blue-800 pt-2 border-t"
              >
                View all announcements →
              </Link>
            </div>
          )}
        </Card>
      </div>
    </div>;
};