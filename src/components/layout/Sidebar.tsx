import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboardIcon, FileTextIcon, TruckIcon, PackageIcon, FileIcon, SettingsIcon, LogOutIcon, ChevronLeftIcon, ChevronRightIcon, BellIcon, Calculator } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
export const Sidebar = () => {
  const location = useLocation();
  const {
    logout
  } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  const isGroupActive = (path: string) => {
    return location.pathname.startsWith(path);
  };
  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };
  return <aside className={`bg-white border-r border-gray-200 h-full flex flex-col transition-all duration-300 relative ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className={`p-6 ${isCollapsed ? 'p-3 flex justify-center' : ''}`}>
        {isCollapsed ? (
          <img src="/shark-icon.svg" alt="Freight Shark" className="w-14 h-14" />
        ) : (
          <img src="/freight-shark-logo.svg" alt="Freight Shark" className="h-10" />
        )}
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          <li>
            <Link to="/" className={`flex items-center ${isCollapsed ? 'justify-center' : ''} px-3 py-2 rounded-lg ${isActive('/') ? 'bg-[#00b4d8]/10 text-[#00b4d8]' : 'text-gray-700 hover:bg-gray-50'}`}>
              <LayoutDashboardIcon className={`${isCollapsed ? 'h-6 w-6' : 'h-4 w-4'} min-w-4`} />
              {!isCollapsed && <span className="ml-3 text-sm">Dashboard</span>}
            </Link>
          </li>
          <li>
            <Link to="/quotes" className={`flex items-center ${isCollapsed ? 'justify-center' : ''} px-3 py-2 rounded-lg ${isGroupActive('/quotes') && !isActive('/quotes/new') ? 'bg-[#00b4d8]/10 text-[#00b4d8]' : 'text-gray-700 hover:bg-gray-50'}`}>
              <FileTextIcon className={`${isCollapsed ? 'h-6 w-6' : 'h-4 w-4'} min-w-4`} />
              {!isCollapsed && <span className="ml-3 text-sm">Quotes</span>}
            </Link>
          </li>
          <li>
            <Link to="/shipments" className={`flex items-center ${isCollapsed ? 'justify-center' : ''} px-3 py-2 rounded-lg ${isGroupActive('/shipments') && !isActive('/shipment-estimator') ? 'bg-[#00b4d8]/10 text-[#00b4d8]' : 'text-gray-700 hover:bg-gray-50'}`}>
              <TruckIcon className={`${isCollapsed ? 'h-6 w-6' : 'h-4 w-4'} min-w-4`} />
              {!isCollapsed && <span className="ml-3 text-sm">Shipments</span>}
            </Link>
          </li>
          <li>
            <Link to="/shipment-estimator" className={`flex items-center ${isCollapsed ? 'justify-center' : ''} px-3 py-2 rounded-lg ${isActive('/shipment-estimator') ? 'bg-[#00b4d8]/10 text-[#00b4d8]' : 'text-gray-700 hover:bg-gray-50'}`}>
              <Calculator className={`${isCollapsed ? 'h-6 w-6' : 'h-4 w-4'} min-w-4`} />
              {!isCollapsed && <span className="ml-3 text-sm">Shipment Estimator</span>}
            </Link>
          </li>
          <li>
            <Link to="/samples" className={`flex items-center ${isCollapsed ? 'justify-center' : ''} px-3 py-2 rounded-lg ${isActive('/samples') ? 'bg-[#00b4d8]/10 text-[#00b4d8]' : 'text-gray-700 hover:bg-gray-50'}`}>
              <PackageIcon className={`${isCollapsed ? 'h-6 w-6' : 'h-4 w-4'} min-w-4`} />
              {!isCollapsed && <span className="ml-3 text-sm">Sample Consolidation</span>}
            </Link>
          </li>
          <li>
            <Link to="/documents" className={`flex items-center ${isCollapsed ? 'justify-center' : ''} px-3 py-2 rounded-lg ${isActive('/documents') ? 'bg-[#00b4d8]/10 text-[#00b4d8]' : 'text-gray-700 hover:bg-gray-50'}`}>
              <FileIcon className={`${isCollapsed ? 'h-6 w-6' : 'h-4 w-4'} min-w-4`} />
              {!isCollapsed && <span className="ml-3 text-sm">Documents</span>}
            </Link>
          </li>
          <li>
            <Link to="/announcements" className={`flex items-center ${isCollapsed ? 'justify-center' : ''} px-3 py-2 rounded-lg ${isActive('/announcements') ? 'bg-[#00b4d8]/10 text-[#00b4d8]' : 'text-gray-700 hover:bg-gray-50'}`}>
              <BellIcon className={`${isCollapsed ? 'h-6 w-6' : 'h-4 w-4'} min-w-4`} />
              {!isCollapsed && <span className="ml-3 text-sm">Announcements</span>}
            </Link>
          </li>
        </ul>
      </nav>
      <div className={`p-5 border-t border-gray-100 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
        <Link to="/quotes/new" className={`flex items-center justify-center px-3 py-2 mb-3 rounded-lg bg-[#00b4d8] text-white hover:bg-[#0096b8] transition-colors ${isCollapsed ? 'w-12 h-12 p-0' : ''}`}>
          {isCollapsed ? (
            <span className="text-lg font-bold">+</span>
          ) : (
            <span className="text-sm font-medium">New Quote</span>
          )}
        </Link>
        <Link to="/settings" className={`flex items-center ${isCollapsed ? 'justify-center' : ''} px-3 py-2 rounded-lg ${isActive('/settings') ? 'bg-[#00b4d8]/10 text-[#00b4d8]' : 'text-gray-700 hover:bg-gray-50'}`}>
          <SettingsIcon className={`${isCollapsed ? 'h-6 w-6' : 'h-4 w-4'} min-w-4`} />
          {!isCollapsed && <span className="ml-3 text-sm">Settings</span>}
        </Link>
        <button onClick={logout} className={`flex items-center w-full px-3 py-2 mt-2 text-gray-700 hover:bg-gray-50 rounded-lg ${isCollapsed ? 'justify-center' : ''}`}>
          <LogOutIcon className={`${isCollapsed ? 'h-6 w-6' : 'h-4 w-4'} min-w-4`} />
          {!isCollapsed && <span className="ml-3 text-sm">Sign Out</span>}
        </button>
        {!isCollapsed && (
          <button onClick={toggleSidebar} className="mt-4 flex items-center justify-center w-full px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors border border-gray-200">
            <div className="flex items-center w-full justify-center">
              <ChevronLeftIcon className="h-5 w-5 mr-2" />
              <span>Collapse</span>
            </div>
          </button>
        )}
      </div>
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