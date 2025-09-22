import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboardIcon, FileTextIcon, TruckIcon, BarChartIcon, SettingsIcon, ChevronDownIcon, ChevronRightIcon, LogOutIcon, ChevronLeftIcon, ClipboardCheckIcon, DollarSignIcon, ReceiptIcon, MessageCircleIcon, InboxIcon, BellIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
export const StaffSidebar = () => {
  const location = useLocation();
  const {
    logout
  } = useAuth();
  const [expanded, setExpanded] = useState({
    quotes: true,
    shipments: true,
    invoices: true
  });
  const [isCollapsed, setIsCollapsed] = useState(false);
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
  return <aside className={`bg-white border-r border-gray-200 h-full flex flex-col transition-all duration-300 relative ${isCollapsed ? 'w-20' : 'w-64'}`}>
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
            <Link to="/staff" className={`flex items-center ${isCollapsed ? 'justify-center' : ''} px-3 py-2 rounded-lg ${isActive('/staff') ? 'bg-[#E6EDF8] text-[#1E2A45]' : 'text-gray-700 hover:bg-gray-50'}`}>
              <LayoutDashboardIcon className={`${isCollapsed ? 'h-5 w-5' : 'h-4 w-4'} min-w-4`} />
              {!isCollapsed && <span className="ml-3 text-sm">Dashboard</span>}
            </Link>
          </li>
          <li>
            <button onClick={() => toggleExpanded('quotes')} className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} w-full px-3 py-2 rounded-lg ${isGroupActive('/staff/quotes') ? 'bg-[#E6EDF8] text-[#1E2A45]' : 'text-gray-700 hover:bg-gray-50'}`}>
              <div className="flex items-center">
                <FileTextIcon className={`${isCollapsed ? 'h-5 w-5' : 'h-4 w-4'} min-w-4`} />
                {!isCollapsed && <span className="ml-3 text-sm">Quotes</span>}
              </div>
              {!isCollapsed && (expanded.quotes ? <ChevronDownIcon className="h-3.5 w-3.5" /> : <ChevronRightIcon className="h-3.5 w-3.5" />)}
            </button>
            {expanded.quotes && !isCollapsed && <ul className="mt-1 ml-7 space-y-1">
                <li>
                  <Link to="/staff/quotes/requests" className={`block px-3 py-1.5 rounded-lg text-xs ${isActive('/staff/quotes/requests') ? 'bg-[#E6EDF8] text-[#1E2A45]' : 'text-gray-600 hover:bg-gray-50'}`}>
                    Quote Requests
                  </Link>
                </li>
                <li>
                  <Link to="/staff/quotes/pending" className={`block px-3 py-1.5 rounded-lg text-xs ${isActive('/staff/quotes/pending') ? 'bg-[#E6EDF8] text-[#1E2A45]' : 'text-gray-600 hover:bg-gray-50'}`}>
                    Pending Approval
                  </Link>
                </li>
              </ul>}
          </li>
          <li>
            <button onClick={() => toggleExpanded('shipments')} className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} w-full px-3 py-2 rounded-lg ${isGroupActive('/staff/shipments') ? 'bg-[#E6EDF8] text-[#1E2A45]' : 'text-gray-700 hover:bg-gray-50'}`}>
              <div className="flex items-center">
                <TruckIcon className={`${isCollapsed ? 'h-5 w-5' : 'h-4 w-4'} min-w-4`} />
                {!isCollapsed && <span className="ml-3 text-sm">Shipments</span>}
              </div>
              {!isCollapsed && (expanded.shipments ? <ChevronDownIcon className="h-3.5 w-3.5" /> : <ChevronRightIcon className="h-3.5 w-3.5" />)}
            </button>
            {expanded.shipments && !isCollapsed && <ul className="mt-1 ml-7 space-y-1">
                <li>
                  <Link to="/staff/shipments/active" className={`block px-3 py-1.5 rounded-lg text-xs ${isActive('/staff/shipments/active') ? 'bg-[#E6EDF8] text-[#1E2A45]' : 'text-gray-600 hover:bg-gray-50'}`}>
                    Active
                  </Link>
                </li>
                <li>
                  <Link to="/staff/shipments/completed" className={`block px-3 py-1.5 rounded-lg text-xs ${isActive('/staff/shipments/completed') ? 'bg-[#E6EDF8] text-[#1E2A45]' : 'text-gray-600 hover:bg-gray-50'}`}>
                    Completed
                  </Link>
                </li>
              </ul>}
          </li>
          <li>
            <button onClick={() => toggleExpanded('invoices')} className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} w-full px-3 py-2 rounded-lg ${isGroupActive('/staff/invoices') ? 'bg-[#E6EDF8] text-[#1E2A45]' : 'text-gray-700 hover:bg-gray-50'}`}>
              <div className="flex items-center">
                <ReceiptIcon className={`${isCollapsed ? 'h-5 w-5' : 'h-4 w-4'} min-w-4`} />
                {!isCollapsed && <span className="ml-3 text-sm">Invoices</span>}
              </div>
              {!isCollapsed && (expanded.invoices ? <ChevronDownIcon className="h-3.5 w-3.5" /> : <ChevronRightIcon className="h-3.5 w-3.5" />)}
            </button>
            {expanded.invoices && !isCollapsed && <ul className="mt-1 ml-7 space-y-1">
                <li>
                  <Link to="/staff/invoices/pending" className={`block px-3 py-1.5 rounded-lg text-xs ${isActive('/staff/invoices/pending') ? 'bg-[#E6EDF8] text-[#1E2A45]' : 'text-gray-600 hover:bg-gray-50'}`}>
                    Pending
                  </Link>
                </li>
                <li>
                  <Link to="/staff/invoices/paid" className={`block px-3 py-1.5 rounded-lg text-xs ${isActive('/staff/invoices/paid') ? 'bg-[#E6EDF8] text-[#1E2A45]' : 'text-gray-600 hover:bg-gray-50'}`}>
                    Paid
                  </Link>
                </li>
              </ul>}
          </li>
          <li>
            <Link to="/staff/messages" className={`flex items-center ${isCollapsed ? 'justify-center' : ''} px-3 py-2 rounded-lg ${isActive('/staff/messages') || isActive('/staff/messages/inbox') ? 'bg-[#E6EDF8] text-[#1E2A45]' : 'text-gray-700 hover:bg-gray-50'}`}>
              <MessageCircleIcon className={`${isCollapsed ? 'h-5 w-5' : 'h-4 w-4'} min-w-4`} />
              {!isCollapsed && <span className="ml-3 text-sm">Messages</span>}
            </Link>
          </li>
          <li>
            <Link to="/staff/reports" className={`flex items-center ${isCollapsed ? 'justify-center' : ''} px-3 py-2 rounded-lg ${isActive('/staff/reports') ? 'bg-[#E6EDF8] text-[#1E2A45]' : 'text-gray-700 hover:bg-gray-50'}`}>
              <BarChartIcon className={`${isCollapsed ? 'h-5 w-5' : 'h-4 w-4'} min-w-4`} />
              {!isCollapsed && <span className="ml-3 text-sm">Reports</span>}
            </Link>
          </li>
          <li>
            <Link to="/staff/announcements" className={`flex items-center ${isCollapsed ? 'justify-center' : ''} px-3 py-2 rounded-lg ${isActive('/staff/announcements') ? 'bg-[#E6EDF8] text-[#1E2A45]' : 'text-gray-700 hover:bg-gray-50'}`}>
              <BellIcon className={`${isCollapsed ? 'h-5 w-5' : 'h-4 w-4'} min-w-4`} />
              {!isCollapsed && <span className="ml-3 text-sm">Announcements</span>}
            </Link>
          </li>
        </ul>
      </nav>
      <div className={`p-5 border-t border-gray-100 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
        <Link to="/staff/settings" className={`flex items-center ${isCollapsed ? 'justify-center' : ''} px-3 py-2 rounded-lg ${isActive('/staff/settings') ? 'bg-[#E6EDF8] text-[#1E2A45]' : 'text-gray-700 hover:bg-gray-50'}`}>
          <SettingsIcon className={`${isCollapsed ? 'h-5 w-5' : 'h-4 w-4'} min-w-4`} />
          {!isCollapsed && <span className="ml-3 text-sm">Settings</span>}
        </Link>
        <button onClick={logout} className={`flex items-center w-full px-3 py-2 mt-2 text-gray-700 hover:bg-gray-50 rounded-lg ${isCollapsed ? 'justify-center' : ''}`}>
          <LogOutIcon className={`${isCollapsed ? 'h-5 w-5' : 'h-4 w-4'} min-w-4`} />
          {!isCollapsed && <span className="ml-3 text-sm">Sign Out</span>}
        </button>
      </div>
      {!isCollapsed && (
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-1/2 -translate-y-1/2 bg-[#00b4d8] hover:bg-[#0096b8] text-white rounded-r-md px-1 py-6 shadow-lg transition-all duration-200 hover:px-2 z-10"
          title="Collapse sidebar"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
      )}
      {isCollapsed && (
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-1/2 -translate-y-1/2 bg-[#00b4d8] hover:bg-[#0096b8] text-white rounded-r-md px-1 py-6 shadow-lg transition-all duration-200 hover:px-2 z-10"
          title="Expand sidebar"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      )}
    </aside>;
};