import React from 'react';
import { useNavigate } from 'react-router-dom';

const Unauthorized = () => {
  const navigate = useNavigate();
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;

  const handleGoBack = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    const defaultRoute = user.role === 'admin' ? '/admin/dashboard'
      : user.role === 'moderator' ? '/moderator/dashboard'
      : '/dashboard';
    navigate(defaultRoute);
  };

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
        <h3 className="mt-4 text-lg font-medium text-gray-900">Access denied</h3>
        <p className="mt-2 text-sm text-gray-500">You do not have permission to access this page.</p>
        <button
          onClick={handleGoBack}
          className="mt-6 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
        >
          Go back
        </button>
      </div>
    </div>
  );
};

export default Unauthorized;
