import React, { useState } from 'react';
import { BellIcon, UserIcon, SearchIcon, ChevronDownIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
export const StaffHeader = () => {
  const {
    user,
    logout
  } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const toggleProfile = () => setIsProfileOpen(!isProfileOpen);
  return <header className="bg-white h-16 flex items-center px-6 justify-between border-b border-gray-200">
      <div className="flex items-center">
        <div className="relative hidden md:block">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input type="text" placeholder="Search quotes, shipments, or customers..." className="pl-10 pr-4 py-1.5 border border-gray-300 rounded-full focus:outline-none focus:ring-1 focus:ring-[#00b4d8] focus:border-[#00b4d8] w-80 bg-white text-sm text-gray-900 placeholder-gray-400" />
        </div>
      </div>
      <div className="flex items-center space-x-5">
        <button className="relative p-1.5 text-gray-600 hover:text-gray-900 focus:outline-none">
          <BellIcon className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-orange-500 rounded-full"></span>
        </button>
        <div className="relative">
          <button className="flex items-center space-x-2 focus:outline-none" onClick={toggleProfile}>
            <div className="w-8 h-8 rounded-full bg-[#00b4d8] flex items-center justify-center">
              <UserIcon className="h-4 w-4 text-white" />
            </div>
            <div className="hidden md:flex items-center">
              <span className="text-sm text-gray-700 mr-1">{user?.name}</span>
              <span className="text-xs text-gray-500">Staff</span>
              <ChevronDownIcon className="h-4 w-4 text-gray-500 ml-1" />
            </div>
          </button>
          {isProfileOpen && <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg border border-gray-100 py-1 z-10 shadow-lg">
              <Link
                to="/staff/settings"
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => setIsProfileOpen(false)}
              >
                Settings
              </Link>
              <button onClick={logout} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                Sign out
              </button>
            </div>}
        </div>
      </div>
    </header>;
};