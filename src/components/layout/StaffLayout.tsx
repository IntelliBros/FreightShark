import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { StaffSidebar } from './StaffSidebar';
import { StaffHeader } from './StaffHeader';
export const StaffLayout = () => {
  const {
    isAuthenticated,
    isLoading,
    user
  } = useAuth();
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-10 h-10 border-4 border-[#1E2A45] rounded-full border-t-transparent animate-spin"></div>
      </div>;
  }
  // Redirect to login if not authenticated or not a staff member
  if (!isAuthenticated || user?.role !== 'staff') {
    return <Navigate to="/login" />;
  }
  return <div className="flex h-screen bg-[#F5F7FA]">
      <StaffSidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <StaffHeader />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>;
};