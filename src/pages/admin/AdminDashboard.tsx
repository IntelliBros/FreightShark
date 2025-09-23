import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { UsersIcon, ShieldIcon, TruckIcon, FileTextIcon, ServerIcon, AlertOctagonIcon, BarChart2Icon, ActivityIcon, DollarSignIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContextV2';
export const AdminDashboard = () => {
  const {
    user
  } = useAuth();
  const {
    quoteRequests,
    quotes,
    shipments,
    isLoading
  } = useData();
  // Summary statistics
  const stats = {
    totalUsers: 15,
    totalCustomers: 10,
    totalStaff: 4,
    totalAdmins: 1,
    activeShipments: shipments.filter(s => s.status !== 'Delivered').length,
    completedShipments: shipments.filter(s => s.status === 'Delivered').length,
    pendingQuotes: quotes.filter(q => q.status === 'Pending').length,
    acceptedQuotes: quotes.filter(q => q.status === 'Accepted').length,
    totalRevenue: quotes.filter(q => q.status === 'Accepted').reduce((sum, quote) => sum + quote.total, 0)
  };
  // Recent system activities (mock data)
  const recentActivities = [{
    id: 1,
    user: 'Sarah Chen',
    action: 'Created quote',
    target: 'Q-3458',
    timestamp: '30 minutes ago'
  }, {
    id: 2,
    user: 'John Doe',
    action: 'Accepted quote',
    target: 'Q-3456',
    timestamp: '2 hours ago'
  }, {
    id: 3,
    user: 'Mike Johnson',
    action: 'Updated shipment',
    target: 'SH-1234',
    timestamp: '3 hours ago'
  }, {
    id: 4,
    user: 'System',
    action: 'Backup completed',
    target: 'Database',
    timestamp: '5 hours ago'
  }];
  // System alerts (mock data)
  const systemAlerts = [{
    id: 1,
    level: 'warning',
    message: 'Database storage at 75% capacity',
    timestamp: '2 hours ago'
  }, {
    id: 2,
    level: 'info',
    message: 'System update available',
    timestamp: '1 day ago'
  }];
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-[#1E293B] rounded-full border-t-transparent animate-spin"></div>
      </div>;
  }
  return <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#1E293B]">Admin Dashboard</h1>
        <p className="text-gray-600 text-sm mt-1">
          Welcome back, {user?.name}. Here's an overview of your system.
        </p>
      </div>
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center mr-3">
              <UsersIcon className="w-5 h-5 text-indigo-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Users</span>
          </div>
          <div className="text-2xl font-bold text-[#1E293B]">
            {stats.totalUsers}
          </div>
          <div className="mt-1 grid grid-cols-2 gap-2 text-xs text-gray-500">
            <div>
              <span className="font-medium">{stats.totalCustomers}</span>{' '}
              Customers
            </div>
            <div>
              <span className="font-medium">{stats.totalStaff}</span> Staff
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mr-3">
              <TruckIcon className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Shipments</span>
          </div>
          <div className="text-2xl font-bold text-[#1E293B]">
            {stats.activeShipments + stats.completedShipments}
          </div>
          <div className="mt-1 grid grid-cols-2 gap-2 text-xs text-gray-500">
            <div>
              <span className="font-medium">{stats.activeShipments}</span>{' '}
              Active
            </div>
            <div>
              <span className="font-medium">{stats.completedShipments}</span>{' '}
              Completed
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center mr-3">
              <FileTextIcon className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Quotes</span>
          </div>
          <div className="text-2xl font-bold text-[#1E293B]">
            {stats.pendingQuotes + stats.acceptedQuotes}
          </div>
          <div className="mt-1 grid grid-cols-2 gap-2 text-xs text-gray-500">
            <div>
              <span className="font-medium">{stats.pendingQuotes}</span> Pending
            </div>
            <div>
              <span className="font-medium">{stats.acceptedQuotes}</span>{' '}
              Accepted
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mr-3">
              <DollarSignIcon className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Revenue</span>
          </div>
          <div className="text-2xl font-bold text-[#1E293B]">
            ${stats.totalRevenue.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-gray-500">
            From {stats.acceptedQuotes} accepted quotes
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
        {/* Recent Activity */}
        <Card title="Recent Activity" className="lg:col-span-2" color="blue">
          <div className="space-y-4">
            {recentActivities.map(activity => <div key={activity.id} className="flex items-start">
                <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center mr-3">
                  <ActivityIcon className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">{activity.user}</span>{' '}
                    {activity.action}{' '}
                    <span className="text-blue-600">{activity.target}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {activity.timestamp}
                  </p>
                </div>
              </div>)}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <Link to="/admin/audit-logs">
              <Button variant="link" size="sm">
                View All Activity
              </Button>
            </Link>
          </div>
        </Card>
        {/* System Status */}
        <Card title="System Status" color="purple">
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-500">CPU Usage</span>
              <span className="text-xs font-medium text-gray-700">32%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div className="bg-purple-600 h-1.5 rounded-full" style={{
              width: '32%'
            }}></div>
            </div>
          </div>
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-500">Memory Usage</span>
              <span className="text-xs font-medium text-gray-700">45%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div className="bg-purple-600 h-1.5 rounded-full" style={{
              width: '45%'
            }}></div>
            </div>
          </div>
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-500">Storage</span>
              <span className="text-xs font-medium text-gray-700">75%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div className="bg-amber-500 h-1.5 rounded-full" style={{
              width: '75%'
            }}></div>
            </div>
          </div>
          <div className="space-y-3 mt-5">
            <h4 className="text-xs font-semibold text-gray-700">
              System Alerts
            </h4>
            {systemAlerts.map(alert => <div key={alert.id} className="flex items-start">
                <div className="flex-shrink-0 mr-2 mt-0.5">
                  <AlertOctagonIcon className={`h-4 w-4 ${alert.level === 'warning' ? 'text-amber-500' : 'text-blue-500'}`} />
                </div>
                <div>
                  <p className="text-xs text-gray-800">{alert.message}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {alert.timestamp}
                  </p>
                </div>
              </div>)}
          </div>
        </Card>
      </div>
      {/* Quick Actions */}
      <Card title="Quick Actions">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/admin/users/customers">
            <div className="p-4 bg-white border border-gray-100 rounded-lg hover:border-gray-300 transition-colors text-center">
              <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <UsersIcon className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-900">
                Manage Users
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                View and edit user accounts
              </p>
            </div>
          </Link>
          <Link to="/admin/system/general">
            <div className="p-4 bg-white border border-gray-100 rounded-lg hover:border-gray-300 transition-colors text-center">
              <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <ServerIcon className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-900">
                System Settings
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Configure system parameters
              </p>
            </div>
          </Link>
          <Link to="/admin/analytics">
            <div className="p-4 bg-white border border-gray-100 rounded-lg hover:border-gray-300 transition-colors text-center">
              <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <BarChart2Icon className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-900">Analytics</h3>
              <p className="text-xs text-gray-500 mt-1">
                View detailed reports
              </p>
            </div>
          </Link>
          <Link to="/admin/security/roles">
            <div className="p-4 bg-white border border-gray-100 rounded-lg hover:border-gray-300 transition-colors text-center">
              <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <ShieldIcon className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-900">Security</h3>
              <p className="text-xs text-gray-500 mt-1">
                Manage roles and permissions
              </p>
            </div>
          </Link>
        </div>
      </Card>
    </div>;
};