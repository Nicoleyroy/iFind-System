import React, { useState, useEffect } from 'react';
import {
  UsersIcon,
  UserGroupIcon,
  ShieldExclamationIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { API_ENDPOINTS } from '../../utils/constants';
import AdminSidebar from '../layout/AdminSidebar';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    suspendedUsers: 0,
    newUsersToday: 0,
    newUsersThisWeek: 0,
    newUsersThisMonth: 0,
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [userGrowth, setUserGrowth] = useState({
    percentageChange: 0,
    isPositive: true,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch all users
      const response = await fetch(API_ENDPOINTS.USERS);
      const data = await response.json();
      
      if (data.data && Array.isArray(data.data)) {
        const users = data.data;
        
        // Calculate statistics
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

        // Count users
        const totalUsers = users.length;
        const activeUsers = users.filter(u => u.accountStatus === 'active' || !u.accountStatus).length;
        const suspendedUsers = users.filter(u => u.accountStatus === 'suspended').length;
        
        // Count new users
        const newUsersToday = users.filter(u => {
          const createdAt = new Date(u.createdAt);
          return createdAt >= todayStart;
        }).length;

        const newUsersThisWeek = users.filter(u => {
          const createdAt = new Date(u.createdAt);
          return createdAt >= weekStart;
        }).length;

        const newUsersThisMonth = users.filter(u => {
          const createdAt = new Date(u.createdAt);
          return createdAt >= monthStart;
        }).length;

        const newUsersLastMonth = users.filter(u => {
          const createdAt = new Date(u.createdAt);
          return createdAt >= lastMonthStart && createdAt <= lastMonthEnd;
        }).length;

        // Calculate growth percentage
        const growthPercentage = newUsersLastMonth > 0 
          ? ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100 
          : newUsersThisMonth > 0 ? 100 : 0;

        setStats({
          totalUsers,
          activeUsers,
          suspendedUsers,
          newUsersToday,
          newUsersThisWeek,
          newUsersThisMonth,
        });

        setUserGrowth({
          percentageChange: Math.abs(growthPercentage).toFixed(1),
          isPositive: growthPercentage >= 0,
        });

        // Get recent activity from audit logs / transactions (prefer server-side logs)
        try {
          const logsRes = await fetch(API_ENDPOINTS.AUDIT_LOGS);
          const logsJson = await logsRes.json();
          const logs = Array.isArray(logsJson.data) ? logsJson.data : [];

          const activities = logs
            .filter(log => {
              const role = (log.moderatorId?.role || log.role || log.actorRole || '').toLowerCase();
              return ['admin', 'moderator'].includes(role);
            })
            .sort((a, b) => new Date(b.createdAt || b.timestamp) - new Date(a.createdAt || a.timestamp))
            .slice(0, 10)
            .map(log => ({
              id: log._id || log.id,
              actor: log.moderatorId?.name || log.actor?.name || log.actorName || log.actorEmail || log.user || 'System',
              action: log.action || log.type || (log.event && String(log.event)),
              target: log.targetInfo?.name || log.targetName || log.target || log.resource || null,
              time: log.createdAt || log.timestamp || log.time || new Date().toISOString(),
              details: log.details || log.meta || null,
            }));

          setRecentActivity(activities);
        } catch (e) {
          // Fallback: show latest registered users if audit logs unavailable
          const recentUsers = users
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 10)
            .map(user => ({
              id: user._id || user.id,
              actor: user.name || user.email,
              action: 'registered',
              target: null,
              time: user.createdAt,
              details: null,
            }));

          setRecentActivity(recentUsers);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
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
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle, trend }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className={`text-3xl font-bold ${color} mb-2`}>
            {loading ? (
              <span className="inline-block w-16 h-8 bg-gray-200 animate-pulse rounded"></span>
            ) : (
              value.toLocaleString()
            )}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500">{subtitle}</p>
          )}
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-sm font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isPositive ? (
                <ArrowTrendingUpIcon className="w-4 h-4" />
              ) : (
                <ArrowTrendingDownIcon className="w-4 h-4" />
              )}
              <span>{trend.value}%</span>
              <span className="text-xs text-gray-500 ml-1">vs last month</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color.replace('text-', 'bg-').replace('-600', '-100')}`}>
          <Icon className={`w-8 h-8 ${color}`} />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <AdminSidebar />
        <div className="flex-1 ml-64 p-6">
          <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="h-8 w-64 bg-gray-200 animate-pulse rounded mb-2"></div>
            <div className="h-4 w-96 bg-gray-200 animate-pulse rounded"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="h-4 w-24 bg-gray-200 animate-pulse rounded mb-4"></div>
                <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
              </div>
            ))}
          </div>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 ml-64 p-6">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Overview of user accounts and activity</p>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon={UsersIcon}
            color="text-blue-600"
            subtitle="All registered accounts"
          />
          <StatCard
            title="Active Users"
            value={stats.activeUsers}
            icon={CheckCircleIcon}
            color="text-green-600"
            subtitle={`${((stats.activeUsers / stats.totalUsers) * 100 || 0).toFixed(1)}% of total`}
          />
          <StatCard
            title="Suspended Users"
            value={stats.suspendedUsers}
            icon={ShieldExclamationIcon}
            color="text-red-600"
            subtitle={`${((stats.suspendedUsers / stats.totalUsers) * 100 || 0).toFixed(1)}% of total`}
          />
          <StatCard
            title="New This Month"
            value={stats.newUsersThisMonth}
            icon={ArrowTrendingUpIcon}
            color="text-orange-600"
            trend={{
              value: userGrowth.percentageChange,
              isPositive: userGrowth.isPositive,
            }}
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ClockIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">New Today</p>
                <p className="text-2xl font-bold text-gray-900">{stats.newUsersToday}</p>
              </div>
            </div>
            <div className="pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">Accounts created in the last 24 hours</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <UserGroupIcon className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">New This Week</p>
                <p className="text-2xl font-bold text-gray-900">{stats.newUsersThisWeek}</p>
              </div>
            </div>
            <div className="pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">Accounts created in the last 7 days</p>
            </div>
          </div>
        </div>

        {/* User Status Distribution Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">User Status Distribution</h2>
          <div className="space-y-4">
            {/* Active Users Bar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">Active Users</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {stats.activeUsers} ({((stats.activeUsers / stats.totalUsers) * 100 || 0).toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-green-500 h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${(stats.activeUsers / stats.totalUsers) * 100 || 0}%` }}
                ></div>
              </div>
            </div>

            {/* Suspended Users Bar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">Suspended Users</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {stats.suspendedUsers} ({((stats.suspendedUsers / stats.totalUsers) * 100 || 0).toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-red-500 h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${(stats.suspendedUsers / stats.totalUsers) * 100 || 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity (transactions / audit logs) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            <p className="text-sm text-gray-600 mt-1">Latest transactions and system events</p>
          </div>
          <div className="p-6">
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {recentActivity.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No recent activity</p>
                </div>
              ) : (
                recentActivity.map((act) => (
                  <div key={act.id} className="flex items-start gap-4">
                    <div className="mt-1">
                      <div className={`w-2 h-2 rounded-full ${
                        (act.action || '').toLowerCase().includes('delete') ? 'bg-red-500' :
                        (act.action || '').toLowerCase().includes('approve') ? 'bg-green-500' :
                        'bg-blue-500'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">
                        <span className="font-semibold">{act.actor}</span>
                        {act.action ? ` ${act.action}` : ''}
                        {act.target ? ` • ${act.target}` : ''}
                      </p>
                      {act.details && <p className="text-xs text-gray-500 mt-1">{typeof act.details === 'string' ? act.details : JSON.stringify(act.details)}</p>}
                      <p className="text-xs text-gray-400 mt-1">{formatDate(act.time)}</p>
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

export default AdminDashboard;
