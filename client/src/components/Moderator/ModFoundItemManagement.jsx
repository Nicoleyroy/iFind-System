import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, Filter, Plus, Edit, Trash2, Eye, Calendar,
  MapPin, Package, CheckCircle, XCircle, Clock, AlertCircle,
  Image as ImageIcon, Save, X as CloseIcon, Download, Archive,
  RotateCcw, TrendingUp, Box, Layers, Bell, User
} from "lucide-react";
import ModSidebar from "../layout/ModSidebar";
import { API_ENDPOINTS } from "../../utils/constants";
import { confirm, success as swalSuccess, error as swalError } from '../../utils/swal';
import { uploadToCloudinary } from '../../utils/cloudinary';

const ModFoundItemManagement = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
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
  const [formContactEmail, setFormContactEmail] = useState("");
  const [formContactNumber, setFormContactNumber] = useState("");
  const [exporting, setExporting] = useState(false);
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Report Found Item modal state (moderator quick-report)
  const [showReportModal, setShowReportModal] = useState(false);
  const [r_itemName, setRItemName] = useState("");
  const [r_category, setRCategory] = useState("");
  const [r_location, setRLocation] = useState("");
  const [r_dateInfo, setRDateInfo] = useState("");
  const [r_contactInfo, setRContactInfo] = useState("");
  const [r_contactEmail, setRContactEmail] = useState("");
  const [r_contactNumber, setRContactNumber] = useState("");
  const [r_description, setRDescription] = useState("");
  const [r_imageFiles, setRImageFiles] = useState([]);
  const [r_previewIndex, setRPreviewIndex] = useState(0);
  const [r_uploading, setRUploading] = useState(false);
  const [r_error, setRError] = useState("");
  const [r_success, setRSuccess] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
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

    if (notification.relatedClaimId) {
      navigate('/moderator/item-verification');
      return;
    }

    if (notification.relatedItemId) {
      navigate('/moderator/FoundItem/Management');
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
      const res = await fetch(`${API_ENDPOINTS.NOTIFICATIONS}?userId=${userId}`);
      const json = await res.json();
      if (Array.isArray(json.data)) setNotifications(json.data);
      setUnreadCount(0);
    } catch (e) {
      console.warn('Failed to mark all notifications read', e);
    }
  };

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

    // Filter out deleted items
    filtered = filtered.filter(item => item.status !== "Deleted");

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
        item.name?.toLowerCase().includes(search)
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
    // parse existing contactInfo into email and phone if present
    const ci = item.contactInfo || "";
    if (ci.includes('|')) {
      const parts = ci.split('|').map(p => p.trim());
      setFormContactEmail(parts[0] || '');
      setFormContactNumber(parts[1] || '');
    } else {
      setFormContactEmail(ci || '');
      setFormContactNumber('');
    }
    setModalMode("edit");
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      swalError('Validation', 'Item Name is required');
      return;
    }

    if (formData.date) {
      const parsedDate = new Date(formData.date);
      if (isNaN(parsedDate.getTime())) {
        swalError('Validation', 'Invalid date format');
        return;
      }
    }

    try {
      const url = modalMode === "edit" && selectedItem
        ? API_ENDPOINTS.FOUND_ITEM_BY_ID(selectedItem._id)
        : API_ENDPOINTS.FOUND_ITEMS;
      
      const method = modalMode === "edit" ? "PUT" : "POST";
      
      const combinedContact = formContactNumber ? `${formContactEmail} | ${formContactNumber}` : formContactEmail || formData.contactInfo || '';

      const payload = {
        ...formData,
        contactInfo: combinedContact,
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      if (data.data) {
        swalSuccess('Success', `Item ${modalMode === "edit" ? "updated" : "added"} successfully!`);
        setShowModal(false);
        fetchItems();
        resetForm();
      } else {
        swalError('Error', data.message || "Operation failed");
      }
    } catch (error) {
      console.error("Error:", error);
      if (modalMode === 'edit') {
        swalError('Error', 'Item could not be updated. Try again.');
      } else {
        swalError('Error', 'Unable to submit item. Check your connection.');
      }
    }
  };

  const handleDelete = async (id) => {
    const ok = await confirm('Delete item?', 'Are you sure you want to delete this item?');
    if (!ok) return;

    try {
      const response = await fetch(`${API_ENDPOINTS.FOUND_ITEM_BY_ID(id)}/delete`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moderatorId: user._id || user.id }),
      });

      const data = await response.json();
      
      if (data.data) {
        swalSuccess('Deleted', 'Item deleted successfully!');
        fetchItems();
        try { window.dispatchEvent(new CustomEvent('activity:updated', { detail: { type: 'item_deleted', id } })); } catch (e) {}
      } else {
        swalError('Error', data.message || "Delete failed");
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      swalError('Error', 'Item could not be deleted. Try again.');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const response = await fetch(API_ENDPOINTS.FOUND_ITEM_BY_ID(id), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, moderatorId: user._id || user.id }),
      });

      const data = await response.json();
      
      if (data.data) {
        swalSuccess('Success', `Item ${newStatus === 'Archived' ? 'archived' : 'restored'} successfully!`);
        fetchItems();
        try { window.dispatchEvent(new CustomEvent('activity:updated', { detail: { type: 'item_status', id, status: newStatus } })); } catch (e) {}
      } else {
        swalError('Error', data.message || "Status update failed");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      swalError('Error', 'An error occurred while updating status');
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
    setFormContactEmail("");
    setFormContactNumber("");
    setSelectedItem(null);
  };

  // Report Found Item handlers (moderator quick-report)
  const handleRFileChange = (e) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    const hasInvalid = files.some(file => !allowedTypes.includes(file.type));
    if (hasInvalid) {
      setRError('Only JPG and PNG files are allowed.');
      setRImageFiles([]);
      setRPreviewIndex(0);
      return;
    }
    setRImageFiles(files);
    setRPreviewIndex(0);
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    setRError("");
    setRSuccess("");
    if (!r_itemName.trim()) {
      setRError('Item Name is required.');
      return;
    }
    if (!r_category) {
      setRError('Please select a category.');
      return;
    }
    if (!r_location.trim()) {
      setRError('Location is required.');
      return;
    }
    if (!r_dateInfo) {
      setRError('Date is required.');
      return;
    }
    // Get today's date in local timezone (YYYY-MM-DD)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    
    if (r_dateInfo > todayStr) {
      setRError('Date cannot be in the future.');
      return;
    }
    const emailPattern = /^\S+@\S+\.\S+$/;
    const phonePattern = /^[+]?\d[\d\s().-]{5,}$/;
    if (!r_contactEmail || !emailPattern.test(r_contactEmail)) {
      setRError('A valid email address is required.');
      return;
    }
    if (r_contactNumber && !phonePattern.test(r_contactNumber)) {
      setRError('If provided, phone number must be valid.');
      return;
    }
    if (!r_description.trim()) {
      setRError('Description is required.');
      return;
    }
    if (!r_imageFiles || r_imageFiles.length === 0) {
      setRError('At least one photo is required.');
      return;
    }
    let imageUrl = '';
    let images = [];
    setRUploading(true);
    try {
      if (r_imageFiles && r_imageFiles.length > 0) {
        const uploadPromises = r_imageFiles.map(file => uploadToCloudinary(file));
        images = await Promise.all(uploadPromises);
        imageUrl = images[0] || '';
      }

      // current user id
      let userId = null;
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          userId = user._id || user.id;
        } catch (err) {
          console.warn('Failed to parse user from localStorage', err);
        }
      }

      const combinedContact = r_contactNumber ? `${r_contactEmail} | ${r_contactNumber}` : r_contactEmail;

      const payload = {
        name: r_itemName,
        category: r_category,
        location: r_location,
        date: r_dateInfo,
        contactInfo: combinedContact,
        description: r_description,
        imageUrl,
        images,
        userId,
      };

      const res = await fetch(API_ENDPOINTS.FOUND_ITEMS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json && json.message ? json.message : 'Failed to submit');

      setRSuccess('Found item reported successfully');
      setRContactEmail('');
      setRContactNumber('');
      setShowReportModal(false);
      // optionally refresh the list
      fetchItems();
    } catch (err) {
      setRError(err?.message || 'Unable to submit item. Check your connection.');
    } finally {
      setRUploading(false);
    }
  };

  const handleExportPdf = async () => {
    try {
      setExporting(true);
      // Export only the filtered items (respects category, search, sort)
      const itemIds = filteredItems.map(item => item._id);
      const res = await fetch(`${API_ENDPOINTS.FOUND_ITEMS}/export-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: itemIds.length > 0 ? itemIds : undefined }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to export PDF');
      }
      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition') || res.headers.get('content-disposition');
      let filename = 'Found-Items-Report.pdf';
      if (disposition && disposition.includes('filename=')) {
        const match = disposition.match(/filename="?([^";]+)"?/i);
        if (match && match[1]) filename = match[1];
      }
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      swalSuccess('Exported', `PDF downloaded successfully with ${itemIds.length} item(s).`);
    } catch (err) {
      console.error('Export PDF error:', err);
      swalError('Export failed', err.message || 'Unable to export PDF');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <ModSidebar />

      <main className="flex-1 md:ml-64 overflow-y-auto">
        {/* Compact Header with Gradient */}
        <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600 text-white px-8 py-14">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <h1 className="text-3xl font-bold">Found Items Management</h1>
                <p className="text-white/85 text-base mt-1">Manage and track all found items in the system</p>
              </div>
            </div>

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

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-white text-sm font-semibold leading-tight">{user?.name || 'Moderator'}</p>
                  <p className="text-white/70 text-xs">Moderator</p>
                </div>
                <div className="w-11 h-11 bg-orange-600 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                  <span className="text-white text-lg font-bold">{(user?.name || 'M').charAt(0).toUpperCase()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Report Found Item Modal (moderator quick-report) */}
        {showReportModal && (
          <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 py-10">
            <div className="bg-white rounded-xl max-w-3xl w-full mx-4 p-6 shadow-2xl">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold">Report Found Item</h3>
                  <p className="text-sm text-slate-500">Quick report for moderators (Found items only)</p>
                </div>
                <button onClick={() => setShowReportModal(false)} className="text-slate-500 hover:text-slate-800 transition-all active:scale-95">Close</button>
              </div>

              {r_error && <div className="mb-3 p-3 bg-red-50 text-red-700 rounded">{r_error}</div>}
              {r_success && <div className="mb-3 p-3 bg-green-50 text-green-700 rounded">{r_success}</div>}

              <form onSubmit={handleReportSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-1">
                  <div className="aspect-[4/3] rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-3xl">
                    {r_imageFiles && r_imageFiles.length > 0 ? (
                      <img src={URL.createObjectURL(r_imageFiles[r_previewIndex])} alt="Photo" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <span>400 × 300</span>
                    )}
                  </div>
                  <label htmlFor="r-image-upload" className="mt-4 block">
                    <input id="r-image-upload" type="file" accept="image/*" onChange={handleRFileChange} className="hidden" multiple />
                    <div className="mt-4 w-full text-center bg-green-600 text-white hover:bg-green-700 shadow-sm hover:shadow-md transition-all active:scale-95 rounded-md py-2 cursor-pointer">Upload Photo <span className="text-orange-500">*</span></div>
                  </label>
                  <p className="text-xs text-orange-500 mt-1">* Photo required</p>
                  {r_imageFiles && r_imageFiles.length > 1 && (
                    <div className="mt-3 flex gap-2 overflow-x-auto">
                      {r_imageFiles.map((f, idx) => (
                        <button key={idx} type="button" onClick={() => setRPreviewIndex(idx)} className={`w-16 h-12 rounded-md overflow-hidden border ${idx === r_previewIndex ? 'border-green-500' : 'border-gray-100'}`}>
                          <img src={URL.createObjectURL(f)} alt={`thumb-${idx}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="lg:col-span-2">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-[#626C71] mb-1">Item Name <span className="text-orange-500">*</span></label>
                      <input type="text" placeholder="Name of the item..." value={r_itemName} onChange={(e) => setRItemName(e.target.value)} className="w-full rounded-md border bg-white px-3 py-2 text-sm focus:outline-none" />
                    </div>

                    <div>
                      <label className="block text-xs text-[#626C71] mb-1">Category <span className="text-orange-500">*</span></label>
                      <select value={r_category} onChange={(e) => setRCategory(e.target.value)} className="w-full rounded-md border bg-white px-3 py-2 text-sm focus:outline-none">
                        <option value="">Select a category...</option>
                        <option value="Electronics">Electronics</option>
                        <option value="Personal Items">Personal Items</option>
                        <option value="Bags & Wallets">Bags & Wallets</option>
                        <option value="Keys">Keys</option>
                        <option value="Clothing">Clothing</option>
                        <option value="Accessories">Accessories</option>
                        <option value="Books & Documents">Books & Documents</option>
                        <option value="Sports Equipment">Sports Equipment</option>
                        <option value="Jewelry">Jewelry</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-[#626C71] mb-1">Location <span className="text-orange-500">*</span></label>
                      <input type="text" placeholder="Found location..." value={r_location} onChange={(e) => setRLocation(e.target.value)} className="w-full rounded-md border bg-white px-3 py-2 text-sm focus:outline-none" />
                    </div>

                    <div>
                      <label className="block text-xs text-[#626C71] mb-1">Date found <span className="text-orange-500">*</span></label>
                      <input type="date" value={r_dateInfo} onChange={(e) => setRDateInfo(e.target.value)} className="w-full rounded-md border bg-white px-3 py-2 text-sm focus:outline-none" />
                    </div>

                    <div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-[#626C71] mb-1">Email <span className="text-orange-500">*</span></label>
                          <input type="email" placeholder="your.email@example.com" value={r_contactEmail} onChange={(e) => setRContactEmail(e.target.value)} className="w-full rounded-md border bg-white px-3 py-2 text-sm focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs text-[#626C71] mb-1">Phone <span className="text-slate-400">(optional)</span></label>
                          <input type="text" placeholder="+63 912 345 6789" value={r_contactNumber} onChange={(e) => setRContactNumber(e.target.value)} className="w-full rounded-md border bg-white px-3 py-2 text-sm focus:outline-none" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-[#626C71] mb-1">Item Description <span className="text-orange-500">*</span></label>
                      <textarea rows={4} placeholder="Describe the item..." value={r_description} onChange={(e) => setRDescription(e.target.value)} className="w-full rounded-md border bg-white px-3 py-2 text-sm focus:outline-none" />
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end gap-2">
                    <button type="button" onClick={() => setShowReportModal(false)} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium transition-all active:scale-95">Cancel</button>
                    <button type="submit" disabled={r_uploading} className={`px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 shadow-sm hover:shadow-md transition-all active:scale-95 ${r_uploading ? 'opacity-60 cursor-not-allowed' : ''}`}>{r_uploading ? 'Submitting...' : 'Submit Report'}</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="px-8 py-6">
          {/* Stats Cards - Modern Design */}
          <div className="mt-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Total Items Card */}
              <div 
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all border-2 border-gray-100 cursor-pointer"
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
                <button className="mt-3 w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold shadow-sm hover:shadow-md hover:bg-blue-700 transition-all active:scale-95">
                  {statusFilter === "all" ? "Showing All" : "View All"}
                </button>
              </div>
              
              {/* Active Items Card */}
              <div 
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all border-2 border-gray-100 cursor-pointer"
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
                <button className="mt-3 w-full px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm font-semibold shadow-sm hover:shadow-md hover:bg-cyan-700 transition-all active:scale-95">
                  {statusFilter === "active" ? "Clear Filter" : "Manage"}
                </button>
              </div>
              
              {/* Archived Items Card */}
              <div 
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all border-2 border-gray-100 cursor-pointer"
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
                <button className="mt-3 w-full px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold shadow-sm hover:shadow-md hover:bg-green-700 transition-all active:scale-95">
                  {statusFilter === "archived" ? "Clear Filter" : "Manage"}
                </button>
              </div>
            </div>
          </div>

                
          <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
            <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
              {/* Search and Filters */}
              <div className="flex flex-col md:flex-row gap-3 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="search"
                    placeholder="Search by name, location, or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition bg-white hover:border-slate-400 w-full"
                    aria-label="Search items"
                  />
                </div>

                <div className="flex gap-3">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 bg-white font-medium text-gray-700 transition-all hover:border-slate-400 hover:bg-slate-50"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="archived">Archived</option>
                  </select>

                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 bg-white font-medium text-gray-700 transition-all hover:border-slate-400 hover:bg-slate-50"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 bg-white font-medium text-gray-700 transition-all hover:border-slate-400 hover:bg-slate-50"
                  >
                    <option value="newest">Latest</option>
                    <option value="oldest">Oldest</option>
                    <option value="name">Name (A-Z)</option>
                  </select>
                </div>
              </div>

              {/* Actions on the same line as search */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportPdf}
                  disabled={exporting}
                  className={`px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-all font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-900 hover:shadow-md active:scale-95`}
                  title="Export PDF"
                >
                  <Download className="w-4 h-4" />
                  {exporting ? 'Exporting…' : 'Export'}
                </button>
                <button
                  onClick={() => setShowReportModal(true)}
                  className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-all font-medium flex items-center gap-2 hover:shadow-md active:scale-95"
                  title="Add New Item"
                >
                  <Plus className="w-4 h-4" />
                  Add New Item
                </button>
              </div>
            </div>

            {/* Results Count */}
            <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Box className="w-4 h-4" />
                <span className="font-medium">Showing <span className="text-orange-600 font-bold">{filteredItems.length}</span> of <span className="font-bold">{items.length}</span> items</span>
              </div>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="text-sm text-orange-600 hover:text-orange-700 font-medium px-3 py-1 rounded-lg hover:bg-orange-50 transition-all active:scale-95"
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
                <Clock className="w-16 h-16 text-orange-600 animate-spin mx-auto mb-4" />
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
                  className="bg-orange-600 text-white px-8 py-4 rounded-xl font-bold inline-flex items-center gap-2 hover:bg-orange-700 transition-all shadow-lg hover:shadow-xl active:scale-95"
                >
                  <Plus className="w-6 h-6" />
                  Add Your First Item
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Image</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Location</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredItems.map((item) => (
                      <tr key={item._id} className="hover:bg-gray-50 transition-all hover:outline hover:outline-2 hover:outline-blue-400 hover:outline-offset-[-2px]">
                        <td className="px-6 py-4">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="w-16 h-16 rounded-lg object-cover" />
                          ) : (
                            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                              <ImageIcon className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-gray-900">{item.name}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-600 max-w-xs line-clamp-2">{item.description}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 font-medium">{item.category || "N/A"}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{item.location || "N/A"}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {item.date || item.createdAt ? (
                            <div className="flex flex-col">
                              <span className="font-medium">{new Date(item.date || item.createdAt).toLocaleDateString()}</span>
                              <span className="text-xs text-gray-500">{new Date(item.date || item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          ) : (
                            "N/A"
                          )}
                        </td>
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
                            <button
                              onClick={() => handleEdit(item)}
                              className="p-2 hover:bg-slate-100 rounded-lg transition-all active:scale-95"
                              title="Edit"
                            >
                              <Edit className="w-5 h-5 text-slate-700" />
                            </button>
                            <button onClick={() => handleDelete(item._id)} className="p-2 hover:bg-red-200 rounded-lg transition-all active:scale-95" title="Delete">
                              <Trash2 className="w-5 h-5 text-red-600" />
                            </button>
                            <button
                              onClick={() => handleStatusChange(item._id, "Archived")}
                              disabled={item.status === "Archived"}
                              className={`p-2 rounded-lg transition-all ${item.status === 'Archived' ? 'opacity-50 cursor-not-allowed bg-gray-100' : 'hover:bg-yellow-200 active:scale-95'}`}
                              title="Archive"
                            >
                              <Archive className="w-5 h-5 text-yellow-600" />
                            </button>
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
      </main>

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
            <div className="sticky top-0 bg-gradient-to-r from-orange-600 to-orange-600 text-white px-8 py-6 flex items-center justify-between z-10">
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
                className="p-2.5 hover:bg-white/30 rounded-lg transition-all active:scale-95"
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Email <span className="text-orange-500">*</span></label>
                      <input
                        type="email"
                        value={formContactEmail}
                        onChange={(e) => setFormContactEmail(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                        placeholder="your.email@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Phone <span className="text-slate-400">(optional)</span></label>
                      <input
                        type="text"
                        value={formContactNumber}
                        onChange={(e) => setFormContactNumber(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                        placeholder="+63 912 345 6789"
                      />
                    </div>
                  </div>
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
                    className="flex-1 bg-orange-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-700 transition-all flex items-center justify-center gap-2 hover:shadow-md active:scale-95"
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
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-all active:scale-95"
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
