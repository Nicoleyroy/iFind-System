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

        // Get recent activity (last 10 users)
        const recentUsers = users
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 10)
          .map(user => ({
            id: user._id || user.id,
            name: user.name || user.email,
            email: user.email,
            role: user.role || 'user',
            status: user.accountStatus || 'active',
            createdAt: user.createdAt,
            profilePicture: user.profilePicture,
          }));

        setRecentActivity(recentUsers);
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-teal-100 rounded-lg">
                <CheckCircleIcon className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Active Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {((stats.activeUsers / stats.totalUsers) * 100 || 0).toFixed(1)}%
                </p>
              </div>
            </div>
            <div className="pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">Percentage of active accounts</p>
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

        {/* Recent User Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent User Activity</h2>
            <p className="text-sm text-gray-600 mt-1">Latest user registrations</p>
          </div>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentActivity.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-sm text-gray-500">
                      No recent user activity
                    </td>
                  </tr>
                ) : (
                  recentActivity.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {user.profilePicture ? (
                            <img
                              src={user.profilePicture}
                              alt={user.name}
                              className="flex-shrink-0 h-10 w-10 rounded-full object-cover border-2 border-gray-200"
                            />
                          ) : (
                            <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-semibold text-sm border-2 border-gray-200">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${
                          user.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800'
                            : user.role === 'moderator'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full ${
                          user.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.status === 'active' ? (
                            <CheckCircleIcon className="w-3 h-3" />
                          ) : (
                            <XCircleIcon className="w-3 h-3" />
                          )}
                          {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
