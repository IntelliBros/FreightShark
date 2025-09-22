import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { TruckIcon, PackageIcon, ArrowRightIcon, ClockIcon, CheckCircleIcon, AlertCircleIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { usePageTitle } from '../hooks/usePageTitle';
export const Dashboard = () => {
  const { user } = useAuth();
  const { shipments } = useData();
  
  usePageTitle('Dashboard');
  
  // Filter shipments for current user
  const userShipments = useMemo(() => {
    if (!user) return [];
    return shipments.filter(shipment =>
      // Check both camelCase and snake_case for compatibility
      (shipment.customerId === user.id) || (shipment.customer_id === user.id)
    );
  }, [shipments, user]);
  
  // Get active shipments (any shipment with approved quote that is not yet complete/delivered)
  const activeShipments = useMemo(() => {
    return userShipments
      .filter(shipment =>
        // Active = has an approved quote and is not delivered
        shipment.quote_id && // Has an associated quote
        shipment.status !== 'Delivered' && // Not yet complete
        shipment.status !== 'Cancelled' // Not cancelled
      )
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
  }, [userShipments]);
  
  // Calculate stats
  const stats = useMemo(() => ({
    activeShipments: activeShipments.length,
    completedShipments: userShipments.filter(s => s.status === 'Delivered').length,
    // Count sample shipments (typically smaller shipments with weight < 10kg or marked as samples)
    sampleShipments: userShipments.filter(s => {
      // Check if it's a sample shipment based on:
      // 1. Low weight (typically samples are < 10kg)
      // 2. Special naming convention (contains 'sample' in ID or cargo details)
      // 3. Or if there's a sample flag in cargo details
      const isLowWeight = s.actual_weight ? s.actual_weight < 10 : s.estimated_weight ? s.estimated_weight < 10 : false;
      const hasSampleInId = s.id?.toLowerCase().includes('sample') || false;
      const hasSampleInCargo = s.cargo_details?.description?.toLowerCase().includes('sample') ||
                               s.cargo_details?.type?.toLowerCase().includes('sample') || false;

      return isLowWeight || hasSampleInId || hasSampleInCargo;
    }).length
  }), [activeShipments, userShipments]);
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                New Shipment
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Ready to get started with a new shipment? Click the button below
                to request a quote.
              </p>
            </div>
            <div className="w-24 h-24 flex items-center justify-center">
              <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 7v10M13 7l4-4M13 7l-4-4" stroke="#00b4d8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 12h18" stroke="#0096b8" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
                <path d="M7 17l-4 4M17 17l4 4" stroke="#00b4d8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
              </svg>
            </div>
          </div>
          <Link to="/quotes/new">
            <button className="mt-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium">
              <span className="mr-1">+</span> New shipment
            </button>
          </Link>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Sample Shipment
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Ready to get started with a new sample shipment? Click the
                button below to begin.
              </p>
            </div>
            <div className="w-24 h-24 flex items-center justify-center">
              <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="8" width="7" height="8" stroke="#00b4d8" strokeWidth="1.5" rx="1"/>
                <rect x="13" y="6" width="7" height="10" stroke="#0096b8" strokeWidth="1.5" rx="1" opacity="0.7"/>
                <path d="M7.5 11.5h0M16.5 10h0" stroke="#00b4d8" strokeWidth="2" strokeLinecap="round"/>
                <path d="M2 20h20" stroke="#00b4d8" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
              </svg>
            </div>
          </div>
          <Link to="/samples">
            <button className="mt-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium">
              <span className="mr-1">+</span> Sample shipment
            </button>
          </Link>
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
        </Card>
      </div>
    </div>;
};