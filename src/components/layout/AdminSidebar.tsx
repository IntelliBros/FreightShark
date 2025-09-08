import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboardIcon, UsersIcon, SettingsIcon, ChevronDownIcon, ChevronRightIcon, LogOutIcon, ChevronLeftIcon, ShieldIcon, BarChart2Icon, ActivityIcon, UserCogIcon, GlobeIcon, AlertOctagonIcon, DatabaseIcon, ServerIcon, KeyIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
export const AdminSidebar = () => {
  const location = useLocation();
  const {
    logout
  } = useAuth();
  const [expanded, setExpanded] = useState({
    users: true,
    system: true,
    security: false
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
  return <aside className={`bg-white border-r border-gray-200 h-full flex flex-col transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      <div className={`p-6 ${isCollapsed ? 'p-4 flex justify-center' : ''}`}>
        {isCollapsed ? <div className="w-8 h-8 rounded-full bg-[#1E293B] flex items-center justify-center">
            <ShieldIcon className="h-4 w-4 text-white" />
          </div> : <div className="h-8 flex items-center">
            <div className="w-8 h-8 rounded-full bg-[#1E293B] flex items-center justify-center mr-2">
              <ShieldIcon className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Administrator Portal</p>
            </div>
          </div>}
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          <li>
            <Link to="/admin" className={`flex items-center px-3 py-2 rounded-lg ${isActive('/admin') ? 'bg-[#E6EDF8] text-[#1E293B]' : 'text-gray-700 hover:bg-gray-50'}`}>
              <LayoutDashboardIcon className="h-4 w-4 min-w-4" />
              {!isCollapsed && <span className="ml-3 text-sm">Dashboard</span>}
            </Link>
          </li>
          <li>
            <button onClick={() => toggleExpanded('users')} className={`flex items-center justify-between w-full px-3 py-2 rounded-lg ${isGroupActive('/admin/users') ? 'bg-[#E6EDF8] text-[#1E293B]' : 'text-gray-700 hover:bg-gray-50'}`}>
              <div className="flex items-center">
                <UsersIcon className="h-4 w-4 min-w-4" />
                {!isCollapsed && <span className="ml-3 text-sm">Users</span>}
              </div>
              {!isCollapsed && (expanded.users ? <ChevronDownIcon className="h-3.5 w-3.5" /> : <ChevronRightIcon className="h-3.5 w-3.5" />)}
            </button>
            {expanded.users && !isCollapsed && <ul className="mt-1 ml-7 space-y-1">
                <li>
                  <Link to="/admin/users/customers" className={`block px-3 py-1.5 rounded-lg text-xs ${isActive('/admin/users/customers') ? 'bg-[#E6EDF8] text-[#1E293B]' : 'text-gray-600 hover:bg-gray-50'}`}>
                    Customers
                  </Link>
                </li>
                <li>
                  <Link to="/admin/users/staff" className={`block px-3 py-1.5 rounded-lg text-xs ${isActive('/admin/users/staff') ? 'bg-[#E6EDF8] text-[#1E293B]' : 'text-gray-600 hover:bg-gray-50'}`}>
                    Staff Members
                  </Link>
                </li>
                <li>
                  <Link to="/admin/users/admins" className={`block px-3 py-1.5 rounded-lg text-xs ${isActive('/admin/users/admins') ? 'bg-[#E6EDF8] text-[#1E293B]' : 'text-gray-600 hover:bg-gray-50'}`}>
                    Administrators
                  </Link>
                </li>
              </ul>}
          </li>
          <li>
            <Link to="/admin/analytics" className={`flex items-center px-3 py-2 rounded-lg ${isActive('/admin/analytics') ? 'bg-[#E6EDF8] text-[#1E293B]' : 'text-gray-700 hover:bg-gray-50'}`}>
              <BarChart2Icon className="h-4 w-4 min-w-4" />
              {!isCollapsed && <span className="ml-3 text-sm">Analytics</span>}
            </Link>
          </li>
          <li>
            <Link to="/admin/audit-logs" className={`flex items-center px-3 py-2 rounded-lg ${isActive('/admin/audit-logs') ? 'bg-[#E6EDF8] text-[#1E293B]' : 'text-gray-700 hover:bg-gray-50'}`}>
              <ActivityIcon className="h-4 w-4 min-w-4" />
              {!isCollapsed && <span className="ml-3 text-sm">Audit Logs</span>}
            </Link>
          </li>
          <li>
            <button onClick={() => toggleExpanded('system')} className={`flex items-center justify-between w-full px-3 py-2 rounded-lg ${isGroupActive('/admin/system') ? 'bg-[#E6EDF8] text-[#1E293B]' : 'text-gray-700 hover:bg-gray-50'}`}>
              <div className="flex items-center">
                <SettingsIcon className="h-4 w-4 min-w-4" />
                {!isCollapsed && <span className="ml-3 text-sm">System</span>}
              </div>
              {!isCollapsed && (expanded.system ? <ChevronDownIcon className="h-3.5 w-3.5" /> : <ChevronRightIcon className="h-3.5 w-3.5" />)}
            </button>
            {expanded.system && !isCollapsed && <ul className="mt-1 ml-7 space-y-1">
                <li>
                  <Link to="/admin/system/general" className={`block px-3 py-1.5 rounded-lg text-xs ${isActive('/admin/system/general') ? 'bg-[#E6EDF8] text-[#1E293B]' : 'text-gray-600 hover:bg-gray-50'}`}>
                    General Settings
                  </Link>
                </li>
                <li>
                  <Link to="/admin/system/integrations" className={`block px-3 py-1.5 rounded-lg text-xs ${isActive('/admin/system/integrations') ? 'bg-[#E6EDF8] text-[#1E293B]' : 'text-gray-600 hover:bg-gray-50'}`}>
                    Integrations
                  </Link>
                </li>
                <li>
                  <Link to="/admin/system/notifications" className={`block px-3 py-1.5 rounded-lg text-xs ${isActive('/admin/system/notifications') ? 'bg-[#E6EDF8] text-[#1E293B]' : 'text-gray-600 hover:bg-gray-50'}`}>
                    Notifications
                  </Link>
                </li>
              </ul>}
          </li>
          <li>
            <button onClick={() => toggleExpanded('security')} className={`flex items-center justify-between w-full px-3 py-2 rounded-lg ${isGroupActive('/admin/security') ? 'bg-[#E6EDF8] text-[#1E293B]' : 'text-gray-700 hover:bg-gray-50'}`}>
              <div className="flex items-center">
                <KeyIcon className="h-4 w-4 min-w-4" />
                {!isCollapsed && <span className="ml-3 text-sm">Security</span>}
              </div>
              {!isCollapsed && (expanded.security ? <ChevronDownIcon className="h-3.5 w-3.5" /> : <ChevronRightIcon className="h-3.5 w-3.5" />)}
            </button>
            {expanded.security && !isCollapsed && <ul className="mt-1 ml-7 space-y-1">
                <li>
                  <Link to="/admin/security/roles" className={`block px-3 py-1.5 rounded-lg text-xs ${isActive('/admin/security/roles') ? 'bg-[#E6EDF8] text-[#1E293B]' : 'text-gray-600 hover:bg-gray-50'}`}>
                    Roles & Permissions
                  </Link>
                </li>
                <li>
                  <Link to="/admin/security/api-keys" className={`block px-3 py-1.5 rounded-lg text-xs ${isActive('/admin/security/api-keys') ? 'bg-[#E6EDF8] text-[#1E293B]' : 'text-gray-600 hover:bg-gray-50'}`}>
                    API Keys
                  </Link>
                </li>
              </ul>}
          </li>
        </ul>
      </nav>
      <div className={`p-5 border-t border-gray-100 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
        <button onClick={logout} className={`flex items-center w-full px-3 py-2 mt-2 text-gray-700 hover:bg-gray-50 rounded-lg ${isCollapsed ? 'justify-center' : ''}`}>
          <LogOutIcon className="h-4 w-4 min-w-4" />
          {!isCollapsed && <span className="ml-3 text-sm">Sign Out</span>}
        </button>
        <button onClick={toggleSidebar} className="mt-4 flex items-center justify-center w-full px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50 rounded-lg">
          {isCollapsed ? <ChevronRightIcon className="h-4 w-4" /> : <div className="flex items-center w-full">
              <ChevronLeftIcon className="h-4 w-4 mr-1.5" />
              <span>Collapse</span>
            </div>}
        </button>
      </div>
    </aside>;
};