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
  const [selectedUser, setSelectedUser] = useState(null);
  const [userActivities, setUserActivities] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

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

        // Only show newly registered users (less than 24 hours) - Suspicious activity monitoring
        if (hoursSinceCreation < 24 && user.accountStatus !== 'suspended') {
          userReports.push({
            id: `new-${user._id}`,
            type: 'New Registration',
            category: 'Suspicious User',
            reportedUser: user.name || user.email,
            userEmail: user.email,
            userId: user._id,
            status: 'pending',
            priority: 'high',
            date: user.createdAt,
            description: `New user registration requires monitoring`,
            details: `Registered ${Math.floor(hoursSinceCreation)} hours ago. Monitor for suspicious activity or policy violations.`,
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

  const handleViewUser = async (userId) => {
    setActivitiesLoading(true);
    setShowUserModal(true);
    
    try {
      // Fetch user details
      const userRes = await fetch(API_ENDPOINTS.USER_BY_ID(userId));
      const userData = await userRes.json();
      const user = userData.data || userData;
      setSelectedUser(user);

      console.log('Fetching activities for user:', userId);

      // Fetch user's activities
      const activities = [];

      // Fetch lost items
      const lostItemsRes = await fetch(API_ENDPOINTS.LOST_ITEMS);
      const lostItemsData = await lostItemsRes.json();
      const allLostItems = lostItemsData.data || lostItemsData || [];
      console.log('All lost items:', allLostItems);
      
      // Try multiple possible field names for user ID
      const userLostItems = allLostItems.filter(item => 
        item.userId === userId || 
        item.userId?._id === userId ||
        item.user === userId ||
        item.user?._id === userId ||
        item.foundBy === userId ||
        item.foundBy?._id === userId
      );
      
      console.log('User lost items:', userLostItems);
      
      userLostItems.forEach(item => {
        activities.push({
          type: 'lost',
          action: 'Posted Lost Item',
          description: `Posted: ${item.itemName || item.name || 'Unknown Item'}`,
          date: new Date(item.createdAt || item.dateReported),
          status: item.status,
          icon: '🔍'
        });
      });

      // Fetch found items
      const foundItemsRes = await fetch(API_ENDPOINTS.FOUND_ITEMS);
      const foundItemsData = await foundItemsRes.json();
      const allFoundItems = foundItemsData.data || foundItemsData || [];
      console.log('All found items:', allFoundItems);
      
      const userFoundItems = allFoundItems.filter(item => 
        item.userId === userId || 
        item.userId?._id === userId ||
        item.user === userId ||
        item.user?._id === userId ||
        item.foundBy === userId ||
        item.foundBy?._id === userId
      );
      
      console.log('User found items:', userFoundItems);
      
      userFoundItems.forEach(item => {
        activities.push({
          type: 'found',
          action: 'Posted Found Item',
          description: `Found: ${item.itemName || item.name || 'Unknown Item'}`,
          date: new Date(item.createdAt || item.dateFound),
          status: item.status,
          icon: '✅'
        });
      });

      // Fetch claims
      const claimsRes = await fetch(API_ENDPOINTS.CLAIMS);
      const claimsData = await claimsRes.json();
      const allClaims = claimsData.data || claimsData || [];
      console.log('All claims:', allClaims);
      
      const userClaims = allClaims.filter(claim => 
        claim.claimantId === userId || 
        claim.claimantId?._id === userId ||
        claim.claimant === userId ||
        claim.claimant?._id === userId ||
        claim.userId === userId ||
        claim.userId?._id === userId
      );
      
      console.log('User claims:', userClaims);
      
      userClaims.forEach(claim => {
        activities.push({
          type: 'claim',
          action: 'Submitted Claim',
          description: `Claimed an item`,
          date: new Date(claim.createdAt || claim.claimDate),
          status: claim.status,
          icon: '📋'
        });
      });

      // Sort activities by date (most recent first)
      activities.sort((a, b) => b.date - a.date);
      
      console.log('Total activities found:', activities.length);
      console.log('Activities:', activities);
      
      setUserActivities(activities);
      
    } catch (error) {
      console.error('Error fetching user details:', error);
      alert('Failed to load user details');
    } finally {
      setActivitiesLoading(false);
    }
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
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading reports...</p>
                  </div>
                </div>
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

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">User Details</h2>
              <button
                onClick={() => {
                  setShowUserModal(false);
                  setSelectedUser(null);
                  setUserActivities([]);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* User Profile Section */}
              <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-6 mb-6">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    {selectedUser.profilePicture ? (
                      <img
                        src={selectedUser.profilePicture}
                        alt={selectedUser.name}
                        className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-orange-500 flex items-center justify-center border-4 border-white shadow-lg">
                        <span className="text-3xl font-bold text-white">
                          {selectedUser.name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedUser.name}</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Email:</span>
                        <p className="font-medium text-gray-900">{selectedUser.email}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Role:</span>
                        <p className="font-medium text-gray-900 capitalize">{selectedUser.role}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Status:</span>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          selectedUser.accountStatus === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {selectedUser.accountStatus}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Member Since:</span>
                        <p className="font-medium text-gray-900">
                          {new Date(selectedUser.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activities Section */}
              <div className="mb-6">
                <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <ClockIcon className="w-6 h-6 text-orange-500" />
                  Recent Activities
                </h4>
                
                {activitiesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-600 mx-auto"></div>
                      <p className="mt-3 text-gray-600">Loading activities...</p>
                    </div>
                  </div>
                ) : userActivities.length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <p className="text-gray-500">No recent activities found</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {userActivities.map((activity, index) => (
                      <div
                        key={index}
                        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0">
                            <span className="text-2xl">{activity.icon}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <h5 className="font-semibold text-gray-900 mb-1">{activity.action}</h5>
                                <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                  <span>{activity.date.toLocaleDateString()}</span>
                                  <span>•</span>
                                  <span>{activity.date.toLocaleTimeString()}</span>
                                  {activity.status && (
                                    <>
                                      <span>•</span>
                                      <span className={`px-2 py-0.5 rounded-full font-medium ${
                                        activity.status === 'found' || activity.status === 'approved' || activity.status === 'resolved'
                                          ? 'bg-green-100 text-green-800'
                                          : activity.status === 'pending'
                                          ? 'bg-yellow-100 text-yellow-800'
                                          : activity.status === 'rejected'
                                          ? 'bg-red-100 text-red-800'
                                          : 'bg-blue-100 text-blue-800'
                                      }`}>
                                        {activity.status}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                activity.type === 'lost'
                                  ? 'bg-red-100 text-red-800'
                                  : activity.type === 'found'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {activity.type}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowUserModal(false);
                    setSelectedUser(null);
                    setUserActivities([]);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                >
                  Close
                </button>
                {selectedUser.accountStatus === 'suspended' ? (
                  <button
                    onClick={() => {
                      handleActivateUser(selectedUser._id);
                      setShowUserModal(false);
                    }}
                    className="flex-1 px-4 py-2 bg-green-500 text-white hover:bg-green-600 rounded-lg transition-colors font-medium"
                  >
                    Activate User
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      handleSuspendUser(selectedUser._id);
                      setShowUserModal(false);
                    }}
                    className="flex-1 px-4 py-2 bg-red-500 text-white hover:bg-red-600 rounded-lg transition-colors font-medium"
                  >
                    Suspend User
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
