import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "./ModSidebar";
import {
  PackageSearch,
  ClipboardList,
  Bell,
  PieChart,
} from "lucide-react";

const ModeratorDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [stats, setStats] = useState({
    activeLost: 0,
    activeFound: 0,
    resolvedItems: 0,
  });

  const [recentLost, setRecentLost] = useState([]);
  const [recentFound, setRecentFound] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      // Fetch lost and found items concurrently
      const [lostRes, foundRes] = await Promise.all([
        axios.get("http://localhost:4000/items?type=lost"),
        axios.get("http://localhost:4000/items?type=found"),
      ]);

      const lost = lostRes.data.data;
      const found = foundRes.data.data;

      // Calculate resolved items (assuming found = resolved)
      setStats({
        activeLost: lost.length,
        activeFound: found.length,
        resolvedItems: found.length,
      });

      // Recent lost and found (latest 4 each)
      const sortedLost = [...lost].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 4);
      const sortedFound = [...found].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 4);

      setRecentLost(sortedLost);
      setRecentFound(sortedFound);

    } catch (err) {
      setError("Failed to load data. Please try again.");
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex bg-gray-50 text-gray-900 min-h-screen">
      <Sidebar />

      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Moderator Dashboard</h1>
          <div className="flex items-center gap-4">
            <Bell className="text-gray-600 w-6 h-6 cursor-pointer" />
            <div className="w-10 h-10 rounded-full bg-gray-300"></div>
          </div>
        </header>

        {/* Stats Overview */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          <StatCard label="Active Lost Reports" value={stats.activeLost} icon={<PackageSearch />} color="red" />
          <StatCard label="Active Found Reports" value={stats.activeFound} icon={<ClipboardList />} color="green" />
          <StatCard label="Resolved Items" value={stats.resolvedItems} icon={<ClipboardList />} color="blue" />
        </section>

        {/* Loading / Error */}
        {loading && (
          <div className="animate-pulse p-6 rounded-xl shadow-md bg-white mb-10">
            <div className="h-40 bg-gray-200 rounded"></div>
          </div>
        )}
        {!loading && error && (
          <div className="p-6 rounded-xl shadow-md bg-red-100 text-red-700 mb-10">
            {error}
          </div>
        )}

        {/* System Overview */}
        {!loading && !error && (
          <section className="bg-white rounded-xl p-6 shadow-md mb-10">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold">System Overview</h2>
              <PieChart className="text-[#7a0c0c] w-5 h-5" />
            </div>
            <p className="text-gray-500 text-sm">
              Data synchronized with MongoDB. Real-time overview enabled.
            </p>
          </section>
        )}

        {/* Recent Lost & Found Activities */}
        {!loading && !error && (
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ActivityCard title="Recent Lost Items" items={recentLost} type="lost" />
            <ActivityCard title="Recent Found Items" items={recentFound} type="found" />
          </section>
        )}
      </main>
    </div>
  );
};

const StatCard = ({ label, value, icon, color }) => (
  <div className={`bg-white rounded-xl p-6 shadow-md flex items-center justify-between hover:shadow-lg transition border-l-4 border-${color}-600`}>
    <div>
      <h3 className="text-gray-600 text-sm">{label}</h3>
      <p className="text-2xl font-bold">{value}</p>
    </div>
    <div className={`bg-${color}-50 p-3 rounded-full text-${color}-600`}>
      {React.cloneElement(icon, { className: "w-6 h-6" })}
    </div>
  </div>
);

const ActivityCard = ({ title, items, type }) => (
  <div className="bg-white p-6 rounded-xl shadow-md">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      <a href={`/admin/reports?type=${type}`} className="text-sm text-[#7a0c0c] hover:underline">
        View All
      </a>
    </div>
    <ul className="divide-y divide-gray-200">
      {items.length === 0 && <li className="py-3 text-gray-400">No recent items.</li>}
      {items.map((item, i) => (
        <li key={i} className="py-3">
          <p className="font-medium">{item.name}</p>
          <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
            type === "lost" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
          }`}>
            {type === "lost" ? "Lost" : "Found"}
          </span>
          <p className="text-xs text-gray-400 mt-1">{new Date(item.createdAt).toLocaleString()}</p>
        </li>
      ))}
    </ul>
  </div>
);

export default ModeratorDashboard;
