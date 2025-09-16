import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
export const AdminLayout = () => {
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
  // Redirect to login if not authenticated or not an admin
  if (!isAuthenticated || user?.role !== 'admin') {
    return <Navigate to="/login" />;
  }
  return <div className="flex h-screen bg-[#F5F7FA]">
      <AdminSidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <AdminHeader />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>;
};