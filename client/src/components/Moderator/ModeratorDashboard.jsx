import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ModSidebar from "../layout/ModSidebar";
import {
  PackageSearch,
  ClipboardList,
  Bell,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Users,
  ArrowRight,
  BarChart3,
  Settings,
  AlertCircle,
} from "lucide-react";
import { API_ENDPOINTS } from "../../utils/constants";

const ModeratorDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalClaims: 0,
    pendingClaims: 0,
    approvedClaims: 0,
    rejectedClaims: 0,
    activeLost: 0,
    activeFound: 0,
  });

  const [recentClaims, setRecentClaims] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    loadData();
    
    // Set up auto-refresh every 30 seconds for real-time updates
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // load moderator notifications and unread count
    const loadNotifications = async () => {
      const userId = user?._id || user?.id;
      if (!userId) return;
      try {
        const res = await fetch(`${API_ENDPOINTS.NOTIFICATIONS}?userId=${userId}`);
        const json = await res.json();
        if (Array.isArray(json.data)) setNotifications(json.data);
      } catch (e) {
        console.warn('Failed to load moderator notifications', e);
      }
    };

    const loadUnread = async () => {
      const userId = user?._id || user?.id;
      if (!userId) return;
      try {
        const res = await fetch(`${API_ENDPOINTS.NOTIFICATIONS_UNREAD_COUNT}?userId=${userId}`);
        const json = await res.json();
        if (json.data && typeof json.data.count === 'number') setUnreadCount(json.data.count);
      } catch (e) {
        console.warn('Failed to load unread count', e);
      }
    };

    loadNotifications();
    loadUnread();

    const iv = setInterval(() => { loadNotifications(); loadUnread(); }, 30000);
    return () => clearInterval(iv);
  }, [user]);

  const handleNotificationClick = async (notification) => {
    const userId = user?._id || user?.id;
    if (!notification) return;
    if (!notification.read) {
      try {
        await fetch(API_ENDPOINTS.NOTIFICATION_READ(notification._id), { method: 'PUT' });
        // refresh
        const res = await fetch(`${API_ENDPOINTS.NOTIFICATIONS}?userId=${userId}`);
        const json = await res.json();
        if (Array.isArray(json.data)) setNotifications(json.data);
        const countRes = await fetch(`${API_ENDPOINTS.NOTIFICATIONS_UNREAD_COUNT}?userId=${userId}`);
        const countJson = await countRes.json();
        if (countJson.data && typeof countJson.data.count === 'number') setUnreadCount(countJson.data.count);
      } catch (e) {
        console.warn('Failed to mark notification read', e);
      }
    }

    // navigate for claim related notifications
    if (notification.relatedClaimId) {
      navigate('/moderator/item-verification');
      return;
    }

    if (notification.relatedItemId) {
      navigate('/moderator/lost-items');
      return;
    }
  };

  const handleMarkAllRead = async () => {
    const userId = user?._id || user?.id;
    if (!userId) return;
    try {
      await fetch(API_ENDPOINTS.NOTIFICATIONS_READ_ALL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      // refresh
      const res = await fetch(`${API_ENDPOINTS.NOTIFICATIONS}?userId=${userId}`);
      const json = await res.json();
      if (Array.isArray(json.data)) setNotifications(json.data);
      const countRes = await fetch(`${API_ENDPOINTS.NOTIFICATIONS_UNREAD_COUNT}?userId=${userId}`);
      const countJson = await countRes.json();
      if (countJson.data && typeof countJson.data.count === 'number') setUnreadCount(countJson.data.count);
    } catch (e) {
      console.warn('Failed to mark all read', e);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      // Fetch all necessary data concurrently
      const [claimsRes, lostRes, foundRes] = await Promise.all([
        fetch(API_ENDPOINTS.CLAIMS),
        fetch(API_ENDPOINTS.LOST_ITEMS),
        fetch(API_ENDPOINTS.FOUND_ITEMS),
      ]);

      const claimsData = await claimsRes.json();
      const lostData = await lostRes.json();
      const foundData = await foundRes.json();

      const claims = claimsData.data || [];
      const lost = lostData.data || [];
      const found = foundData.data || [];

      // Calculate stats
      setStats({
        totalClaims: claims.length,
        pendingClaims: claims.filter(c => c.status === 'Pending').length,
        approvedClaims: claims.filter(c => c.status === 'Approved').length,
        rejectedClaims: claims.filter(c => c.status === 'Rejected').length,
        activeLost: lost.filter(item => (item.status || 'Active') === 'Active').length,
        activeFound: found.filter(item => (item.status || 'Active') === 'Active').length,
      });

      // Recent claims (latest 5)
      const sortedClaims = [...claims]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
      setRecentClaims(sortedClaims);

      // Generate recent activity from claims
      const activities = sortedClaims.map(claim => ({
        id: claim._id,
        type: claim.status === 'Pending' ? 'pending' : claim.status === 'Approved' ? 'approved' : 'rejected',
        message: `Claim for "${claim.itemId?.name || 'Unknown Item'}" ${claim.status === 'Pending' ? 'submitted' : claim.status.toLowerCase()}`,
        time: claim.updatedAt || claim.createdAt,
        claimantName: claim.claimantId?.name || 'Unknown User',
      }));
      setRecentActivity(activities);

    } catch (err) {
      setError("Failed to load dashboard data. Please try again.");
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: "Review Claims",
      description: `${stats.pendingClaims} pending reviews`,
      icon: <ClipboardList className="w-6 h-6" />,
      color: "yellow",
      link: "/moderator/item-verification",
    },
    {
      title: "View Reports",
      description: "Analytics & insights",
      icon: <BarChart3 className="w-6 h-6" />,
      color: "blue",
      link: "/moderator/reports-dashboard",
    },
  ];

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <ModSidebar />

      <div className="flex-1 ml-64">
        {/* Compact Header with Gradient */}
        <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600 text-white px-8 py-5">
          <div className="flex items-center justify-between">
            {/* Left: Title */}
            <div className="flex items-center gap-6">
              <div>
                <h1 className="text-2xl font-bold">Moderator Dashboard</h1>
                <p className="text-white/80 text-sm mt-0.5">Welcome back, {user?.name || 'Moderator'}</p>
              </div>
            </div>

            {/* Right: Notifications + Profile */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(prev => !prev)}
                  className="p-2.5 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-all relative"
                >
                  <Bell className="w-5 h-5 text-white" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-600 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-3 w-96 z-50 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="text-sm font-bold">Notifications</h3>
                      {unreadCount > 0 && (
                        <button onClick={handleMarkAllRead} className="text-xs text-orange-600 hover:text-orange-700">Mark all as read</button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="text-center p-6 text-gray-500">
                          <Bell className="mx-auto h-10 w-10 text-gray-300" />
                          <p className="mt-3">No notifications</p>
                        </div>
                      ) : (
                        <div className="space-y-2 p-3">
                          {notifications.map(n => (
                            <div
                              key={n._id}
                              onClick={() => { handleNotificationClick(n); setShowNotifications(false); }}
                              className={`p-2 rounded-lg cursor-pointer ${n.read ? 'bg-gray-50 hover:bg-gray-100' : 'bg-blue-50 hover:bg-blue-100 border-l-4 border-blue-500'}`}
                            >
                              <p className={`text-sm font-semibold ${n.read ? 'text-gray-700' : 'text-gray-900'}`}>{n.title}</p>
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">{n.message}</p>
                              <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="text-right">
                <p className="text-white text-sm font-semibold leading-tight">{user?.name || 'JOANNA NICOLE YROY'}</p>
                <p className="text-white/70 text-xs">Moderator</p>
              </div>
              <div className="w-11 h-11 bg-orange-600 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                <span className="text-white text-lg font-bold">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'J'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <main className="p-6">
          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading dashboard...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-900">Error</h3>
                  <p className="text-sm text-red-800 mt-1">{error}</p>
                  <button 
                    onClick={loadData}
                    className="mt-3 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
                  >
                    Retry
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Dashboard Content */}
          {!loading && !error && (
            <>
              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <StatCard
                  icon={<PackageSearch className="w-6 h-6" />}
                  title="Total Claims"
                  value={stats.totalClaims}
                  bgColor="bg-blue-100"
                  iconColor="text-blue-600"
                />
                <StatCard
                  icon={<Clock className="w-6 h-6" />}
                  title="Pending Reviews"
                  value={stats.pendingClaims}
                  badge={stats.pendingClaims > 0 ? "Action Required" : null}
                  bgColor="bg-yellow-100"
                  iconColor="text-yellow-600"
                />
                <StatCard
                  icon={<CheckCircle className="w-6 h-6" />}
                  title="Approved"
                  value={stats.approvedClaims}
                  bgColor="bg-green-100"
                  iconColor="text-green-600"
                />
                <StatCard
                  icon={<XCircle className="w-6 h-6" />}
                  title="Rejected"
                  value={stats.rejectedClaims}
                  bgColor="bg-red-100"
                  iconColor="text-red-600"
                />
              </div>

              {/* Quick Actions */}
              <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => navigate(action.link)}
                      className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-all text-left group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className={`p-3 rounded-lg bg-${action.color}-100`}>
                          <div className={`text-${action.color}-600`}>{action.icon}</div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-orange-600 transition-colors" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">{action.title}</h3>
                      <p className="text-sm text-gray-600">{action.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Claims */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900">Recent Claims</h2>
                    <button
                      onClick={() => navigate('/moderator/item-verification')}
                      className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
                    >
                      View All
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    {recentClaims.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <ClipboardList className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>No recent claims</p>
                      </div>
                    ) : (
                      recentClaims.map((claim) => (
                        <div
                          key={claim._id}
                          className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                        >
                          <div className={`p-2 rounded-lg shrink-0 ${
                            claim.status === 'Pending' ? 'bg-yellow-100' :
                            claim.status === 'Approved' ? 'bg-green-100' : 'bg-red-100'
                          }`}>
                            {claim.status === 'Pending' ? (
                              <Clock className="w-4 h-4 text-yellow-600" />
                            ) : claim.status === 'Approved' ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {claim.itemId?.name || 'Unknown Item'}
                            </p>
                            <p className="text-sm text-gray-600 truncate">
                              by {claim.claimantId?.name || 'Unknown'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(claim.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                            claim.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                            claim.status === 'Approved' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {claim.status}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
                    <TrendingUp className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="space-y-4">
                    {recentActivity.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <TrendingUp className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>No recent activity</p>
                      </div>
                    ) : (
                      recentActivity.map((activity) => (
                        <div key={activity.id} className="flex gap-3">
                          <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                            activity.type === 'pending' ? 'bg-yellow-500' :
                            activity.type === 'approved' ? 'bg-green-500' : 'bg-red-500'
                          }`}></div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-900">{activity.message}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(activity.time).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Alert for Pending Claims */}
              {stats.pendingClaims > 0 && (
                <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-yellow-900">Action Required</h3>
                      <p className="text-sm text-yellow-800 mt-1">
                        You have <span className="font-bold">{stats.pendingClaims}</span> pending claim{stats.pendingClaims !== 1 ? 's' : ''} waiting for review.
                      </p>
                      <button
                        onClick={() => navigate('/moderator/item-verification')}
                        className="mt-3 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
                      >
                        Review Now
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

function StatCard({ icon, title, value, badge, bgColor, iconColor }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-3 rounded-lg ${bgColor}`}>
          <div className={iconColor}>{icon}</div>
        </div>
        {badge && (
          <span className="text-xs font-semibold px-2 py-1 bg-orange-100 text-orange-800 rounded-full">
            {badge}
          </span>
        )}
      </div>
      <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

export default ModeratorDashboard;