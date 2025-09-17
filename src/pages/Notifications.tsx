import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { usePageTitle } from '../hooks/usePageTitle';
import { Link } from 'react-router-dom';
import {
  FileText,
  AlertCircle,
  MessageSquare,
  Package,
  Clock,
  CheckCircle,
  Filter,
  Bell,
  Archive
} from 'lucide-react';

// Extended notifications data
const allNotifications = [
  {
    id: '1',
    type: 'quote',
    icon: FileText,
    title: 'Quote Ready',
    message: 'Your quote #Q-00123 is ready for review',
    timestamp: '2 hours ago',
    date: '2024-01-15',
    read: false,
    link: '/quotes/Q-00123'
  },
  {
    id: '2',
    type: 'invoice',
    icon: FileText,
    title: 'Invoice Generated',
    message: 'Invoice for shipment #FS-00045 is ready',
    timestamp: '5 hours ago',
    date: '2024-01-15',
    read: false,
    link: '/invoices'
  },
  {
    id: '3',
    type: 'alert',
    icon: AlertCircle,
    title: 'Shipment IDs Missing',
    message: 'Please provide Amazon shipment IDs for #FS-00046',
    timestamp: '1 day ago',
    date: '2024-01-14',
    read: true,
    link: '/shipments/FS-00046'
  },
  {
    id: '4',
    type: 'message',
    icon: MessageSquare,
    title: 'New Message',
    message: 'You have a new message from support',
    timestamp: '2 days ago',
    date: '2024-01-13',
    read: true,
    link: '/messages'
  },
  {
    id: '5',
    type: 'shipment',
    icon: Package,
    title: 'Shipment Update',
    message: 'Shipment #FS-00044 has been delivered',
    timestamp: '3 days ago',
    date: '2024-01-12',
    read: true,
    link: '/shipments/FS-00044'
  },
  {
    id: '6',
    type: 'quote',
    icon: FileText,
    title: 'Quote Expiring Soon',
    message: 'Quote #Q-00122 will expire in 2 days',
    timestamp: '4 days ago',
    date: '2024-01-11',
    read: true,
    link: '/quotes/Q-00122'
  },
  {
    id: '7',
    type: 'shipment',
    icon: Package,
    title: 'Shipment Departed',
    message: 'Shipment #FS-00043 has departed from origin',
    timestamp: '5 days ago',
    date: '2024-01-10',
    read: true,
    link: '/shipments/FS-00043'
  },
  {
    id: '8',
    type: 'invoice',
    icon: FileText,
    title: 'Payment Received',
    message: 'Payment confirmed for invoice #INV-00089',
    timestamp: '1 week ago',
    date: '2024-01-08',
    read: true,
    link: '/invoices'
  }
];

export const Notifications = () => {
  usePageTitle('Notifications');
  const [notifications, setNotifications] = useState(allNotifications);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread' && n.read) return false;
    if (typeFilter !== 'all' && n.type !== typeFilter) return false;
    return true;
  });

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'alert': return 'amber';
      case 'message': return 'purple';
      case 'invoice': return 'green';
      case 'shipment': return 'blue';
      case 'quote': return 'indigo';
      default: return 'gray';
    }
  };

  const getTypeBadgeText = (type: string) => {
    switch (type) {
      case 'alert': return 'Alert';
      case 'message': return 'Message';
      case 'invoice': return 'Invoice';
      case 'shipment': return 'Shipment';
      case 'quote': return 'Quote';
      default: return type;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Bell className="h-6 w-6 mr-2 text-[#00b4d8]" />
              Notifications
            </h1>
            <p className="text-gray-600 mt-1">
              Stay updated with your shipments and account activity
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={markAllAsRead}
              className="flex items-center"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Mark all as read
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">Filter:</span>
            <div className="flex space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  filter === 'all'
                    ? 'bg-[#00b4d8] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  filter === 'unread'
                    ? 'bg-[#00b4d8] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-[#00b4d8]"
            >
              <option value="all">All types</option>
              <option value="quote">Quotes</option>
              <option value="invoice">Invoices</option>
              <option value="shipment">Shipments</option>
              <option value="alert">Alerts</option>
              <option value="message">Messages</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => {
            const Icon = notification.icon;
            const typeColor = getTypeColor(notification.type);

            return (
              <div
                key={notification.id}
                className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 transition-all hover:shadow-md ${
                  !notification.read ? 'border-l-4 border-l-[#00b4d8]' : ''
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className={`p-2 rounded-lg bg-${typeColor}-100`}>
                    <Icon className={`h-5 w-5 text-${typeColor}-600`} />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-sm font-semibold text-gray-900">
                            {notification.title}
                          </h3>
                          <Badge variant={typeColor as any} size="sm">
                            {getTypeBadgeText(notification.type)}
                          </Badge>
                          {!notification.read && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-400 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {notification.timestamp}
                          </p>
                          <div className="flex items-center space-x-2">
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="text-xs text-gray-500 hover:text-gray-700"
                              >
                                Mark as read
                              </button>
                            )}
                            <Link
                              to={notification.link}
                              className="text-xs text-[#00b4d8] hover:text-[#0096b8] font-medium"
                            >
                              View →
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Archive className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-gray-700 mb-1">
              No notifications
            </h3>
            <p className="text-xs text-gray-500">
              {filter === 'unread' ? 'All notifications have been read' : 'You have no notifications at this time'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};