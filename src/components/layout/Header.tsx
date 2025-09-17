import React, { useState, useRef, useEffect } from 'react';
import { BellIcon, UserIcon, SearchIcon, ChevronDownIcon, Clock, ArrowRight, MessageSquare, FileText, AlertCircle, Package, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationsContext';
import { Link } from 'react-router-dom';

export const Header = () => {
  const {
    user,
    logout
  } = useAuth();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const toggleProfile = () => setIsProfileOpen(!isProfileOpen);
  const toggleNotifications = () => setIsNotificationsOpen(!isNotificationsOpen);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const recentNotifications = notifications.slice(0, 4);
  return <header className="bg-white h-16 flex items-center px-6 justify-between border-b border-gray-200">
      <div className="flex items-center">
        <h1 className="text-[#1f2c39] font-bold text-xl mr-8">FREIGHT SHARK</h1>
        <div className="relative hidden md:block">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input type="text" placeholder="Search..." className="pl-10 pr-4 py-1.5 border border-gray-300 rounded-full focus:outline-none focus:ring-1 focus:ring-[#00b4d8] focus:border-[#00b4d8] w-60 bg-white text-sm text-gray-900 placeholder-gray-400" />
        </div>
      </div>
      <div className="flex items-center space-x-5">
        <div className="relative" ref={notificationsRef}>
          <button
            className="relative p-1.5 text-gray-600 hover:text-gray-900 focus:outline-none"
            onClick={toggleNotifications}
          >
            <BellIcon className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-2 w-2 bg-orange-500 rounded-full"></span>
            )}
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg border border-gray-200 shadow-xl z-50">
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="text-xs text-gray-500">{unreadCount} unread</span>
                  )}
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {recentNotifications.map((notification) => {
                  // Map notification type to icon component
                  const iconMap: Record<string, any> = {
                    'message': MessageSquare,
                    'quote': FileText,
                    'invoice': FileText,
                    'alert': AlertCircle,
                    'shipment': Package
                  };
                  const Icon = iconMap[notification.type] || Mail;
                  return (
                    <Link
                      key={notification.id}
                      to={notification.link}
                      className={`block px-4 py-3 hover:bg-gray-50 transition-colors ${
                        !notification.read ? 'bg-blue-50/50' : ''
                      }`}
                      onClick={() => {
                        if (!notification.read) {
                          markAsRead(notification.id);
                        }
                        setIsNotificationsOpen(false);
                      }}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${
                          notification.type === 'alert' ? 'bg-amber-100' :
                          notification.type === 'message' ? 'bg-purple-100' :
                          notification.type === 'invoice' ? 'bg-green-100' :
                          'bg-blue-100'
                        }`}>
                          <Icon className={`h-4 w-4 ${
                            notification.type === 'alert' ? 'text-amber-600' :
                            notification.type === 'message' ? 'text-purple-600' :
                            notification.type === 'invoice' ? 'text-green-600' :
                            'text-blue-600'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-600 mt-0.5 truncate">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {notification.timestamp}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>

              <Link
                to="/notifications"
                className="block p-3 text-center border-t border-gray-100 hover:bg-gray-50 transition-colors"
                onClick={() => setIsNotificationsOpen(false)}
              >
                <span className="text-sm text-[#00b4d8] font-medium flex items-center justify-center">
                  View all notifications
                  <ArrowRight className="h-4 w-4 ml-1" />
                </span>
              </Link>
            </div>
          )}
        </div>
        <div className="relative">
          <button className="flex items-center space-x-2 focus:outline-none" onClick={toggleProfile}>
            <div className="w-8 h-8 rounded-full bg-[#00b4d8] flex items-center justify-center">
              <UserIcon className="h-4 w-4 text-white" />
            </div>
            <div className="hidden md:flex items-center">
              <span className="text-sm text-gray-700 mr-1">{user?.name}</span>
              <span className="text-xs text-gray-500">Seller</span>
              <ChevronDownIcon className="h-4 w-4 text-gray-500 ml-1" />
            </div>
          </button>
          {isProfileOpen && <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg border border-gray-100 py-1 z-10 shadow-lg">
              <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                Profile
              </button>
              <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                Settings
              </button>
              <button onClick={logout} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                Sign out
              </button>
            </div>}
        </div>
      </div>
    </header>;
};