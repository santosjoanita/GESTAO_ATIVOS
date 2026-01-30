import React from 'react';
import { Navigate } from "react-router-dom";
import { hasPermission } from "../auth/acl.js";
import { useAuth } from "../auth/useAuth.js";

export default function ProtectedRoute({ children, auth, permission }) {
  const { user, isAuthenticated } = useAuth();

  if (!auth && !permission) {
    return children;
  }

  if (auth && !isAuthenticated) {
    return <Navigate to="/" replace />; 
  }

  if (permission && !hasPermission(user, permission)) {
    return <Navigate to="/sem-permissao" replace />;
  }

  return children;
}