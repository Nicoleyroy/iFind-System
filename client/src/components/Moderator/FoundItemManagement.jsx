import React, { useState, useEffect } from "react";
import axios from "axios";
import {  CheckCircle, Users, Box, FileText, Table, List } from "lucide-react";
import Sidebar from "./ModSidebar";
import {

  Bell,

} from "lucide-react";

const STATUS_OPTIONS = ["All", "Pending", "Verified", "Claimed"];

const MetricCard = ({ label, value, Icon }) => (
  <div className="flex-1 bg-white rounded-xl shadow p-6 flex items-center justify-between transition hover:shadow-lg">
    <div>
      <p className="text-gray-600 font-medium mb-1">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
    <span className="bg-rose-50 p-4 rounded-full">
      <Icon className="w-8 h-8 text-rose-600" />
    </span>
  </div>
);

const FoundItemManagement = () => {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingItem, setPendingItem] = useState(null);
  const [pendingStatus, setPendingStatus] = useState("");
  const [metrics, setMetrics] = useState({ users: 0, activeFound: 0, claimed: 0 });
  const [viewMode, setViewMode] = useState("column"); // or "line"

  useEffect(() => {
    setLoading(true);
    axios
      .get("http://localhost:4000/items?type=found")
      .then((res) => {
        setItems(res.data.data || []);
        setMetrics((prev) => ({
          ...prev,
          activeFound: res.data.data.filter(item => !item.status || item.status === "Verified").length,
          claimed: res.data.data.filter(item => item.status === "Claimed").length,
        }));
        setLoading(false);
      })
      .catch(() => setLoading(false));
    axios
      .get("http://localhost:4000/users")
      .then(res => setMetrics(prev => ({ ...prev, users: (res.data.data || []).length })))
      .catch(console.error);
  }, []);

  useEffect(() => {
    let filtered = items;
    if (statusFilter !== "All") {
      filtered = filtered.filter(item =>
        (item.status || "Pending").toLowerCase() === statusFilter.toLowerCase()
      );
    }
    if (searchTerm.trim()) {
      const keyword = searchTerm.trim().toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(keyword)
      );
    }
    setFilteredItems(filtered);
  }, [items, searchTerm, statusFilter]);

  const openConfirmModal = (item, newStatus) => {
    setPendingItem(item);
    setPendingStatus(newStatus);
    setShowConfirm(true);
  };

  const cancelConfirm = () => {
    setShowConfirm(false);
    setPendingItem(null);
    setPendingStatus("");
  };

  const confirmUpdateStatus = () => {
    if (!pendingItem || !pendingStatus) return;
    axios
      .put(`http://localhost:4000/items/${pendingItem._id}/status`, { status: pendingStatus })
      .then(() => {
        setItems(prev =>
          prev.map(item =>
            item._id === pendingItem._id ? { ...item, status: pendingStatus } : item
          )
        );
      })
      .catch(console.error)
      .finally(() => cancelConfirm());
  };

  return (
    <div className="flex bg-gray-50 text-gray-900 min-h-screen font-inter">
      <Sidebar />


      <main className="flex-1 ml-64 p-8 overflow-y-auto max-h-screen">
      <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Found Items Management</h1>
          <div className="flex items-center gap-4">
            <Bell className="text-gray-600 w-6 h-6 cursor-pointer" />
            <div className="w-10 h-10 rounded-full bg-gray-300"></div>
          </div>
        </header>

        {/* Metrics row */}
        <div className="flex gap-7 mb-8">
          <MetricCard label="Total Users" value={metrics.users} Icon={Users} />
          <MetricCard label="Active Found Items" value={metrics.activeFound} Icon={Box} />
          <MetricCard label="Claimed Items" value={metrics.claimed} Icon={FileText} />
        </div>

        {/* Header, toggles, filters */}
        <section className="bg-white p-8 rounded-2xl shadow mb-10">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-extrabold">Manage Found Items</h2>
              <button
                onClick={() => setViewMode("column")}
                className={`ml-2 px-3 py-2 rounded-lg flex items-center gap-1 border transition ${
                  viewMode === "column"
                    ? "bg-rose-600 text-white border-rose-600"
                    : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-rose-50"
                }`}
              >
                <Table className="w-5 h-5" /> Column
              </button>
              <button
                onClick={() => setViewMode("line")}
                className={`px-3 py-2 rounded-lg flex items-center gap-1 border transition ${
                  viewMode === "line"
                    ? "bg-rose-600 text-white border-rose-600"
                    : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-rose-50"
                }`}
              >
                <List className="w-5 h-5" /> Line
              </button>
            </div>

            <div className="flex flex-col md:flex-row gap-3 md:gap-6 items-center w-full md:w-auto">
              <input
                type="search"
                placeholder="Search by item name..."
                className="w-full md:w-64 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-rose-600"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              <select
                className="w-full md:w-48 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-rose-600"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                {STATUS_OPTIONS.map(status => <option key={status} value={status}>{status}</option>)}
              </select>
            </div>
          </div>

          {/* Views toggle */}
          {viewMode === "column" ? (
            <div className="overflow-x-auto border border-gray-200 rounded-xl shadow bg-white">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Picture</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Name</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Category</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Location</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Date</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-700">Status</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 italic text-gray-400">Loading...</td>
                    </tr>
                  ) : filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 italic text-gray-400">No items found</td>
                    </tr>
                  ) : (
                    filteredItems.map(item => (
                      <tr key={item._id} className="hover:bg-gray-50 cursor-pointer">
                        <td className="px-4 py-3">
                          {item.imageUrl ? (<img src={item.imageUrl} alt={item.name} className="w-20 h-14 object-cover rounded" />) : ("No Image")}
                        </td>
                        <td className="px-4 py-3 font-semibold">{item.name}</td>
                        <td className="px-4 py-3">{item.category || "N/A"}</td>
                        <td className="px-4 py-3">{item.location || "N/A"}</td>
                        <td className="px-4 py-3">{item.date ? new Date(item.date).toLocaleDateString() : "N/A"}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            item.status === "Claimed"
                              ? "bg-green-100 text-green-800 border border-green-300"
                              : item.status === "Verified"
                              ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                              : "bg-gray-200 text-gray-700 border border-gray-300"
                          }`}>
                            {item.status || "Pending"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center space-x-2">
                          <button
                            disabled={item.status === "Claimed"}
                            onClick={() => openConfirmModal(item, "Verified")}
                            className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1 rounded-lg text-xs font-semibold transition"
                          >
                            Verify
                          </button>
                          <button
                            disabled={item.status === "Claimed"}
                            onClick={() => openConfirmModal(item, "Claimed")}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-xs font-semibold transition"
                          >
                            Mark Claimed
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                <div className="text-center col-span-full py-12 italic text-gray-400">Loading...</div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center col-span-full py-12 italic text-gray-400">No items found</div>
              ) : filteredItems.map(item => (
                <div key={item._id} className="border border-gray-200 rounded-xl shadow-sm p-6 flex flex-col cursor-pointer hover:shadow" onClick={() => setSelectedItem(item)}>
                  {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="mb-4 rounded-xl h-40 w-full object-cover" />}
                  <h3 className="text-lg font-bold mb-2">{item.name}</h3>
                  <div className="space-y-1 text-gray-700 text-sm">
                    <div><b>Category:</b> {item.category || "N/A"}</div>
                    <div><b>Date:</b> {item.date ? new Date(item.date).toLocaleDateString() : "N/A"}</div>
                    <div><b>Location:</b> {item.location || "N/A"}</div>
                    <div><b>Description:</b> {item.description || "N/A"}</div>
                    <div><b>Contact Info:</b> {item.contactInfo || "N/A"}</div>
                    <div><b>Status:</b> <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      item.status === "Claimed"
                        ? "bg-green-100 text-green-800 border border-green-300"
                        : item.status === "Verified"
                        ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                        : "bg-gray-200 text-gray-700 border border-gray-300"
                    }`}>{item.status || "Pending"}</span></div>
                  </div>
                  <div className="mt-auto space-x-2 flex">
                    <button
                      disabled={item.status === "Claimed"}
                      onClick={(e) => { e.stopPropagation(); openConfirmModal(item, "Verified"); }}
                      className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1 rounded-lg text-xs font-semibold w-full"
                    >
                      Verify
                    </button>
                    <button
                      disabled={item.status === "Claimed"}
                      onClick={(e) => { e.stopPropagation(); openConfirmModal(item, "Claimed"); }}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-xs font-semibold w-full"
                    >
                      Mark Claimed
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Confirmation Modal */}
        {showConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl max-w-lg w-full p-8 shadow-2xl text-center">
              <CheckCircle className="mx-auto w-12 h-12 text-green-600 mb-3" />
              <h3 className="text-xl font-bold mb-4">Confirm Status Update</h3>
              <p className="mb-6 text-gray-700">
                Are you sure you want to mark this item as <span className="font-semibold">{pendingStatus}</span>? This action cannot be undone.
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={confirmUpdateStatus}
                  className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-2 rounded-lg font-bold transition"
                >
                  Yes, Confirm
                </button>
                <button onClick={cancelConfirm} className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg transition">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default FoundItemManagement;
