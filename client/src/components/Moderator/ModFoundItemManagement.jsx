import React, { useState, useEffect } from "react";
import {
  Search, Filter, Plus, Edit, Trash2, Eye, Calendar,
  MapPin, Package, CheckCircle, XCircle, Clock, AlertCircle,
  Image as ImageIcon, Save, X as CloseIcon, Download, Archive,
  RotateCcw, TrendingUp, Box, Layers, Grid, List, Bell, User
} from "lucide-react";
import ModSidebar from "../layout/ModSidebar";
import { API_ENDPOINTS } from "../../utils/constants";

const ModFoundItemManagement = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // add, edit, view
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    location: "",
    date: "",
    contactInfo: "",
    category: "",
    imageUrl: "",
    status: "Active"
  });
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.FOUND_ITEMS);
      const data = await response.json();
      
      if (data.data) {
        setItems(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching found items:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredAndSortedItems = () => {
    let filtered = [...items];

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(item => {
        const itemStatus = item.status || "Active";
        return itemStatus.toLowerCase() === statusFilter.toLowerCase();
      });
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(item => 
        item.category?.toLowerCase() === categoryFilter.toLowerCase()
      );
    }

    // Search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.name?.toLowerCase().includes(search) ||
        item.description?.toLowerCase().includes(search) ||
        item.location?.toLowerCase().includes(search) ||
        item.category?.toLowerCase().includes(search)
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      switch(sortBy) {
        case "newest":
          return new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date);
        case "oldest":
          return new Date(a.createdAt || a.date) - new Date(b.createdAt || b.date);
        case "name":
          return (a.name || "").localeCompare(b.name || "");
        default:
          return 0;
      }
    });

    return filtered;
  };

  const filteredItems = getFilteredAndSortedItems();
  const categories = [...new Set(items.map(item => item.category).filter(Boolean))];

  const handleView = (item) => {
    setSelectedItem(item);
    setModalMode("view");
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setFormData({
      name: item.name || "",
      description: item.description || "",
      location: item.location || "",
      date: item.date ? new Date(item.date).toISOString().split('T')[0] : "",
      contactInfo: item.contactInfo || "",
      category: item.category || "",
      imageUrl: item.imageUrl || "",
      status: item.status || "Active"
    });
    setModalMode("edit");
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert("Item name is required");
      return;
    }

    try {
      const url = modalMode === "edit" && selectedItem
        ? API_ENDPOINTS.FOUND_ITEM_BY_ID(selectedItem._id)
        : API_ENDPOINTS.FOUND_ITEMS;
      
      const method = modalMode === "edit" ? "PUT" : "POST";
      
      const payload = {
        ...formData,
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      if (data.data) {
        alert(`Item ${modalMode === "edit" ? "updated" : "added"} successfully!`);
        setShowModal(false);
        fetchItems();
        resetForm();
      } else {
        alert(data.message || "Operation failed");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;

    try {
      const response = await fetch(`${API_ENDPOINTS.FOUND_ITEM_BY_ID(id)}/delete`, {
        method: "PATCH",
      });

      const data = await response.json();
      
      if (data.data) {
        alert("Item deleted successfully!");
        fetchItems();
      } else {
        alert(data.message || "Delete failed");
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      alert("An error occurred");
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const response = await fetch(API_ENDPOINTS.FOUND_ITEM_BY_ID(id), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      
      if (data.data) {
        alert(`Item ${newStatus === 'Archived' ? 'archived' : 'restored'} successfully!`);
        fetchItems();
      } else {
        alert(data.message || "Status update failed");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("An error occurred while updating status");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      location: "",
      date: "",
      contactInfo: "",
      category: "",
      imageUrl: "",
      status: "Active"
    });
    setSelectedItem(null);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <ModSidebar />
      
      <div className="flex-1 ml-64">
        {/* Modern Header with Gradient */}
        <div className="bg-gradient-to-r from-red-700 via-red-600 to-rose-600 text-white px-8 py-10">
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
                <div className="w-11 h-11 bg-red-600 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                  <span className="text-white text-lg font-bold">J</span>
                </div>
              </div>
            </div>
          </div>
     

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Found Items Management</h1>
              <p className="text-red-100 text-lg">Manage and track all found items in the system</p>
            </div>
            <button
              onClick={() => {
                setModalMode("add");
                resetForm();
                setShowModal(true);
              }}
              className="bg-white text-red-700 px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:bg-red-50 transition-all shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              Add New Item
            </button>
          </div>
        </div>

        <div className="px-8 py-6">
          {/* Stats Cards - Modern Design */}
          <div className="-mt-12 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Total Items Card */}
              <div 
                className={`bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all border-2 cursor-pointer ${
                  statusFilter === "all" ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-100"
                }`}
                onClick={() => setStatusFilter("all")}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-gray-500 text-sm font-medium mb-2">
                      Total Items {statusFilter === "all" && <span className="text-blue-600 font-bold">✓</span>}
                    </h3>
                    <p className="text-4xl font-bold text-gray-900">{items.length}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${statusFilter === "all" ? "bg-blue-500" : "bg-blue-50"}`}>
                    <Layers className={`w-8 h-8 ${statusFilter === "all" ? "text-white" : "text-blue-600"}`} />
                  </div>
                </div>
                <button className="mt-3 w-full px-4 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg text-sm font-semibold text-blue-600 transition-colors">
                  {statusFilter === "all" ? "Showing All" : "View All"}
                </button>
              </div>
              
              {/* Active Items Card */}
              <div 
                className={`bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all border-2 cursor-pointer ${
                  statusFilter === "active" ? "border-cyan-500 ring-2 ring-cyan-200" : "border-gray-100"
                }`}
                onClick={() => setStatusFilter(statusFilter === "active" ? "all" : "active")}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-gray-500 text-sm font-medium mb-2">
                      Active Items {statusFilter === "active" && <span className="text-cyan-600 font-bold">✓</span>}
                    </h3>
                    <p className="text-4xl font-bold text-gray-900">
                      {items.filter(item => (item.status || "Active") === "Active").length}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl ${statusFilter === "active" ? "bg-cyan-500" : "bg-cyan-50"}`}>
                    <CheckCircle className={`w-8 h-8 ${statusFilter === "active" ? "text-white" : "text-cyan-600"}`} />
                  </div>
                </div>
                <button className="mt-3 w-full px-4 py-2 bg-cyan-50 hover:bg-cyan-100 rounded-lg text-sm font-semibold text-cyan-600 transition-colors">
                  {statusFilter === "active" ? "Clear Filter" : "Manage"}
                </button>
              </div>
              
              {/* Archived Items Card */}
              <div 
                className={`bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all border-2 cursor-pointer ${
                  statusFilter === "archived" ? "border-green-500 ring-2 ring-green-200" : "border-gray-100"
                }`}
                onClick={() => setStatusFilter(statusFilter === "archived" ? "all" : "archived")}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-gray-500 text-sm font-medium mb-2">
                      Archived {statusFilter === "archived" && <span className="text-green-600 font-bold">✓</span>}
                    </h3>
                    <p className="text-4xl font-bold text-gray-900">
                      {items.filter(item => item.status === "Archived").length}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl ${statusFilter === "archived" ? "bg-green-500" : "bg-green-50"}`}>
                    <Archive className={`w-8 h-8 ${statusFilter === "archived" ? "text-white" : "text-green-600"}`} />
                  </div>
                </div>
                <button className="mt-3 w-full px-4 py-2 bg-green-50 hover:bg-green-100 rounded-lg text-sm font-semibold text-green-600 transition-colors">
                  {statusFilter === "archived" ? "Clear Filter" : "Manage"}
                </button>
              </div>
              
              {/* Deleted Items Card */}
              <div 
                className={`bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all border-2 cursor-pointer ${
                  statusFilter === "deleted" ? "border-red-500 ring-2 ring-red-200" : "border-gray-100"
                }`}
                onClick={() => setStatusFilter(statusFilter === "deleted" ? "all" : "deleted")}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-gray-500 text-sm font-medium mb-2">
                      Deleted {statusFilter === "deleted" && <span className="text-red-600 font-bold">✓</span>}
                    </h3>
                    <p className="text-4xl font-bold text-gray-900">
                      {items.filter(item => item.status === "Deleted").length}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl ${statusFilter === "deleted" ? "bg-red-500" : "bg-red-50"}`}>
                    <XCircle className={`w-8 h-8 ${statusFilter === "deleted" ? "text-white" : "text-red-600"}`} />
                  </div>
                </div>
                <button className="mt-3 w-full px-4 py-2 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-semibold text-red-600 transition-colors">
                  {statusFilter === "deleted" ? "Clear Filter" : "Review"}
                </button>
              </div>
            </div>
          </div>

                
          <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
            <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
              {/* Search and Filters */}
              <div className="flex flex-col md:flex-row gap-3 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by name, location, category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent w-full transition-all"
                  />
                </div>

                <div className="flex gap-3">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 bg-white font-medium text-gray-700"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="archived">Archived</option>
                    <option value="deleted">Deleted</option>
                  </select>

                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 bg-white font-medium text-gray-700"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 bg-white font-medium text-gray-700"
                  >
                    <option value="newest">Latest</option>
                    <option value="oldest">Oldest</option>
                    <option value="name">Name (A-Z)</option>
                  </select>
                </div>
              </div>

              {/* View Toggle */}
              <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    viewMode === "grid" 
                      ? "bg-white text-red-700 shadow-sm" 
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    viewMode === "list" 
                      ? "bg-white text-red-700 shadow-sm" 
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Results Count */}
            <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Box className="w-4 h-4" />
                <span className="font-medium">Showing <span className="text-red-700 font-bold">{filteredItems.length}</span> of <span className="font-bold">{items.length}</span> items</span>
              </div>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="text-sm text-red-700 hover:text-red-800 font-medium"
                >
                  Clear search
                </button>
              )}
            </div>
          </div>

          {/* Items Display */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Clock className="w-16 h-16 text-red-700 animate-spin mx-auto mb-4" />
                <p className="text-gray-600 text-lg font-medium">Loading items...</p>
              </div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-16 text-center">
              <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No items found</h3>
              <p className="text-gray-600 mb-8 text-lg">
                {searchTerm || statusFilter !== "all" || categoryFilter !== "all"
                  ? "Try adjusting your search or filters" 
                  : "Get started by adding your first found item"}
              </p>
              {!searchTerm && statusFilter === "all" && categoryFilter === "all" && (
                <button
                  onClick={() => {
                    setModalMode("add");
                    resetForm();
                    setShowModal(true);
                  }}
                  className="bg-red-700 text-white px-8 py-4 rounded-xl font-bold inline-flex items-center gap-2 hover:bg-red-800 transition-all shadow-lg hover:shadow-xl"
                >
                  <Plus className="w-6 h-6" />
                  Add Your First Item
                </button>
              )}
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {filteredItems.map((item) => (
                <div key={item._id} className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group border-2 border-gray-100 hover:border-red-300">
                  {/* Item Image with Gradient Overlay */}
                  <div className="relative overflow-hidden h-64">
                    {item.imageUrl ? (
                      <>
                        <img 
                          src={item.imageUrl} 
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 flex items-center justify-center">
                        <div className="text-center">
                          <ImageIcon className="w-20 h-20 text-red-300 mx-auto mb-2" />
                          <p className="text-sm text-red-400 font-medium">No Image</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    <div className="absolute top-4 right-4">
                      <span className={`px-4 py-2 rounded-full text-xs font-bold shadow-xl backdrop-blur-md ${
                        item.status === "Active" ? "bg-green-500/90 text-white ring-2 ring-green-300" :
                        item.status === "Archived" ? "bg-yellow-500/90 text-white ring-2 ring-yellow-300" :
                        "bg-red-500/90 text-white ring-2 ring-red-300"
                      }`}>
                        {item.status || "Active"}
                      </span>
                    </div>

                    {/* Quick Actions Overlay */}
                    <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleView(item)}
                          className="p-2.5 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all shadow-lg"
                          title="Quick View"
                        >
                          <Eye className="w-5 h-5 text-gray-700" />
                        </button>
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2.5 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all shadow-lg"
                          title="Quick Edit"
                        >
                          <Edit className="w-5 h-5 text-blue-600" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Item Content */}
                  <div className="p-6">
                    {/* Title with Category Badge */}
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-xl font-bold text-gray-900 line-clamp-2 flex-1 leading-tight">
                        {item.name}
                      </h3>
                    </div>

                    {item.category && (
                      <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold mb-3">
                        {item.category}
                      </span>
                    )}
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2 min-h-[40px] leading-relaxed">
                      {item.description || "No description provided"}
                    </p>

                    {/* Info Grid */}
                    <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-2.5">
                      {item.location && (
                        <div className="flex items-center gap-2.5 text-sm">
                          <div className="flex-shrink-0 p-2 bg-blue-100 rounded-lg">
                            <MapPin className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-gray-500 font-medium">Location</p>
                            <p className="text-gray-900 font-semibold">{item.location}</p>
                          </div>
                        </div>
                      )}
                      {item.date && (
                        <div className="flex items-center gap-2.5 text-sm">
                          <div className="flex-shrink-0 p-2 bg-orange-100 rounded-lg">
                            <Calendar className="w-4 h-4 text-orange-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-gray-500 font-medium">Date Found</p>
                            <p className="text-gray-900 font-semibold">{new Date(item.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => handleView(item)}
                          className="px-3 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-xs hover:bg-gray-200 hover:scale-105 transition-all flex items-center justify-center gap-1.5"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => handleEdit(item)}
                          className="px-3 py-2.5 bg-blue-500 text-white rounded-xl font-bold text-xs hover:bg-blue-600 hover:scale-105 transition-all flex items-center justify-center gap-1.5"
                        >
                          <Edit className="w-4 h-4" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="px-3 py-2.5 bg-red-500 text-white rounded-xl font-bold text-xs hover:bg-red-600 hover:scale-105 transition-all flex items-center justify-center gap-1.5"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Status Change Button */}
                      {item.status !== "Deleted" && (
                        <div>
                          {item.status === "Active" && (
                            <button
                              onClick={() => handleStatusChange(item._id, "Archived")}
                              className="w-full px-4 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl text-sm font-bold hover:from-yellow-600 hover:to-orange-600 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                            >
                              <Archive className="w-4 h-4" />
                              Archive Item
                            </button>
                          )}
                          {item.status === "Archived" && (
                            <button
                              onClick={() => handleStatusChange(item._id, "Active")}
                              className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl text-sm font-bold hover:from-green-600 hover:to-emerald-600 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                            >
                              <RotateCcw className="w-4 h-4" />
                              Restore Item
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Item</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Location</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredItems.map((item) => (
                      <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
                            ) : (
                              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                <ImageIcon className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-gray-900">{item.name}</p>
                              <p className="text-sm text-gray-500 line-clamp-1">{item.description}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 font-medium">{item.category || "N/A"}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{item.location || "N/A"}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{item.date ? new Date(item.date).toLocaleDateString() : "N/A"}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            item.status === "Active" ? "bg-green-100 text-green-800" :
                            item.status === "Archived" ? "bg-yellow-100 text-yellow-800" :
                            "bg-red-100 text-red-800"
                          }`}>
                            {item.status || "Active"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => handleView(item)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="View">
                              <Eye className="w-5 h-5 text-gray-600" />
                            </button>
                            <button onClick={() => handleEdit(item)} className="p-2 hover:bg-blue-100 rounded-lg transition-colors" title="Edit">
                              <Edit className="w-5 h-5 text-blue-600" />
                            </button>
                            <button onClick={() => handleDelete(item._id)} className="p-2 hover:bg-red-100 rounded-lg transition-colors" title="Delete">
                              <Trash2 className="w-5 h-5 text-red-600" />
                            </button>
                            {item.status === "Active" && (
                              <button onClick={() => handleStatusChange(item._id, "Archived")} className="p-2 hover:bg-yellow-100 rounded-lg transition-colors" title="Archive">
                                <Archive className="w-5 h-5 text-yellow-600" />
                              </button>
                            )}
                            {item.status === "Archived" && (
                              <button onClick={() => handleStatusChange(item._id, "Active")} className="p-2 hover:bg-green-100 rounded-lg transition-colors" title="Restore">
                                <RotateCcw className="w-5 h-5 text-green-600" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowModal(false);
              resetForm();
            }
          }}
        >
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-slideUp">
            <div className="sticky top-0 bg-gradient-to-r from-red-700 to-rose-600 text-white px-8 py-6 flex items-center justify-between z-10">
              <div>
                <h2 className="text-2xl font-bold">
                  {modalMode === "add" ? "Add New Item" : modalMode === "edit" ? "Edit Item" : "Item Details"}
                </h2>
                <p className="text-white/80 text-sm mt-1">
                  {modalMode === "add" ? "Fill in the details below" : modalMode === "edit" ? "Update item information" : "View complete item details"}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="p-2.5 hover:bg-white/20 rounded-lg transition-colors"
              >
                <CloseIcon className="w-6 h-6 text-white" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-88px)]">

            {modalMode === "view" ? (
              <div className="p-8">
                {selectedItem?.imageUrl && (
                  <img 
                    src={selectedItem.imageUrl} 
                    alt={selectedItem.name}
                    className="w-full h-64 object-cover rounded-xl mb-6"
                  />
                )}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Item Name</label>
                    <p className="text-lg font-bold text-gray-900 mt-1">{selectedItem?.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Description</label>
                    <p className="text-gray-700 mt-1">{selectedItem?.description || "N/A"}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Category</label>
                      <p className="text-gray-900 mt-1">{selectedItem?.category || "N/A"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Status</label>
                      <p className="text-gray-900 mt-1">{selectedItem?.status || "Active"}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Location</label>
                    <p className="text-gray-900 mt-1">{selectedItem?.location || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Date Found</label>
                    <p className="text-gray-900 mt-1">
                      {selectedItem?.date ? new Date(selectedItem.date).toLocaleDateString() : "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Contact Information</label>
                    <p className="text-gray-900 mt-1">{selectedItem?.contactInfo || "N/A"}</p>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Item Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="4"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                    >
                      <option value="Active">Active</option>
                      <option value="Archived">Archived</option>
                      <option value="Deleted">Deleted</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Date Found</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Information</label>
                  <input
                    type="text"
                    value={formData.contactInfo}
                    onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Image URL</label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                    placeholder="https://example.com/image.jpg"
                  />
                  {formData.imageUrl && (
                    <img 
                      src={formData.imageUrl} 
                      alt="Preview"
                      className="mt-3 w-full h-40 object-cover rounded-xl"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-red-700 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-800 transition-colors flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    {modalMode === "edit" ? "Update Item" : "Add Item"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModFoundItemManagement;
