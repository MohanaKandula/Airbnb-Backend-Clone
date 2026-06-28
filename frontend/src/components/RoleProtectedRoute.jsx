import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const RoleProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const userRoles = [user.role, ...(user.roles || [])].filter(Boolean);
  const hasAccess = allowedRoles.some(role => userRoles.includes(role));

  if (!hasAccess) {
    // If they don't have authorization, redirect them to the home page
    return <Navigate to="/" replace />;
  }

  return children;
};

export default RoleProtectedRoute;
