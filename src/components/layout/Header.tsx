import React, { useState } from 'react';
import { BellIcon, MessageCircleIcon, UserIcon, SearchIcon, ChevronDownIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
export const Header = () => {
  const {
    user,
    logout
  } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const toggleProfile = () => setIsProfileOpen(!isProfileOpen);
  return <header className="bg-[#2E3B55] h-16 flex items-center px-6 justify-between">
      <div className="flex items-center">
        <h1 className="text-white font-bold text-xl mr-8">DDP Freight</h1>
        <div className="relative hidden md:block">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input type="text" placeholder="Search..." className="pl-10 pr-4 py-1.5 border border-[#4D5E7A] rounded-full focus:outline-none focus:ring-1 focus:ring-white/30 focus:border-white/30 w-60 bg-[#3A4A6B] text-sm text-white placeholder-gray-300" />
        </div>
      </div>
      <div className="flex items-center space-x-5">
        <button className="relative p-1.5 text-white/80 hover:text-white focus:outline-none">
          <BellIcon className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-[#F7941D] rounded-full"></span>
        </button>
        <button className="relative p-1.5 text-white/80 hover:text-white focus:outline-none">
          <MessageCircleIcon className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-[#F7941D] rounded-full"></span>
        </button>
        <div className="relative">
          <button className="flex items-center space-x-2 focus:outline-none" onClick={toggleProfile}>
            <div className="w-8 h-8 rounded-full bg-[#4D5E7A] flex items-center justify-center">
              <UserIcon className="h-4 w-4 text-white" />
            </div>
            <div className="hidden md:flex items-center">
              <span className="text-sm text-white mr-1">{user?.name}</span>
              <ChevronDownIcon className="h-4 w-4 text-white/70" />
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