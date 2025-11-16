import React, { useState, useEffect } from 'react';
import {
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserCircleIcon,
  ShieldExclamationIcon,
} from '@heroicons/react/24/outline';
import { API_ENDPOINTS } from '../../utils/constants';
import AdminSidebar from '../layout/AdminSidebar';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      // Fetch users to identify potential issues
      const usersRes = await fetch(API_ENDPOINTS.USERS);
      const usersData = await usersRes.json();
      const users = usersData.data || [];

      // Create reports based on user behavior
      const userReports = [];
      const now = new Date();
      
      users.forEach((user) => {
        const createdAt = new Date(user.createdAt);
        const hoursSinceCreation = (now - createdAt) / (1000 * 60 * 60);
        const daysSinceCreation = hoursSinceCreation / 24;

        // Priority 1: Check for newly registered users (less than 24 hours) - Monitor for suspicious activity
        if (hoursSinceCreation < 24 && user.accountStatus !== 'suspended') {
          userReports.push({
            id: `new-${user._id}`,
            type: 'New Registration',
            category: 'New User',
            reportedUser: user.name || user.email,
            userEmail: user.email,
            userId: user._id,
            status: 'pending',
            priority: 'high',
            date: user.createdAt,
            description: `New user registration requires review`,
            details: `Registered ${Math.floor(hoursSinceCreation)} hours ago. Monitor for suspicious activity or policy violations.`,
          });
        }
        // Priority 2: Check for suspended users - Already handled
        else if (user.accountStatus === 'suspended') {
          userReports.push({
            id: `suspended-${user._id}`,
            type: 'Account Issue',
            category: 'Suspended Account',
            reportedUser: user.name || user.email,
            userEmail: user.email,
            userId: user._id,
            status: 'resolved',
            priority: 'medium',
            date: user.updatedAt || user.createdAt,
            description: `User account is currently suspended`,
            details: `Account suspended for policy violations. Review before reactivation.`,
          });
        }
        // Priority 3: Check for users without phone number - Low priority data quality issue
        else if (!user.phoneNumber && daysSinceCreation > 7) {
          userReports.push({
            id: `incomplete-${user._id}`,
            type: 'Profile Issue',
            category: 'Incomplete Profile',
            reportedUser: user.name || user.email,
            userEmail: user.email,
            userId: user._id,
            status: 'pending',
            priority: 'low',
            date: user.createdAt,
            description: `User profile is incomplete`,
            details: `Missing phone number. Account is ${Math.floor(daysSinceCreation)} days old. Consider prompting user to complete profile.`,
          });
        }
      });

      // Sort reports: High priority first, then by date (newest first)
      userReports.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return new Date(b.date) - new Date(a.date);
      });

      setReports(userReports);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewUser = (userId) => {
    window.location.href = `/admin/users/all`;
  };

  const handleInvestigate = async (reportId) => {
    setReports(reports.map(r => 
      r.id === reportId ? { ...r, status: 'investigating' } : r
    ));
  };

  const handleResolve = async (reportId) => {
    if (!window.confirm('Mark this report as resolved? This indicates the issue has been reviewed and handled.')) return;
    
    setReports(reports.map(r => 
      r.id === reportId ? { ...r, status: 'resolved' } : r
    ));
  };

  const handleSuspendUser = async (userId) => {
    if (!window.confirm('Are you sure you want to suspend this user?')) return;
    
    try {
      const response = await fetch(API_ENDPOINTS.USER_BY_ID(userId), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountStatus: 'suspended' }),
      });

      if (response.ok) {
        alert('User suspended successfully');
        fetchReports(); // Refresh reports
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to suspend user');
      }
    } catch (error) {
      console.error('Error suspending user:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleActivateUser = async (userId) => {
    if (!window.confirm('Are you sure you want to activate this user?')) return;
    
    try {
      const response = await fetch(API_ENDPOINTS.USER_BY_ID(userId), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountStatus: 'active' }),
      });

      if (response.ok) {
        alert('User activated successfully');
        fetchReports(); // Refresh reports
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to activate user');
      }
    } catch (error) {
      console.error('Error activating user:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const filteredReports = filter === 'all' ? reports : reports.filter((r) => r.status === filter);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'investigating':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-orange-600';
      case 'low':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Suspended Account':
        return <ShieldExclamationIcon className="w-4 h-4" />;
      case 'Incomplete Profile':
        return <UserCircleIcon className="w-4 h-4" />;
      case 'New User':
        return <CheckCircleIcon className="w-4 h-4" />;
      default:
        return <DocumentTextIcon className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 ml-64 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">User Reports & Monitoring</h1>
            <p className="text-gray-600">Identify and manage potential account issues, suspicious activity, and data quality concerns</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DocumentTextIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Reports</p>
                  <p className="text-2xl font-bold text-gray-900">{reports.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <ClockIcon className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Review</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {reports.filter((r) => r.status === 'pending').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">High Priority</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {reports.filter((r) => r.priority === 'high').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <UserCircleIcon className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">New Users (24h)</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {reports.filter((r) => r.category === 'New User').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'all' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Reports
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'pending' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pending ({reports.filter((r) => r.status === 'pending').length})
              </button>
              <button
                onClick={() => setFilter('investigating')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'investigating' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Investigating ({reports.filter((r) => r.status === 'investigating').length})
              </button>
              <button
                onClick={() => setFilter('resolved')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'resolved' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Resolved ({reports.filter((r) => r.status === 'resolved').length})
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-4">
              Showing {filteredReports.length} of {reports.length} reports
            </p>
          </div>

          {/* Reports List */}
          <div className="space-y-4">
            {loading ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-500 border-r-transparent"></div>
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
                No reports found
              </div>
            ) : (
              filteredReports.map((report) => (
                <div key={report.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{report.reportedUser}</h3>
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(report.status)}`}>
                          {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                        </span>
                        <span className={`text-xs font-medium ${getPriorityColor(report.priority)}`}>
                          {report.priority.toUpperCase()} PRIORITY
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{report.description}</p>
                      <p className="text-xs text-gray-500 mb-3">{report.details}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          {getCategoryIcon(report.category)}
                          {report.category}
                        </span>
                        <span>Email: {report.userEmail}</span>
                        <span>•</span>
                        <span>{formatDate(report.date)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleViewUser(report.userId)}
                        className="px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-colors font-medium text-sm"
                      >
                        View User
                      </button>
                      {report.status === 'pending' && (
                        <button 
                          onClick={() => handleInvestigate(report.id)}
                          className="px-4 py-2 bg-orange-100 text-orange-700 hover:bg-orange-200 rounded-lg transition-colors font-medium text-sm"
                        >
                          Investigate
                        </button>
                      )}
                      {report.status === 'investigating' && (
                        <button 
                          onClick={() => handleResolve(report.id)}
                          className="px-4 py-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg transition-colors font-medium text-sm"
                        >
                          Resolve
                        </button>
                      )}
                      {report.category === 'Suspended Account' && (
                        <button 
                          onClick={() => handleActivateUser(report.userId)}
                          className="px-4 py-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg transition-colors font-medium text-sm"
                        >
                          Activate
                        </button>
                      )}
                      {report.category !== 'Suspended Account' && report.status !== 'resolved' && (
                        <button 
                          onClick={() => handleSuspendUser(report.userId)}
                          className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors font-medium text-sm"
                        >
                          Suspend
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
