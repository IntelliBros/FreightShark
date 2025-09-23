import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboardIcon, FileTextIcon, TruckIcon, BarChartIcon, SettingsIcon, ChevronDownIcon, ChevronRightIcon, LogOutIcon, ChevronLeftIcon, ClipboardCheckIcon, DollarSignIcon, ReceiptIcon, MessageCircleIcon, InboxIcon, BellIcon, Package } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface StaffSidebarProps {
  onMobileClose?: () => void;
}

export const StaffSidebar: React.FC<StaffSidebarProps> = ({ onMobileClose }) => {
  const location = useLocation();
  const { logout } = useAuth();
  const [expanded, setExpanded] = useState({
    quotes: true,
    shipments: true,
    invoices: true
  });
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLinkClick = () => {
    // Close mobile menu when a link is clicked
    if (onMobileClose && window.innerWidth < 1024) {
      onMobileClose();
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const isGroupActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  const toggleExpanded = (key: keyof typeof expanded) => {
    setExpanded(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <aside className={`bg-white border-r border-gray-200 h-full flex flex-col transition-all duration-300 relative ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className={`p-6 ${isCollapsed ? 'p-3 flex justify-center' : ''}`}>
        {isCollapsed ? (
          <img src="/shark-icon.svg" alt="Freight Shark" className="w-14 h-14" />
        ) : (
          <div>
            <img src="/freight-shark-logo.svg" alt="Freight Shark" className="h-10" />
            <p className="text-xs text-gray-500 mt-2">Staff Portal</p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          <li>
            <Link
              to="/staff"
              onClick={handleLinkClick}
              className={`flex items-center ${isCollapsed ? 'justify-center' : ''} px-3 py-2.5 rounded-lg ${
                isActive('/staff') ? 'bg-[#00b4d8]/10 text-[#00b4d8]' : 'text-gray-700 hover:bg-gray-50'
              } min-h-[44px]`}
            >
              <LayoutDashboardIcon className={`${isCollapsed ? 'h-5 w-5' : 'h-4 w-4'} min-w-4`} />
              {!isCollapsed && <span className="ml-3 text-sm">Dashboard</span>}
            </Link>
          </li>

          <li>
            <button
              onClick={() => toggleExpanded('quotes')}
              className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} w-full px-3 py-2.5 rounded-lg ${
                isGroupActive('/staff/quotes') ? 'bg-[#00b4d8]/10 text-[#00b4d8]' : 'text-gray-700 hover:bg-gray-50'
              } min-h-[44px]`}
            >
              <div className="flex items-center">
                <FileTextIcon className={`${isCollapsed ? 'h-5 w-5' : 'h-4 w-4'} min-w-4`} />
                {!isCollapsed && <span className="ml-3 text-sm">Quotes</span>}
              </div>
              {!isCollapsed && (expanded.quotes ? <ChevronDownIcon className="h-3.5 w-3.5" /> : <ChevronRightIcon className="h-3.5 w-3.5" />)}
            </button>
            {expanded.quotes && !isCollapsed && (
              <ul className="mt-1 ml-7 space-y-1">
                <li>
                  <Link
                    to="/staff/quotes/requests"
                    onClick={handleLinkClick}
                    className={`flex items-center px-3 py-2 rounded-lg text-xs ${
                      isActive('/staff/quotes/requests') ? 'bg-[#00b4d8]/10 text-[#00b4d8]' : 'text-gray-600 hover:bg-gray-50'
                    } min-h-[36px]`}
                  >
                    Quote Requests
                  </Link>
                </li>
                <li>
                  <Link
                    to="/staff/quotes/pending"
                    onClick={handleLinkClick}
                    className={`flex items-center px-3 py-2 rounded-lg text-xs ${
                      isActive('/staff/quotes/pending') ? 'bg-[#00b4d8]/10 text-[#00b4d8]' : 'text-gray-600 hover:bg-gray-50'
                    } min-h-[36px]`}
                  >
                    Pending Approval
                  </Link>
                </li>
              </ul>
            )}
          </li>

          <li>
            <button
              onClick={() => toggleExpanded('shipments')}
              className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} w-full px-3 py-2.5 rounded-lg ${
                isGroupActive('/staff/shipments') ? 'bg-[#00b4d8]/10 text-[#00b4d8]' : 'text-gray-700 hover:bg-gray-50'
              } min-h-[44px]`}
            >
              <div className="flex items-center">
                <TruckIcon className={`${isCollapsed ? 'h-5 w-5' : 'h-4 w-4'} min-w-4`} />
                {!isCollapsed && <span className="ml-3 text-sm">Shipments</span>}
              </div>
              {!isCollapsed && (expanded.shipments ? <ChevronDownIcon className="h-3.5 w-3.5" /> : <ChevronRightIcon className="h-3.5 w-3.5" />)}
            </button>
            {expanded.shipments && !isCollapsed && (
              <ul className="mt-1 ml-7 space-y-1">
                <li>
                  <Link
                    to="/staff/shipments/active"
                    onClick={handleLinkClick}
                    className={`flex items-center px-3 py-2 rounded-lg text-xs ${
                      isActive('/staff/shipments/active') ? 'bg-[#00b4d8]/10 text-[#00b4d8]' : 'text-gray-600 hover:bg-gray-50'
                    } min-h-[36px]`}
                  >
                    Active
                  </Link>
                </li>
                <li>
                  <Link
                    to="/staff/shipments/completed"
                    onClick={handleLinkClick}
                    className={`flex items-center px-3 py-2 rounded-lg text-xs ${
                      isActive('/staff/shipments/completed') ? 'bg-[#00b4d8]/10 text-[#00b4d8]' : 'text-gray-600 hover:bg-gray-50'
                    } min-h-[36px]`}
                  >
                    Completed
                  </Link>
                </li>
              </ul>
            )}
          </li>

          <li>
            <button
              onClick={() => toggleExpanded('invoices')}
              className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} w-full px-3 py-2.5 rounded-lg ${
                isGroupActive('/staff/invoices') ? 'bg-[#00b4d8]/10 text-[#00b4d8]' : 'text-gray-700 hover:bg-gray-50'
              } min-h-[44px]`}
            >
              <div className="flex items-center">
                <ReceiptIcon className={`${isCollapsed ? 'h-5 w-5' : 'h-4 w-4'} min-w-4`} />
                {!isCollapsed && <span className="ml-3 text-sm">Invoices</span>}
              </div>
              {!isCollapsed && (expanded.invoices ? <ChevronDownIcon className="h-3.5 w-3.5" /> : <ChevronRightIcon className="h-3.5 w-3.5" />)}
            </button>
            {expanded.invoices && !isCollapsed && (
              <ul className="mt-1 ml-7 space-y-1">
                <li>
                  <Link
                    to="/staff/invoices/pending"
                    onClick={handleLinkClick}
                    className={`flex items-center px-3 py-2 rounded-lg text-xs ${
                      isActive('/staff/invoices/pending') ? 'bg-[#00b4d8]/10 text-[#00b4d8]' : 'text-gray-600 hover:bg-gray-50'
                    } min-h-[36px]`}
                  >
                    Pending
                  </Link>
                </li>
                <li>
                  <Link
                    to="/staff/invoices/paid"
                    onClick={handleLinkClick}
                    className={`flex items-center px-3 py-2 rounded-lg text-xs ${
                      isActive('/staff/invoices/paid') ? 'bg-[#00b4d8]/10 text-[#00b4d8]' : 'text-gray-600 hover:bg-gray-50'
                    } min-h-[36px]`}
                  >
                    Paid
                  </Link>
                </li>
              </ul>
            )}
          </li>

          <li>
            <Link
              to="/staff/messages"
              onClick={handleLinkClick}
              className={`flex items-center ${isCollapsed ? 'justify-center' : ''} px-3 py-2.5 rounded-lg ${
                isActive('/staff/messages') || isActive('/staff/messages/inbox') ? 'bg-[#00b4d8]/10 text-[#00b4d8]' : 'text-gray-700 hover:bg-gray-50'
              } min-h-[44px]`}
            >
              <MessageCircleIcon className={`${isCollapsed ? 'h-5 w-5' : 'h-4 w-4'} min-w-4`} />
              {!isCollapsed && <span className="ml-3 text-sm">Messages</span>}
            </Link>
          </li>

          <li>
            <Link
              to="/staff/samples"
              onClick={handleLinkClick}
              className={`flex items-center ${isCollapsed ? 'justify-center' : ''} px-3 py-2.5 rounded-lg ${
                isActive('/staff/samples') ? 'bg-[#00b4d8]/10 text-[#00b4d8]' : 'text-gray-700 hover:bg-gray-50'
              } min-h-[44px]`}
            >
              <Package className={`${isCollapsed ? 'h-5 w-5' : 'h-4 w-4'} min-w-4`} />
              {!isCollapsed && <span className="ml-3 text-sm">Samples</span>}
            </Link>
          </li>

          <li>
            <Link
              to="/staff/reports"
              onClick={handleLinkClick}
              className={`flex items-center ${isCollapsed ? 'justify-center' : ''} px-3 py-2.5 rounded-lg ${
                isActive('/staff/reports') ? 'bg-[#00b4d8]/10 text-[#00b4d8]' : 'text-gray-700 hover:bg-gray-50'
              } min-h-[44px]`}
            >
              <BarChartIcon className={`${isCollapsed ? 'h-5 w-5' : 'h-4 w-4'} min-w-4`} />
              {!isCollapsed && <span className="ml-3 text-sm">Reports</span>}
            </Link>
          </li>

          <li>
            <Link
              to="/staff/announcements"
              onClick={handleLinkClick}
              className={`flex items-center ${isCollapsed ? 'justify-center' : ''} px-3 py-2.5 rounded-lg ${
                isActive('/staff/announcements') ? 'bg-[#00b4d8]/10 text-[#00b4d8]' : 'text-gray-700 hover:bg-gray-50'
              } min-h-[44px]`}
            >
              <BellIcon className={`${isCollapsed ? 'h-5 w-5' : 'h-4 w-4'} min-w-4`} />
              {!isCollapsed && <span className="ml-3 text-sm">Announcements</span>}
            </Link>
          </li>
        </ul>
      </nav>

      <div className={`p-5 border-t border-gray-100 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
        <Link
          to="/staff/settings"
          onClick={handleLinkClick}
          className={`flex items-center ${isCollapsed ? 'justify-center' : ''} px-3 py-2 rounded-lg ${
            isActive('/staff/settings') ? 'bg-[#00b4d8]/10 text-[#00b4d8]' : 'text-gray-700 hover:bg-gray-50'
          } min-h-[44px]`}
        >
          <SettingsIcon className={`${isCollapsed ? 'h-5 w-5' : 'h-4 w-4'} min-w-4`} />
          {!isCollapsed && <span className="ml-3 text-sm">Settings</span>}
        </Link>
        <button
          onClick={logout}
          className={`flex items-center w-full px-3 py-2 mt-2 text-gray-700 hover:bg-gray-50 rounded-lg ${
            isCollapsed ? 'justify-center' : ''
          } min-h-[44px]`}
        >
          <LogOutIcon className={`${isCollapsed ? 'h-5 w-5' : 'h-4 w-4'} min-w-4`} />
          {!isCollapsed && <span className="ml-3 text-sm">Sign Out</span>}
        </button>
      </div>

      {/* Only show collapse/expand buttons on desktop */}
      {!isCollapsed && window.innerWidth >= 1024 && (
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-1/2 -translate-y-1/2 bg-[#00b4d8] hover:bg-[#0096b8] text-white rounded-r-md px-1 py-6 shadow-lg transition-all duration-200 hover:px-2 z-10"
          title="Collapse sidebar"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
      )}
      {isCollapsed && window.innerWidth >= 1024 && (
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-1/2 -translate-y-1/2 bg-[#00b4d8] hover:bg-[#0096b8] text-white rounded-r-md px-1 py-6 shadow-lg transition-all duration-200 hover:px-2 z-10"
          title="Expand sidebar"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      )}
    </aside>
  );
};