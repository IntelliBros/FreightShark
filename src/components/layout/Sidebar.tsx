import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboardIcon, FileTextIcon, TruckIcon, PackageIcon, FileIcon, SettingsIcon, LogOutIcon, ChevronLeftIcon, ChevronRightIcon, BellIcon } from 'lucide-react';
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
  return <aside className={`bg-gray-50 border-r border-gray-200 h-full flex flex-col transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      <div className={`p-6 ${isCollapsed ? 'p-4 flex justify-center' : ''}`}>
        {isCollapsed ? <div className="flex items-center justify-center">
            <span className="text-2xl">🦈</span>
          </div> : <div className="flex items-center">
            <span className="text-2xl mr-2">🦈</span>
            <div>
              <div className="font-bold text-gray-900 text-sm">FREIGHT</div>
              <div className="font-bold text-gray-900 text-sm -mt-1">SHARK</div>
            </div>
          </div>}
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          <li>
            <Link to="/" className={`flex items-center px-3 py-2 rounded-lg ${isActive('/') ? 'bg-teal-50 text-teal-600 border-l-4 border-teal-500 -ml-[4px]' : 'text-gray-700 hover:bg-white'}`}>
              <LayoutDashboardIcon className="h-4 w-4 min-w-4" />
              {!isCollapsed && <span className="ml-3 text-sm">Dashboard</span>}
            </Link>
          </li>
          <li>
            <Link to="/quotes" className={`flex items-center px-3 py-2 rounded-lg ${isGroupActive('/quotes') && !isActive('/quotes/new') ? 'bg-teal-50 text-teal-600 border-l-4 border-teal-500 -ml-[4px]' : 'text-gray-700 hover:bg-white'}`}>
              <FileTextIcon className="h-4 w-4 min-w-4" />
              {!isCollapsed && <span className="ml-3 text-sm">Quotes</span>}
            </Link>
          </li>
          <li>
            <Link to="/shipments" className={`flex items-center px-3 py-2 rounded-lg ${isGroupActive('/shipments') ? 'bg-teal-50 text-teal-600 border-l-4 border-teal-500 -ml-[4px]' : 'text-gray-700 hover:bg-white'}`}>
              <TruckIcon className="h-4 w-4 min-w-4" />
              {!isCollapsed && <span className="ml-3 text-sm">Shipments</span>}
            </Link>
          </li>
          <li>
            <Link to="/samples" className={`flex items-center px-3 py-2 rounded-lg ${isActive('/samples') ? 'bg-teal-50 text-teal-600 border-l-4 border-teal-500 -ml-[4px]' : 'text-gray-700 hover:bg-white'}`}>
              <PackageIcon className="h-4 w-4 min-w-4" />
              {!isCollapsed && <span className="ml-3 text-sm">Sample Consolidation</span>}
            </Link>
          </li>
          <li>
            <Link to="/documents" className={`flex items-center px-3 py-2 rounded-lg ${isActive('/documents') ? 'bg-teal-50 text-teal-600 border-l-4 border-teal-500 -ml-[4px]' : 'text-gray-700 hover:bg-white'}`}>
              <FileIcon className="h-4 w-4 min-w-4" />
              {!isCollapsed && <span className="ml-3 text-sm">Documents</span>}
            </Link>
          </li>
          <li>
            <Link to="/announcements" className={`flex items-center px-3 py-2 rounded-lg ${isActive('/announcements') ? 'bg-teal-50 text-teal-600 border-l-4 border-teal-500 -ml-[4px]' : 'text-gray-700 hover:bg-white'}`}>
              <BellIcon className="h-4 w-4 min-w-4" />
              {!isCollapsed && <span className="ml-3 text-sm">Announcements</span>}
            </Link>
          </li>
        </ul>
      </nav>
      <div className={`p-5 border-t border-gray-100 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
        <Link to="/quotes/new" className={`flex items-center justify-center px-3 py-2 mb-3 rounded-lg bg-teal-500 text-white hover:bg-teal-600 transition-colors ${isCollapsed ? 'w-10 h-10 p-0' : ''}`}>
          {isCollapsed ? (
            <span className="text-lg font-bold">+</span>
          ) : (
            <span className="text-sm font-medium">New Quote</span>
          )}
        </Link>
        <Link to="/settings" className={`flex items-center px-3 py-2 rounded-lg ${isActive('/settings') ? 'bg-teal-50 text-teal-600 border-l-4 border-teal-500 -ml-[4px]' : 'text-gray-700 hover:bg-white'}`}>
          <SettingsIcon className="h-4 w-4 min-w-4" />
          {!isCollapsed && <span className="ml-3 text-sm">Settings</span>}
        </Link>
        <button onClick={logout} className={`flex items-center w-full px-3 py-2 mt-2 text-gray-700 hover:bg-white rounded-lg ${isCollapsed ? 'justify-center' : ''}`}>
          <LogOutIcon className="h-4 w-4 min-w-4" />
          {!isCollapsed && <span className="ml-3 text-sm">Sign Out</span>}
        </button>
        <button onClick={toggleSidebar} className="mt-4 flex items-center justify-center w-full px-3 py-1.5 text-xs text-gray-500 hover:bg-white rounded-lg">
          {isCollapsed ? <ChevronRightIcon className="h-4 w-4" /> : <div className="flex items-center w-full">
              <ChevronLeftIcon className="h-4 w-4 mr-1.5" />
              <span>Collapse</span>
            </div>}
        </button>
      </div>
    </aside>;
};