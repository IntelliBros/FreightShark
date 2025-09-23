import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { StaffSidebar } from './StaffSidebar';
import { StaffHeader } from './StaffHeader';
import { Menu, X } from 'lucide-react';
export const StaffLayout = () => {
  const {
    isAuthenticated,
    isLoading,
    user
  } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-10 h-10 border-4 border-[#1E2A45] rounded-full border-t-transparent animate-spin"></div>
      </div>;
  }
  // Redirect to login if not authenticated or not a staff member
  if (!isAuthenticated || user?.role !== 'staff') {
    return <Navigate to="/login" />;
  }
  return (
    <div className="flex h-screen bg-[#F5F7FA]">
      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Sidebar - hidden on mobile, visible on desktop */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50
        transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 transition-transform duration-300 ease-in-out
      `}>
        <StaffSidebar onMobileClose={() => setIsMobileMenuOpen(false)} />
      </div>

      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Mobile header with hamburger menu */}
        <header className="lg:hidden bg-white h-16 flex items-center px-4 justify-between border-b border-gray-200">
          <button
            onClick={toggleMobileMenu}
            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <div className="flex items-center">
            <img src="/shark-icon.svg" alt="Freight Shark" className="h-8 mr-2" />
            <span className="text-sm font-medium text-gray-700">Staff Portal</span>
          </div>
          <div className="w-10" /> {/* Spacer for centering logo */}
        </header>

        {/* Desktop header */}
        <div className="hidden lg:block">
          <StaffHeader />
        </div>

        {/* Main content area with responsive padding */}
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};