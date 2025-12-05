import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const storedUser = localStorage.getItem('user');
  
  // Check if user is logged in
  if (!storedUser) {
    return <Navigate to="/login" replace />;
  }

  const user = JSON.parse(storedUser);

  // Check account status
  if (user.accountStatus === 'suspended' || user.accountStatus === 'banned') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Account {user.accountStatus}</h3>
          <p className="mt-2 text-sm text-gray-500">
            Your account has been {user.accountStatus}. Please contact support for more information.
          </p>
          <button
            onClick={() => {
              localStorage.removeItem('user');
              window.location.href = '/login';
            }}
            className="mt-6 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  // Check if user has required role
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-orange-100">
            <svg
              className="h-6 w-6 text-orange-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Access Denied</h3>
          <p className="mt-2 text-sm text-gray-500">
            You don't have permission to access this page. Required role: {allowedRoles.join(' or ')}.
          </p>
          <p className="mt-1 text-sm text-gray-500">Your role: {user.role}</p>
          <button
            onClick={() => {
              const defaultRoute = user.role === 'admin' ? '/admin/dashboard' 
                : user.role === 'moderator' ? '/moderator/dashboard' 
                : '/dashboard';
              window.location.href = defaultRoute;
            }}
            className="mt-6 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // User is authenticated and authorized
  return children;
};

export default ProtectedRoute;
