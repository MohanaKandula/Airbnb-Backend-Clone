import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import RoleProtectedRoute from '../components/RoleProtectedRoute';

const AdminLayout = () => {
  const { user } = useAuth();

  return (
    <RoleProtectedRoute allowedRoles={['ROLE_HOTEL_MANAGER']}>
      <div className="flex flex-col min-h-screen bg-gray-100">
        {/* Header */}
        <Navbar />

        {/* Admin Frame Body */}
        <div className="flex-1 flex flex-col md:flex-row">
          {/* Sidebar */}
          <Sidebar />

          {/* Admin Page Content */}
          <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full overflow-x-hidden animate-in fade-in duration-300">
            <Outlet />
          </main>
        </div>
      </div>
    </RoleProtectedRoute>
  );
};

export default AdminLayout;
