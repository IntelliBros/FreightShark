import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboardIcon, UsersIcon, SettingsIcon, ChevronDownIcon, ChevronRightIcon, LogOutIcon, ChevronLeftIcon, ShieldIcon, BarChart2Icon, ActivityIcon, UserCogIcon, GlobeIcon, AlertOctagonIcon, DatabaseIcon, ServerIcon, KeyIcon, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
interface AdminSidebarProps {
  onMobileClose?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ onMobileClose }) => {
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
  return <aside className={`bg-white border-r border-gray-200 h-full flex flex-col transition-all duration-300 relative ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className={`p-6 ${isCollapsed ? 'p-3 flex justify-center' : ''}`}>
        {isCollapsed ? (
          <img src="/shark-icon.svg" alt="Freight Shark" className="w-14 h-14" />
        ) : (
          <div>
            <img src="/freight-shark-logo.svg" alt="Freight Shark" className="h-10" />
            <p className="text-xs text-gray-500 mt-2">Administrator Portal</p>
          </div>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          <li>
            <Link to="/admin" onClick={handleLinkClick} className={`flex items-center ${isCollapsed ? 'justify-center' : ''} px-3 py-2.5 sm:py-2 rounded-lg ${isActive('/admin') ? 'bg-[#00b4d8]/10 text-[#00b4d8]' : 'text-gray-700 hover:bg-gray-50'} min-h-[44px]`}>
              <LayoutDashboardIcon className={`${isCollapsed ? 'h-5 w-5' : 'h-4 w-4'} min-w-4`} />
              {!isCollapsed && <span className="ml-3 text-sm">Dashboard</span>}
            </Link>
          </li>
          <li>
            <button onClick={() => toggleExpanded('users')} className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} w-full px-3 py-2.5 sm:py-2 rounded-lg ${isGroupActive('/admin/users') ? 'bg-[#00b4d8]/10 text-[#00b4d8]' : 'text-gray-700 hover:bg-gray-50'} min-h-[44px]`}>
              <div className="flex items-center">
                <UsersIcon className={`${isCollapsed ? 'h-5 w-5' : 'h-4 w-4'} min-w-4`} />
                {!isCollapsed && <span className="ml-3 text-sm">Users</span>}
              </div>
              {!isCollapsed && (expanded.users ? <ChevronDownIcon className="h-3.5 w-3.5" /> : <ChevronRightIcon className="h-3.5 w-3.5" />)}
            </button>
            {expanded.users && !isCollapsed && <ul className="mt-1 ml-7 space-y-1">
                <li>
                  <Link to="/admin/users/customers" onClick={handleLinkClick} className={`block px-3 py-2 rounded-lg text-sm ${isActive('/admin/users/customers') ? 'bg-[#00b4d8]/10 text-[#00b4d8]' : 'text-gray-600 hover:bg-gray-50'} min-h-[36px] flex items-center`}>
                    Customers
                  </Link>
                </li>
                <li>
                  <Link to="/admin/users/staff" onClick={handleLinkClick} className={`block px-3 py-2 rounded-lg text-sm ${isActive('/admin/users/staff') ? 'bg-[#00b4d8]/10 text-[#00b4d8]' : 'text-gray-600 hover:bg-gray-50'} min-h-[36px] flex items-center`}>
                    Staff Members
                  </Link>
                </li>
                <li>
                  <Link to="/admin/users/admins" onClick={handleLinkClick} className={`block px-3 py-2 rounded-lg text-sm ${isActive('/admin/users/admins') ? 'bg-[#00b4d8]/10 text-[#00b4d8]' : 'text-gray-600 hover:bg-gray-50'} min-h-[36px] flex items-center`}>
                    Administrators
                  </Link>
                </li>
              </ul>}
          </li>
          <li>
            <Link to="/admin/analytics" onClick={handleLinkClick} className={`flex items-center ${isCollapsed ? 'justify-center' : ''} px-3 py-2.5 sm:py-2 rounded-lg ${isActive('/admin/analytics') ? 'bg-[#00b4d8]/10 text-[#00b4d8]' : 'text-gray-700 hover:bg-gray-50'} min-h-[44px]`}>
              <BarChart2Icon className={`${isCollapsed ? 'h-5 w-5' : 'h-4 w-4'} min-w-4`} />
              {!isCollapsed && <span className="ml-3 text-sm">Analytics</span>}
            </Link>
          </li>
          <li>
            <Link to="/admin/audit-logs" onClick={handleLinkClick} className={`flex items-center ${isCollapsed ? 'justify-center' : ''} px-3 py-2.5 sm:py-2 rounded-lg ${isActive('/admin/audit-logs') ? 'bg-[#00b4d8]/10 text-[#00b4d8]' : 'text-gray-700 hover:bg-gray-50'} min-h-[44px]`}>
              <ActivityIcon className={`${isCollapsed ? 'h-5 w-5' : 'h-4 w-4'} min-w-4`} />
              {!isCollapsed && <span className="ml-3 text-sm">Audit Logs</span>}
            </Link>
          </li>
          <li>
            <button onClick={() => toggleExpanded('system')} className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} w-full px-3 py-2.5 sm:py-2 rounded-lg ${isGroupActive('/admin/system') ? 'bg-[#00b4d8]/10 text-[#00b4d8]' : 'text-gray-700 hover:bg-gray-50'} min-h-[44px]`}>
              <div className="flex items-center">
                <SettingsIcon className={`${isCollapsed ? 'h-5 w-5' : 'h-4 w-4'} min-w-4`} />
                {!isCollapsed && <span className="ml-3 text-sm">System</span>}
              </div>
              {!isCollapsed && (expanded.system ? <ChevronDownIcon className="h-3.5 w-3.5" /> : <ChevronRightIcon className="h-3.5 w-3.5" />)}
            </button>
            {expanded.system && !isCollapsed && <ul className="mt-1 ml-7 space-y-1">
                <li>
                  <Link to="/admin/system/general" onClick={handleLinkClick} className={`block px-3 py-2 rounded-lg text-xs ${isActive('/admin/system/general') ? 'bg-[#00b4d8]/10 text-[#00b4d8]' : 'text-gray-600 hover:bg-gray-50'} min-h-[36px] flex items-center`}>
                    General Settings
                  </Link>
                </li>
                <li>
                  <Link to="/admin/system/integrations" onClick={handleLinkClick} className={`block px-3 py-2 rounded-lg text-xs ${isActive('/admin/system/integrations') ? 'bg-[#00b4d8]/10 text-[#00b4d8]' : 'text-gray-600 hover:bg-gray-50'} min-h-[36px] flex items-center`}>
                    Integrations
                  </Link>
                </li>
                <li>
                  <Link to="/admin/system/notifications" onClick={handleLinkClick} className={`block px-3 py-2 rounded-lg text-xs ${isActive('/admin/system/notifications') ? 'bg-[#00b4d8]/10 text-[#00b4d8]' : 'text-gray-600 hover:bg-gray-50'} min-h-[36px] flex items-center`}>
                    Notifications
                  </Link>
                </li>
                <li>
                  <Link to="/admin/system/email" onClick={handleLinkClick} className={`block px-3 py-2 rounded-lg text-xs ${isActive('/admin/system/email') ? 'bg-[#00b4d8]/10 text-[#00b4d8]' : 'text-gray-600 hover:bg-gray-50'} min-h-[36px] flex items-center`}>
                    Email Settings
                  </Link>
                </li>
              </ul>}
          </li>
          <li>
            <button onClick={() => toggleExpanded('security')} className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} w-full px-3 py-2.5 rounded-lg ${isGroupActive('/admin/security') ? 'bg-[#00b4d8]/10 text-[#00b4d8]' : 'text-gray-700 hover:bg-gray-50'} min-h-[44px]`}>
              <div className="flex items-center">
                <KeyIcon className={`${isCollapsed ? 'h-5 w-5' : 'h-4 w-4'} min-w-4`} />
                {!isCollapsed && <span className="ml-3 text-sm">Security</span>}
              </div>
              {!isCollapsed && (expanded.security ? <ChevronDownIcon className="h-3.5 w-3.5" /> : <ChevronRightIcon className="h-3.5 w-3.5" />)}
            </button>
            {expanded.security && !isCollapsed && <ul className="mt-1 ml-7 space-y-1">
                <li>
                  <Link to="/admin/security/roles" onClick={handleLinkClick} className={`block px-3 py-2 rounded-lg text-xs ${isActive('/admin/security/roles') ? 'bg-[#00b4d8]/10 text-[#00b4d8]' : 'text-gray-600 hover:bg-gray-50'} min-h-[36px] flex items-center`}>
                    Roles & Permissions
                  </Link>
                </li>
                <li>
                  <Link to="/admin/security/api-keys" onClick={handleLinkClick} className={`block px-3 py-2 rounded-lg text-xs ${isActive('/admin/security/api-keys') ? 'bg-[#00b4d8]/10 text-[#00b4d8]' : 'text-gray-600 hover:bg-gray-50'} min-h-[36px] flex items-center`}>
                    API Keys
                  </Link>
                </li>
              </ul>}
          </li>
        </ul>
      </nav>
      <div className={`p-5 border-t border-gray-100 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
        <button onClick={logout} className={`flex items-center w-full px-3 py-2 mt-2 text-gray-700 hover:bg-gray-50 rounded-lg ${isCollapsed ? 'justify-center' : ''} min-h-[44px]`}>
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
    </aside>;
};