import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "./AdminSidebar";
import {
  Users,
  PackageSearch,
  ClipboardList,
  Bell,
  PieChart,
  Activity,
  FileText,
  Settings,
  LogOut,
} from "lucide-react";

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalUsers: 0,
    activeLost: 0,
    resolvedItems: 0,
  });

  const [recentUsers, setRecentUsers] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const usersRes = await axios.get("http://localhost:4000/users");
      const lostRes = await axios.get("http://localhost:4000/items?type=lost");
      const foundRes = await axios.get("http://localhost:4000/items?type=found");

      const users = usersRes.data.data;
      const lost = lostRes.data.data;
      const found = foundRes.data.data;

      // ✅ Set full stats
      setStats({
        totalUsers: users.length,
        activeLost: lost.length,
        resolvedItems: found.length,
      });

      // ✅ Recently registered users (latest 4)
      setRecentUsers(users.slice(0, 4));

      // ✅ Recent Activities (lost + found)
      const activities = [...lost, ...found]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 4);

      setRecentActivities(activities);

      setLoading(false);
    } catch (err) {
      console.error("Dashboard error:", err);
      setLoading(false);
    }
  };

  return (
    <div className="flex bg-gray-50 text-gray-800 min-h-screen">

    <Sidebar />
      {/* ✅ Main Content */}
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 tracking-tight">
            Admin Dashboard
          </h2>

          <div className="flex items-center gap-4">
            <Bell className="text-gray-600 w-6 h-6 cursor-pointer" />
            <div className="w-10 h-10 rounded-full bg-gray-300"></div>
          </div>
        </div>

        {/* ✅ Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          <StatCard label="Total Users" value={stats.totalUsers} icon={<Users />} />
          <StatCard label="Active Lost Reports" value={stats.activeLost} icon={<PackageSearch />} />
          <StatCard label="Resolved Items" value={stats.resolvedItems} icon={<ClipboardList />} />
        </div>

        {/* ✅ Loading Skeleton */}
        {loading && (
          <div className="animate-pulse bg-white p-6 rounded-xl shadow-md mb-10">
            <div className="h-40 bg-gray-200 rounded"></div>
          </div>
        )}

        {/* ✅ System Overview */}
        {!loading && (
          <div className="bg-white rounded-xl p-6 shadow-md mb-10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">System Overview</h3>
              <PieChart className="text-[#7a0c0c] w-5 h-5" />
            </div>
            <p className="text-gray-500 text-sm">
              Data synchronized with MongoDB. Real-time overview enabled.
            </p>
          </div>
        )}

        {/* ✅ Recent Users & Activities */}
        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <RecentUsersCard recentUsers={recentUsers} />

            <RecentActivityCard recentActivities={recentActivities} />
          </div>
        )}
      </main>
    </div>
  );
};

const StatCard = ({ label, value, icon }) => (
  <div className="bg-white rounded-xl p-6 shadow-md flex items-center justify-between hover:shadow-lg transition">
    <div>
      <h3 className="text-gray-600 text-sm">{label}</h3>
      <p className="text-2xl font-bold">{value}</p>
    </div>
    <div className="bg-red-50 p-3 rounded-full text-[#7a0c0c]">
      {React.cloneElement(icon, { className: "w-6 h-6" })}
    </div>
  </div>
);

const RecentUsersCard = ({ recentUsers }) => (
  <div className="bg-white p-6 rounded-xl shadow-md">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-semibold">Recently Registered Users</h3>
      <a href="/admin/users" className="text-sm text-[#7a0c0c] hover:underline">
        View All
      </a>
    </div>
    <ul className="divide-y divide-gray-200">
      {recentUsers.map((user, i) => (
        <li key={i} className="py-3">
          <p className="font-medium">{user.name}</p>
          <p className="text-sm text-gray-500">{user.email}</p>
        </li>
      ))}
    </ul>
  </div>
);

const RecentActivityCard = ({ recentActivities }) => (
  <div className="bg-white p-6 rounded-xl shadow-md">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-semibold">Recent Activity</h3>
      <a href="/admin/reports" className="text-sm text-[#7a0c0c] hover:underline">
        View Reports
      </a>
    </div>
    <ul className="divide-y divide-gray-200">
      {recentActivities.map((item, i) => (
        <li key={i} className="py-3">
          <p className="font-medium">{item.name}</p>
          <p className="text-sm text-gray-500">
            {item.type === "lost" ? "Reported Lost" : "Marked as Found"}
          </p>
          <p className="text-xs text-gray-400">
            {new Date(item.createdAt).toLocaleString()}
          </p>
        </li>
      ))}
    </ul>
  </div>
);

export default AdminDashboard;
