import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';
export const AppLayout = () => {
  const {
    isAuthenticated,
    isLoading
  } = useAuth();
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-10 h-10 border-4 border-[#1E2A45] rounded-full border-t-transparent animate-spin"></div>
      </div>;
  }
  if (!isAuthenticated) {
    return <Navigate to="/welcome" />;
  }
  return <div className="flex h-screen bg-[#F5F7FA]">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>;
};