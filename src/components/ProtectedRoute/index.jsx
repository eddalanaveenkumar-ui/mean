import React from 'react';
import { Navigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

/**
 * ProtectedRoute — guards routes that require authentication.
 * If the user is not logged in, redirects to the home page.
 */
export default function ProtectedRoute({ children }) {
  const { user } = useApp();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
}
