import React from 'react';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ isAuthenticated, children }) {
  // If user is not authenticated, redirect to SignIn page
  if (!isAuthenticated) {
    return <Navigate to="/signin" />;
  }
  return children;
}

export default ProtectedRoute;
