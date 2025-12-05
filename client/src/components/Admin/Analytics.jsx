import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  UserGroupIcon,
  ArchiveBoxIcon,
} from '@heroicons/react/24/outline';
import { API_ENDPOINTS } from '../../utils/constants';
import AdminSidebar from '../layout/AdminSidebar';

const Analytics = () => {
  const [analytics, setAnalytics] = useState({
    userGrowth: [],
    itemStats: { lost: 0, found: 0, resolved: 0 },
    activityByDay: [],
    totalItems: 0,
    resolutionRate: 0,
    activeUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('month');

  useEffect(() => {
    fetchAnalytics();
  }, [timeframe]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Fetch real data from multiple endpoints
      const [usersRes, lostItemsRes, foundItemsRes, claimsRes] = await Promise.all([
        fetch(API_ENDPOINTS.USERS),
        fetch(API_ENDPOINTS.LOST_ITEMS),
        fetch(API_ENDPOINTS.FOUND_ITEMS),
        fetch(API_ENDPOINTS.CLAIMS_ANALYTICS),
      ]);

      const usersData = await usersRes.json();
      const lostItemsData = await lostItemsRes.json();
      const foundItemsData = await foundItemsRes.json();
      const claimsData = await claimsRes.json();

      const users = usersData.data || [];
      const lostItems = lostItemsData.data || [];
      const foundItems = foundItemsData.data || [];
      const claimsAnalytics = claimsData.data || {};

      // Calculate user growth by month (last 6 months)
      const now = new Date();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const last6Months = [];
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        
        const usersInMonth = users.filter(user => {
          const createdAt = new Date(user.createdAt);
          return createdAt >= date && createdAt < nextMonth;
        }).length;
        
        last6Months.push({
          month: monthNames[date.getMonth()],
          users: usersInMonth,
        });
      }

      // Calculate activity by day of week
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const activityByDay = [0, 0, 0, 0, 0, 0, 0];
      
      [...lostItems, ...foundItems].forEach(item => {
        const day = new Date(item.createdAt).getDay();
        activityByDay[day]++;
      });

      const formattedActivityByDay = dayNames.map((day, index) => ({
        day: day,
        activity: activityByDay[index],
      }));

      // Calculate statistics
      const totalLost = lostItems.length;
      const totalFound = foundItems.length;
      const totalItems = totalLost + totalFound;
      const resolvedCount = claimsAnalytics.overview?.approvedClaims || 0;
      const resolutionRate = totalItems > 0 ? ((resolvedCount / totalItems) * 100) : 0;
      const activeUsers = users.filter(u => u.accountStatus === 'active' || !u.accountStatus).length;

      setAnalytics({
        userGrowth: last6Months,
        itemStats: {
          lost: totalLost,
          found: totalFound,
          resolved: resolvedCount,
        },
        activityByDay: formattedActivityByDay,
        totalItems,
        resolutionRate,
        activeUsers,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Set empty data on error
      setAnalytics({
        userGrowth: [],
        itemStats: { lost: 0, found: 0, resolved: 0 },
        activityByDay: [],
        totalItems: 0,
        resolutionRate: 0,
        activeUsers: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 ml-64 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics</h1>
              <p className="text-gray-600">System performance and insights</p>
            </div>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="year">Last Year</option>
            </select>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <ArchiveBoxIcon className="w-6 h-6 text-blue-600" />
                </div>
                <ArrowTrendingUpIcon className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Items</p>
              {loading ? (
                <div className="h-9 w-20 bg-gray-200 animate-pulse rounded mb-2"></div>
              ) : (
                <p className="text-3xl font-bold text-gray-900">{analytics.totalItems}</p>
              )}
              <p className="text-xs text-gray-500 mt-2">Lost & Found items</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <ChartBarIcon className="w-6 h-6 text-green-600" />
                </div>
                <ArrowTrendingUpIcon className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">Resolution Rate</p>
              {loading ? (
                <div className="h-9 w-20 bg-gray-200 animate-pulse rounded mb-2"></div>
              ) : (
                <p className="text-3xl font-bold text-gray-900">
                  {analytics.resolutionRate.toFixed(1)}%
                </p>
              )}
              <p className="text-xs text-gray-500 mt-2">Successfully resolved</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <UserGroupIcon className="w-6 h-6 text-orange-600" />
                </div>
                <ArrowTrendingUpIcon className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">Active Users</p>
              {loading ? (
                <div className="h-9 w-20 bg-gray-200 animate-pulse rounded mb-2"></div>
              ) : (
                <p className="text-3xl font-bold text-gray-900">{analytics.activeUsers}</p>
              )}
              <p className="text-xs text-gray-500 mt-2">Currently active</p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* User Growth Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">User Growth</h3>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-8 bg-gray-200 animate-pulse rounded"></div>
                  ))}
                </div>
              ) : analytics.userGrowth.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No user growth data available</p>
              ) : (
                <div className="space-y-4">
                  {analytics.userGrowth.map((item, index) => {
                    const maxUsers = Math.max(...analytics.userGrowth.map(g => g.users), 1);
                    return (
                      <div key={index}>
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="font-medium text-gray-700">{item.month}</span>
                          <span className="font-semibold text-gray-900">{item.users} users</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${(item.users / maxUsers) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Activity by Day */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Activity by Day</h3>
              {loading ? (
                <div className="flex items-end justify-between h-64 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <div key={i} className="flex-1 bg-gray-200 animate-pulse rounded-t-lg" style={{ height: `${Math.random() * 80 + 20}%` }}></div>
                  ))}
                </div>
              ) : analytics.activityByDay.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No activity data available</p>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-end justify-between h-56 gap-3">
                    {analytics.activityByDay.map((item, index) => {
                      const maxActivity = Math.max(...analytics.activityByDay.map(a => a.activity), 1);
                      const height = maxActivity > 0 ? (item.activity / maxActivity) * 100 : 0;
                      return (
                        <div key={index} className="flex-1 flex flex-col items-center gap-2">
                          <div 
                            className="w-full bg-gradient-to-t from-orange-500 to-orange-300 rounded-t-lg transition-all duration-500 hover:opacity-80 relative group cursor-pointer"
                            style={{ height: `${Math.max(height, 5)}%`, minHeight: '20px' }}
                          >
                            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">
                              {item.activity}
                            </span>
                          </div>
                          <span className="text-xs text-gray-600 font-medium">{item.day}</span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-500 text-center mt-4">Total items posted per day of the week</p>
                </div>
              )}
            </div>
          </div>

          {/* Item Statistics */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Item Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-blue-50 rounded-xl">
                <p className="text-sm font-medium text-gray-600 mb-2">Lost Items</p>
                <p className="text-4xl font-bold text-blue-600">{analytics.itemStats.lost}</p>
                <p className="text-xs text-gray-500 mt-2">Awaiting match</p>
              </div>
              <div className="text-center p-6 bg-green-50 rounded-xl">
                <p className="text-sm font-medium text-gray-600 mb-2">Found Items</p>
                <p className="text-4xl font-bold text-green-600">{analytics.itemStats.found}</p>
                <p className="text-xs text-gray-500 mt-2">Available for claim</p>
              </div>
              <div className="text-center p-6 bg-orange-50 rounded-xl">
                <p className="text-sm font-medium text-gray-600 mb-2">Resolved</p>
                <p className="text-4xl font-bold text-orange-600">{analytics.itemStats.resolved}</p>
                <p className="text-xs text-gray-500 mt-2">Successfully reunited</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
