import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  FileText,
  Table,
  List,
  Trash2,
  Archive,
  AlertCircle,
  Search,
  Filter,
  X,
  RefreshCw,
  ChevronDown,
  Bell,
  User,
} from "lucide-react";
import ModSidebar from "../layout/ModSidebar";
import { API_ENDPOINTS } from "../../utils/constants";

const STATUS_OPTIONS = [
  { value: "Active", label: "Active", color: "bg-blue-100", textColor: "text-blue-800", borderColor: "border-blue-300" },
  { value: "Archived", label: "Archived", color: "bg-amber-100", textColor: "text-amber-800", borderColor: "border-amber-300" },
];

//notifications
const Toast = ({ message, type = "info", onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const typeConfig = {
    success: { bg: "bg-green-50", border: "border-green-200", text: "text-green-800", icon: "✓" },
    error: { bg: "bg-red-50", border: "border-red-200", text: "text-red-800", icon: "✕" },
    info: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-800", icon: "ℹ" },
    warning: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-800", icon: "⚠" },
  };

  const config = typeConfig[type];

  return (
    <div
      className={`${config.bg} border-l-4 ${config.border} p-4 rounded shadow-lg flex items-start gap-3 animate-slide-in`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <span className={`${config.text} font-bold text-lg`}>{config.icon}</span>
      <p className={`${config.text} font-medium flex-1`}>{message}</p>
      <button
        onClick={onClose}
        className={`${config.text} hover:opacity-70 transition`}
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

const MetricCard = ({ label, value, Icon, isPrimary = false }) => (
  <div
    className={`flex-1 rounded-2xl p-6 flex items-center justify-between transition-all duration-300 transform hover:shadow-xl hover:-translate-y-1 cursor-pointer border-2 ${
      isPrimary
        ? "bg-orange-50 border-orange-300 shadow-lg"
        : "bg-white border-gray-100 shadow-md hover:border-gray-300"
    }`}
    role="article"
    aria-label={`${label}: ${value}`}
  >
    <div>
      <p className={`font-semibold mb-2 text-sm tracking-wide ${isPrimary ? "text-orange-700" : "text-gray-600"}`}>
        {label}
      </p>
      <p
        className={`text-4xl font-black ${
          isPrimary ? "text-orange-900" : "text-gray-900"
        }`}
      >
        {value}
      </p>
    </div>
    <span
      className={`p-5 rounded-2xl transition-transform duration-300 ${
        isPrimary ? "bg-orange-200 group-hover:scale-110" : "bg-gray-100"
      }`}
    >
      <Icon
        className={`w-8 h-8 ${isPrimary ? "text-orange-700" : "text-gray-500"}`}
      />
    </span>
  </div>
);

const StatusBadge = ({ status }) => {
  const config = STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];

  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${config.color} ${config.textColor} ${config.borderColor}`}
      role="status"
      aria-label={`Status: ${status}`}
    >
      <span aria-hidden="true">{config.icon}</span>
      {status}
    </span>
  );
};

// loading 
const SkeletonLoader = ({ count = 5 }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <tr key={`skeleton-${i}`} className="animate-pulse">
        <td className="px-4 py-3">
          <div className="w-20 h-14 bg-gray-200 rounded-lg"></div>
        </td>
        <td className="px-4 py-3">
          <div className="h-4 bg-gray-200 rounded w-24"></div>
        </td>
        <td className="px-4 py-3">
          <div className="h-4 bg-gray-200 rounded w-32"></div>
        </td>
        <td className="px-4 py-3">
          <div className="h-4 bg-gray-200 rounded w-20"></div>
        </td>
        <td className="px-4 py-3">
          <div className="h-4 bg-gray-200 rounded w-16"></div>
        </td>
        <td className="px-4 py-3">
          <div className="flex gap-2">
            <div className="w-10 h-10 bg-gray-200 rounded"></div>
            <div className="w-10 h-10 bg-gray-200 rounded"></div>
          </div>
        </td>
      </tr>
    ))}
  </>
);

const EmptyState = ({ onClearFilters }) => (
  <div
    className="text-center py-16 px-6 flex flex-col items-center justify-center"
    role="status"
    aria-live="polite"
  >
    <Box className="w-16 h-16 text-gray-300 mb-4" />
    <h3 className="text-xl font-semibold text-gray-700 mb-2">No items found</h3>
    <p className="text-gray-500 mb-6 max-w-md">
      Try adjusting your search or filter criteria to find what you're looking for.
    </p>
    <button
      onClick={onClearFilters}
      className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium"
      aria-label="Clear all filters"
    >
      Clear Filters
    </button>
  </div>
);

const ConfirmationModal = ({
  isOpen,
  title,
  message,
  itemName,
  onConfirm,
  onCancel,
  isDestructive = false,
  isLoading = false,
  actionLabel = "Confirm",
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "unset";
      };
    }
  }, [isOpen]);

  const handleKeyDown = (e) => {
    if (e.key === "Escape") onCancel();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onCancel}
      onKeyDown={handleKeyDown}
      role="presentation"
    >
      <div
        className="bg-white rounded-xl max-w-lg w-full mx-4 p-8 shadow-2xl"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div
            className={`p-3 rounded-full ${
              isDestructive ? "bg-red-100" : "bg-blue-100"
            }`}
          >
            <AlertCircle
              className={`w-8 h-8 ${
                isDestructive ? "text-red-600" : "text-blue-600"
              }`}
            />
          </div>
        </div>

        {/* Content */}
        <h3 id="modal-title" className="text-xl font-bold text-center mb-2">
          {title}
        </h3>
        <p
          id="modal-description"
          className="text-gray-700 text-center mb-2"
        >
          {message}
        </p>
        {itemName && (
          <p className="text-center text-sm text-gray-600 mb-6">
            <strong>Item:</strong> {itemName}
          </p>
        )}


        {/* Buttons */}
        <div className="flex justify-center gap-4 flex-col-reverse sm:flex-row">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Cancel action"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-6 py-3 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
              isDestructive
                ? "bg-red-600 hover:bg-red-700"
                : "bg-orange-600 hover:bg-orange-700"
            }`}
            aria-label={actionLabel}
          >
            {isLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

const ActionButton = ({ icon: Icon, label, onClick, variant = "secondary", disabled = false }) => {
  const variantStyles = {
    secondary: "bg-gray-600 hover:bg-gray-700 text-white",
    danger: "bg-red-600 hover:bg-red-700 text-white",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`p-2 rounded-lg shadow transition min-h-10 min-w-10 flex items-center justify-center ${variantStyles[variant]} disabled:opacity-50 disabled:cursor-not-allowed`}
      aria-label={label}
      title={label}
    >
      <Icon className="w-5 h-5" />
    </button>
  );
};

// the main component - everything happens here
const ModLostItemManagement = () => {
  // all the state we need to manage the page
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [viewMode, setViewMode] = useState("column");
  const [metrics, setMetrics] = useState({
    activeLost: 0,
    archived: 0,
  });

  // stuff for the modals and toast notifications
  const [modal, setModal] = useState({
    isOpen: false,
    type: null,
    id: null,
    name: "",
    isLoading: false,
  });
  const [toast, setToast] = useState(null);

  // fetch items when component first loads
  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_ENDPOINTS.LOST_ITEMS);
      const fetchedItems = response.data.data || [];
      setItems(fetchedItems);
      updateMetrics(fetchedItems);
    } catch (error) {
      console.error("Failed to fetch items:", error);
      showToast(
        error.response?.status === 401
          ? "You are not authorized to view items"
          : "Failed to load items. Please try again.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // update the metric counts based on items

  const updateMetrics = (itemsList) => {
    const activeLost = itemsList.filter(
      (item) =>
        !item.status ||
        (item.status !== "Deleted" && item.status !== "Archived")
    ).length;

    const archived = itemsList.filter(
      (item) => item.status === "Archived"
    ).length;

    setMetrics({ activeLost: activeLost, archived });
  };

  // filter and search logic
  
  useEffect(() => {
    let filtered = items;

    // Apply status filter
    if (statusFilter !== "All") {
      filtered = filtered.filter(
        (item) =>
          (item.status || "Active").toLowerCase() === statusFilter.toLowerCase()
      );
    }
    
    // Always exclude deleted items
    filtered = filtered.filter((item) => item.status !== "Deleted");

    // Apply search filter
    if (searchTerm.trim()) {
      const keyword = searchTerm.trim().toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name?.toLowerCase().includes(keyword) ||
          item.location?.toLowerCase().includes(keyword) ||
          item.description?.toLowerCase().includes(keyword)
      );
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    setFilteredItems(filtered);
  }, [items, searchTerm, statusFilter]);

  // modal and confirmation handlers
  const openModal = (type, id, name) => {
    setModal({ isOpen: true, type, id, name, isLoading: false });
  };

  const closeModal = () => {
    setModal({
      isOpen: false,
      type: null,
      id: null,
      name: "",
      isLoading: false,
    });
  };

  // send archive request to API
  const handleArchive = async () => {
    if (!modal.id) return;

    setModal((prev) => ({ ...prev, isLoading: true }));

    try {
      await axios.put(API_ENDPOINTS.LOST_ITEM_BY_ID(modal.id), { status: "Archived" });
      
      setItems((prev) =>
        prev.map((item) =>
          item._id === modal.id
            ? { ...item, status: "Archived" }
            : item
        )
      );
      
      showToast("Item archived successfully", "success");
      closeModal();
    } catch (error) {
      console.error("Archive failed:", error);
      showToast(
        error.response?.data?.message || "Failed to archive item. Please try again.",
        "error"
      );
    } finally {
      setModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

  // delete an item from the system
  const handleDelete = async () => {
    if (!modal.id) return;

    setModal((prev) => ({ ...prev, isLoading: true }));

    try {
      await axios.delete(API_ENDPOINTS.LOST_ITEM_BY_ID(modal.id));
      
      setItems((prev) => prev.filter((item) => item._id !== modal.id));
      
      showToast("Item deleted successfully", "success");
      closeModal();
    } catch (error) {
      console.error("Delete failed:", error);
      showToast(
        error.response?.data?.message || "Failed to delete item. Please try again.",
        "error"
      );
    } finally {
      setModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

  // notification functions
  const showToast = (message, type = "info") => {
    setToast({ message, type });
  };


  // EXPORT HANDLER
  const handleExportPDF = async () => {
    if (filteredItems.length === 0) {
      showToast("No items to export", "warning");
      return;
    }

    try {
      const ids = filteredItems.map((i) => i._id);
      const response = await fetch(
        `${API_ENDPOINTS.LOST_ITEMS}/export-pdf`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids }),
        }
      );

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `lost-items-${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showToast("PDF exported successfully", "success");
    } catch (error) {
      console.error("Export error:", error);
      showToast("Failed to export PDF. Please try again.", "error");
    }
  };


  return (
    <div className="flex bg-gray-50 min-h-screen font-inter text-gray-900">
      <ModSidebar />

      <main className="flex-1 md:ml-64 overflow-y-auto">
        {/* Toast Notifications */}
        {toast && (
          <div className="fixed top-6 right-6 z-40">
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => setToast(null)}
            />
          </div>
        )}
        {/* Modern Header with Gradient */}
        <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600 text-white px-8 py-10">
          <div className="flex items-center justify-between mb-6">
            {/* Notification Bell */}
            <div className="relative">
              <button className="p-3 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-all">
                <Bell className="w-6 h-6 text-white" />
              </button>
          
            </div>

            {/* Right: Profile & Export Button */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-white text-sm font-semibold leading-tight">JOANNA NICOLE YROY</p>
                  <p className="text-white/70 text-xs">Moderator</p>
                </div>
                <div className="w-11 h-11 bg-orange-600 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                  <span className="text-white text-lg font-bold">J</span>
                </div>
              </div>
            </div>
          </div>
     

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Lost Items Management</h1>
              <p className="text-orange-100 text-lg">Manage and track all lost items in the system</p>
            </div>
          </div>
        </div>

        {/* Metrics Section */}
        <section className="px-8 py-6">
          <div className="-mt-12 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all border border-gray-100">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-gray-500 text-sm font-medium mb-2">Active Items</h3>
                    <p className="text-4xl font-bold text-gray-900">{metrics.activeLost}</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-xl">
                    <Box className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
                <button className="mt-3 w-full px-4 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg text-sm font-semibold text-blue-600 transition-colors">
                  Detail
                </button>
              </div>
              
              <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all border border-gray-100">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-gray-500 text-sm font-medium mb-2">Archived</h3>
                    <p className="text-4xl font-bold text-gray-900">{metrics.archived}</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-xl">
                    <Archive className="w-8 h-8 text-green-600" />
                  </div>
                </div>
                <button className="mt-3 w-full px-4 py-2 bg-green-50 hover:bg-green-100 rounded-lg text-sm font-semibold text-green-600 transition-colors">
                  Manage
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Controls Section */}
        <section className="bg-white px-8 py-6 border-b border-gray-200">
          {/* Header with View Toggle */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6">
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-1">Items</p>
              <p className="text-slate-700">
                Showing <span className="font-bold text-slate-900">{filteredItems.length}</span> 
                <span className="text-slate-600"> item{filteredItems.length !== 1 ? 's' : ''}</span>
              </p>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col lg:flex-row gap-4 mt-6 pt-6 border-t border-gray-200">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
              <input
                type="search"
                placeholder="Search by name, location, or description..."
                className="w-full pl-12 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition bg-white hover:border-slate-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search items"
              />
            </div>

            {/* Status Filter */}
            <div className="relative min-w-max">
              <Filter className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 pointer-events-none" />
              <select
                className="pl-12 pr-10 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition appearance-none cursor-pointer bg-white hover:border-slate-400 font-medium text-slate-900"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by status"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Archived">Archived</option>
              </select>
              <ChevronDown className="absolute right-3 top-3.5 w-5 h-5 text-slate-400 pointer-events-none" />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={fetchItems}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition font-medium flex items-center gap-2 border border-slate-300"
                aria-label="Refresh items"
                title="Refresh items"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>

              <button
                onClick={handleExportPDF}
                disabled={filteredItems.length === 0}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-900"
                aria-label="Export filtered items as PDF"
                title="Export filtered items as PDF"
              >
                <FileText className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>

          {/* Table View */}
          <div className="overflow-x-auto border border-slate-300 rounded-lg shadow-sm bg-white mt-6">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50 border-b border-slate-300">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Image</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Date Missing</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Date Posted</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  <SkeletonLoader count={5} />
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan="7">
                      <EmptyState
                        onClearFilters={() => {
                          setSearchTerm("");
                          setStatusFilter("All");
                        }}
                      />
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr
                      key={item._id}
                      className="hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-b-0"
                      role="row"
                    >
                      <td className="px-6 py-4">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            loading="lazy"
                            className="rounded-lg w-24 h-16 object-cover border border-slate-200 shadow-sm"
                          />
                        ) : (
                          <div className="w-24 h-16 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-xs font-medium">
                            No image
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900">{item.name}</td>
                      <td className="px-6 py-4 text-slate-600">{item.location || "—"}</td>
                      <td className="px-6 py-4 text-slate-600 text-sm">
                        {item.date ? (
                          <div className="flex flex-col">
                            <span className="font-medium">{new Date(item.date).toLocaleDateString()}</span>
                            <span className="text-xs text-slate-500">{new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-sm">
                        {item.createdAt ? (
                          <div className="flex flex-col">
                            <span className="font-medium">{new Date(item.createdAt).toLocaleDateString()}</span>
                            <span className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <StatusBadge status={item.status || "Active"} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <ActionButton
                            icon={Archive}
                            label={`Archive "${item.name}"`}
                            onClick={(e) => {
                              e.stopPropagation();
                              openModal("archive", item._id, item.name);
                            }}
                            disabled={item.status === "Archived"}
                            variant="secondary"
                          />
                          <ActionButton
                            icon={Trash2}
                            label={`Delete "${item.name}"`}
                            onClick={(e) => {
                              e.stopPropagation();
                              openModal("delete", item._id, item.name);
                            }}
                            variant="danger"
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Confirmation Modals */}
        <ConfirmationModal
          isOpen={modal.isOpen && modal.type === "archive"}
        title="Archive Item"
        message="This item will be moved to the archive. You can restore it later."
        itemName={modal.name}
        onConfirm={handleArchive}
        onCancel={closeModal}
        isLoading={modal.isLoading}
        actionLabel="Archive"
      />

      <ConfirmationModal
        isOpen={modal.isOpen && modal.type === "delete"}
        title="Delete Item"
        message="This action cannot be undone. The item will be permanently deleted from the system."
        itemName={modal.name}
        onConfirm={handleDelete}
        onCancel={closeModal}
        isDestructive={true}
        isLoading={modal.isLoading}
        actionLabel="Delete"
      />
      </main>
    </div>
  );
};

export default ModLostItemManagement;
