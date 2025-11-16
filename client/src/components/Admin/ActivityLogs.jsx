import React, { useState, useEffect } from 'react';
import {
  ClockIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
  ArchiveBoxIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { API_ENDPOINTS } from '../../utils/constants';
import AdminSidebar from '../layout/AdminSidebar';

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    claim_approved: 0,
    claim_rejected: 0,
    item_verified: 0,
    item_deleted: 0,
    user_banned: 0,
  });

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, []);

  useEffect(() => {
    filterLogs();
  }, [logs, filterType, searchTerm]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.AUDIT_LOGS);
      const data = await response.json();
      
      if (data.data && Array.isArray(data.data)) {
        // Transform backend audit logs to frontend format
        const transformedLogs = data.data.map(log => ({
          id: log._id,
          type: getLogType(log.action),
          user: log.moderatorId?.email || log.moderatorId?.name || 'System',
          userName: log.moderatorId?.name || 'Unknown',
          action: formatAction(log.action),
          details: log.details || getDefaultDetails(log),
          timestamp: log.createdAt,
          targetType: log.targetType,
          targetInfo: log.targetInfo,
          metadata: log.metadata,
        }));
        
        setLogs(transformedLogs);
      } else {
        setLogs([]);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.AUDIT_LOGS_STATS);
      const data = await response.json();
      
      if (data.data && data.data.byAction) {
        setStats(data.data.byAction);
      }
    } catch (error) {
      console.error('Error fetching audit stats:', error);
    }
  };

  const getLogType = (action) => {
    if (action.includes('claim')) return 'admin_action';
    if (action.includes('item')) return 'item_action';
    if (action.includes('user')) return 'admin_action';
    return 'system';
  };

  const formatAction = (action) => {
    const actionMap = {
      'claim_approved': 'Claim Approved',
      'claim_rejected': 'Claim Rejected',
      'item_verified': 'Item Verified',
      'item_deleted': 'Item Deleted',
      'user_banned': 'User Banned',
    };
    return actionMap[action] || action.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const getDefaultDetails = (log) => {
    const actionDetails = {
      'claim_approved': `Approved claim request`,
      'claim_rejected': `Rejected claim request`,
      'item_verified': `Verified ${log.targetType?.toLowerCase()}`,
      'item_deleted': `Deleted ${log.targetType?.toLowerCase()}`,
      'user_banned': `Banned user account`,
    };
    return actionDetails[log.action] || 'Action performed';
  };

  const filterLogs = () => {
    let filtered = [...logs];

    if (filterType !== 'all') {
      filtered = filtered.filter((log) => log.type === filterType);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (log) =>
          log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.details.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredLogs(filtered);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'user_action':
        return <UserCircleIcon className="w-5 h-5" />;
      case 'admin_action':
        return <ShieldCheckIcon className="w-5 h-5" />;
      case 'item_action':
        return <ArchiveBoxIcon className="w-5 h-5" />;
      case 'system':
        return <Cog6ToothIcon className="w-5 h-5" />;
      default:
        return <ClockIcon className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'user_action':
        return 'bg-blue-100 text-blue-700';
      case 'admin_action':
        return 'bg-purple-100 text-purple-700';
      case 'item_action':
        return 'bg-green-100 text-green-700';
      case 'system':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getTotalByType = (type) => {
    if (type === 'admin_action') {
      return (stats.claim_approved || 0) + (stats.claim_rejected || 0) + (stats.user_banned || 0);
    }
    if (type === 'item_action') {
      return (stats.item_verified || 0) + (stats.item_deleted || 0);
    }
    return 0;
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 ml-64 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Activity Logs</h1>
            <p className="text-gray-600">Monitor system activities and user actions</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <ShieldCheckIcon className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Claims Approved</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.claim_approved || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <ShieldCheckIcon className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Claims Rejected</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.claim_rejected || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ArchiveBoxIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Items Verified</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.item_verified || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <ClockIcon className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Actions</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {logs.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search logs by user or action..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="admin_action">Admin Actions</option>
                <option value="item_action">Item Actions</option>
                <option value="system">System Events</option>
              </select>
            </div>
            <p className="text-sm text-gray-600 mt-4">
              Showing {filteredLogs.length} of {logs.length} activity logs
            </p>
          </div>

          {/* Logs Timeline */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h3>
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-500 border-r-transparent"></div>
                  </div>
                ) : filteredLogs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No logs found</div>
                ) : (
                  filteredLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-4 p-4 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className={`p-3 rounded-lg ${getTypeColor(log.type)}`}>
                        {getTypeIcon(log.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-semibold text-gray-900">{log.action}</h4>
                          <span className="text-xs text-gray-500">{formatDate(log.timestamp)}</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{log.details}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <UserCircleIcon className="w-3.5 h-3.5" />
                            {log.userName || log.user}
                          </span>
                          {log.targetInfo && (
                            <>
                              <span>•</span>
                              <span>{log.targetInfo.name || log.targetInfo.email}</span>
                            </>
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
      </div>
    </div>
  );
};

export default ActivityLogs;
