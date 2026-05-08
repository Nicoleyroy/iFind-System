import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Filter, Eye, Check, X, Clock, AlertCircle, 
  User, Package, Calendar, MapPin, FileText, Image as ImageIcon,
  ChevronDown, ChevronUp, CheckCircle, XCircle, Bell, UserCircle
} from 'lucide-react';
import { API_ENDPOINTS } from '../../utils/constants';
import { confirm, success as swalSuccess, error as swalError } from '../../utils/swal';
import ModSidebar from '../layout/ModSidebar';

export default function ClaimTicketVerification() {
  const navigate = useNavigate();
  const [claims, setClaims] = useState([]);
  const [filteredClaims, setFilteredClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [actionType, setActionType] = useState('');
  const [processing, setProcessing] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  // Filters
  const [activeTab, setActiveTab] = useState('Pending'); // Pending, Approved, Rejected
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedClaim, setExpandedClaim] = useState(null);
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, item-name
  const [viewingClaim, setViewingClaim] = useState(null); // For full-screen view
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Stats
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0
  });
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    fetchClaims();
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
      navigate('/moderator/LostItem/Management');
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

  useEffect(() => {
    filterClaims();
  }, [claims, activeTab, searchTerm, sortBy]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm]);

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.CLAIMS);
      const data = await response.json();
      
      if (data.data) {
        setClaims(data.data);
        calculateStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching claims:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (claimsData) => {
    const pending = claimsData.filter(c => c.status === 'Pending').length;
    const approved = claimsData.filter(c => c.status === 'Approved').length;
    const rejected = claimsData.filter(c => c.status === 'Rejected').length;
    
    setStats({
      pending,
      approved,
      rejected,
      total: claimsData.length
    });
  };

  const filterClaims = () => {
    let filtered = [...claims];
    
    // Filter by active tab
    filtered = filtered.filter(claim => claim.status === activeTab);
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(claim => 
        claim.itemId?.name?.toLowerCase().includes(term) ||
        claim.claimantId?.name?.toLowerCase().includes(term) ||
        claim.claimantId?.email?.toLowerCase().includes(term) ||
        claim.proofOfOwnership?.toLowerCase().includes(term)
      );
    }
    
    // Sort claims
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'item-name':
        filtered.sort((a, b) => {
          const nameA = a.itemId?.name?.toLowerCase() || '';
          const nameB = b.itemId?.name?.toLowerCase() || '';
          return nameA.localeCompare(nameB);
        });
        break;
      default:
        break;
    }
    
    setFilteredClaims(filtered);
  };

  const handleReviewClaim = async (status) => {
    if (!selectedClaim || !user._id) return;
    
    try {
      setProcessing(true);
      const response = await fetch(API_ENDPOINTS.CLAIM_BY_ID(selectedClaim._id), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          reviewedBy: user._id,
          reviewNotes: reviewNotes.trim(),
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Update local claims
        setClaims(prevClaims => 
          prevClaims.map(claim => 
            claim._id === selectedClaim._id ? data.data : claim
          )
        );
        
        // Show success message
        swalSuccess('Success', `Claim ${status.toLowerCase()} successfully!`);
        
        // Close modal
        setShowModal(false);
        setSelectedClaim(null);
        setReviewNotes('');
        setActionType('');
        
        // Refresh claims
        fetchClaims();
        // notify activity listeners to refresh logs immediately
        try { window.dispatchEvent(new CustomEvent('activity:updated', { detail: { type: 'claim', id: data.data?._id } })); } catch (e) { /* ignore */ }
      } else {
        swalError('Error', data.message || 'Failed to update claim');
      }
    } catch (error) {
      console.error('Error reviewing claim:', error);
      swalError('Error', 'An error occurred while processing the claim');
    } finally {
      setProcessing(false);
    }
  };

  const openReviewModal = (claim, action) => {
    setSelectedClaim(claim);
    setActionType(action);
    setShowModal(true);
    setReviewNotes('');
  };

  const handleDeleteClaim = async (claimId) => {
    // Confirm deletion
    const ok = await confirm('Delete claim?', 'Are you sure you want to delete this claim? This action cannot be undone.');
    if (!ok) return;

    try {
      setProcessing(true);
      const response = await fetch(API_ENDPOINTS.CLAIM_BY_ID(claimId), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        // Remove claim from local state
        setClaims(prevClaims => prevClaims.filter(claim => claim._id !== claimId));
        
        // Show success message
        swalSuccess('Deleted', 'Claim deleted successfully!');
        
        // Refresh claims to update stats
        fetchClaims();
      } else {
        swalError('Error', data.message || 'Failed to delete claim');
      }
    } catch (error) {
      console.error('Error deleting claim:', error);
      swalError('Error', 'An error occurred while deleting the claim');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      Pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
      Approved: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      Rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle }
    };
    
    const badge = badges[status] || badges.Pending;
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${badge.bg} ${badge.text}`}>
        <Icon className="w-4 h-4" />
        {status}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading claims...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <ModSidebar />
      
      <div className="flex-1 ml-64">
        {/* Compact Header with Gradient */}
        <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600 text-white px-8 py-14">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <h1 className="text-3xl font-bold">Claim Requests</h1>
                <p className="text-white/85 text-base mt-1">Review and verify claim requests</p>
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
       

        <div className="p-6">
      {/* Stats Cards */}
      <div className="mt-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all border border-gray-100">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-gray-500 text-sm font-medium mb-2">Total Request</h3>
                <p className="text-4xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <Package className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <button className="mt-3 w-full px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow-md active:scale-95">
              View All
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all border border-gray-100">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-gray-500 text-sm font-medium mb-2">Pending</h3>
                <p className="text-4xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-xl">
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
            <button className="mt-3 w-full px-4 py-2 bg-yellow-600 text-white hover:bg-yellow-700 rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow-md active:scale-95">
              Review
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all border border-gray-100">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-gray-500 text-sm font-medium mb-2">Approved</h3>
                <p className="text-4xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-xl">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <button className="mt-3 w-full px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow-md active:scale-95">
              View
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all border border-gray-100">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-gray-500 text-sm font-medium mb-2">Rejected</h3>
                <p className="text-4xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-xl">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <button className="mt-3 w-full px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow-md active:scale-95">
              Review
            </button>
          </div>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="bg-white rounded-xl shadow-sm mb-6 border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('Pending')}
            className={`flex-1 px-6 py-4 font-medium transition-all ${
              activeTab === 'Pending'
                ? 'bg-yellow-50 text-yellow-700 border-b-2 border-yellow-600'
                : 'text-gray-600 hover:bg-gray-50 hover:underline'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Clock className="w-5 h-5" />
              <span>Pending</span>
              <span className="bg-yellow-100 text-yellow-800 px-2.5 py-0.5 rounded-full text-sm font-semibold">
                {stats.pending}
              </span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('Approved')}
            className={`flex-1 px-6 py-4 font-medium transition-all ${
              activeTab === 'Approved'
                ? 'bg-green-50 text-green-700 border-b-2 border-green-600'
                : 'text-gray-600 hover:bg-gray-50 hover:underline'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>Approved</span>
              <span className="bg-green-100 text-green-800 px-2.5 py-0.5 rounded-full text-sm font-semibold">
                {stats.approved}
              </span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('Rejected')}
            className={`flex-1 px-6 py-4 font-medium transition-all ${
              activeTab === 'Rejected'
                ? 'bg-red-50 text-red-700 border-b-2 border-red-600'
                : 'text-gray-600 hover:bg-gray-50 hover:underline'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <XCircle className="w-5 h-5" />
              <span>Rejected</span>
              <span className="bg-red-100 text-red-800 px-2.5 py-0.5 rounded-full text-sm font-semibold">
                {stats.rejected}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-200">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by item name, claimant name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all hover:border-orange-400 hover:shadow-sm"
              />
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white min-w-[180px] transition-all hover:border-orange-400 hover:shadow-sm"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="item-name">Item Name (A-Z)</option>
            </select>
          </div>

          {/* Results Info */}
          <div className="flex items-center justify-between text-sm text-gray-600">

            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-orange-600 hover:text-orange-700 font-medium"
              >
                Clear Search
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Claims List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filteredClaims.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No claim requests found</p>
            {searchTerm && (
              <p className="text-sm text-gray-500 mt-2">Try adjusting your search</p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredClaims
              .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
              .map((claim) => (
              <div key={claim._id} className="hover:bg-gray-50 transition-colors">
                {/* Claim Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {claim.itemId?.name || 'Unknown Item'}
                        </h3>
                        {getStatusBadge(claim.status)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <User className="w-4 h-4" />
                          <span className="font-medium">Claimant:</span>
                          <span>{claim.claimantId?.name || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span className="font-medium">Submitted:</span>
                          <span>{formatDate(claim.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => setViewingClaim(claim)}
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all font-medium shadow-sm hover:shadow-md active:scale-95"
                        title="View Details"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Details - Removed, now using full-screen view */}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredClaims.length > itemsPerPage && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mt-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
            >
              Previous
            </button>
            
            <div className="flex items-center gap-2">
              {Array.from({ length: Math.ceil(filteredClaims.length / itemsPerPage) }, (_, i) => i + 1).map((page) => {
                const totalPages = Math.ceil(filteredClaims.length / itemsPerPage);
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-orange-600 text-white'
                          : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                } else if (page === currentPage - 2 || page === currentPage + 2) {
                  return <span key={page} className="text-gray-400">...</span>;
                }
                return null;
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredClaims.length / itemsPerPage)))}
              disabled={currentPage === Math.ceil(filteredClaims.length / itemsPerPage)}
              className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showModal && selectedClaim && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slideUp">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {actionType === 'Approved' ? 'Approve' : 'Reject'} Claim Request
              </h2>
              <p className="text-gray-600 mt-1">
                Item: {selectedClaim.itemId?.name}
              </p>
            </div>

            <div className="p-6 space-y-4">
              {selectedClaim?.imageUrl && (
                <div>
                  <div className="mb-4">
                    <img
                      src={selectedClaim.imageUrl}
                      alt={`Claim proof - ${selectedClaim.claimantId?.name || 'claimant'}`}
                      className="w-full h-56 object-cover rounded-md border border-gray-200 cursor-pointer"
                      onClick={() => {
                        setPreviewImageUrl(selectedClaim.imageUrl);
                        setIsPreviewOpen(true);
                      }}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Review Notes {actionType === 'Rejected' ? '(Required)' : '(Optional)'}
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={4}
                  placeholder={`Enter your ${actionType === 'Approved' ? 'approval' : 'rejection'} reason or notes...`}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">Please confirm:</p>
                    <p className="mt-1">
                      You are about to <span className="font-semibold">{actionType.toLowerCase()}</span> this claim request.
                      {actionType === 'Approved' && ' The item status will be updated to "Claimed".'}
                      {' '}The claimant will be notified via email and in-app notification.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => handleReviewClaim(actionType)}
                disabled={processing || (actionType === 'Rejected' && !reviewNotes.trim())}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                  actionType === 'Approved'
                    ? 'bg-green-600 hover:bg-green-700 text-white disabled:bg-green-300'
                    : 'bg-red-600 hover:bg-red-700 text-white disabled:bg-red-300'
                } disabled:cursor-not-allowed`}
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    {actionType === 'Approved' ? (
                      <><Check className="w-5 h-5" /> Confirm Approval</>
                    ) : (
                      <><X className="w-5 h-5" /> Confirm Rejection</>
                    )}
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedClaim(null);
                  setReviewNotes('');
                }}
                disabled={processing}
                className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Image Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
          <div className="relative max-w-5xl w-full">
            <button
              onClick={() => { setIsPreviewOpen(false); setPreviewImageUrl(null); }}
              className="absolute top-3 right-3 z-[70] bg-white/80 rounded-full p-2 hover:bg-white"
              aria-label="Close image preview"
            >
              <svg className="w-6 h-6 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <img
              src={previewImageUrl}
              alt="Preview"
              className="w-full h-[80vh] object-contain rounded-md mx-auto"
            />
          </div>
        </div>
      )}

      {/* Full-Screen Claim Details View */}
      {viewingClaim && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header with Back Button */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-8 px-8 shadow-lg sticky top-0 z-10">
              <div className="max-w-[1600px] mx-auto flex items-center gap-4">
                <button
                  onClick={() => setViewingClaim(null)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <ChevronUp className="w-6 h-6 -rotate-90" />
                </button>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold">{viewingClaim.itemId?.name || 'Claim Details'}</h1>
                  <p className="text-white/90 text-base mt-2">
                    Submitted: {formatDate(viewingClaim.createdAt)}
                  </p>
                </div>
                <div className="ml-auto">
                  {getStatusBadge(viewingClaim.status)}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="max-w-[1600px] mx-auto px-8 py-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-10">
                {/* Item Information */}
                <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                    <Package className="w-7 h-7 text-orange-600" />
                    Item Information
                  </h2>
                  
                  {viewingClaim.itemId?.imageUrl && (
                    <div className="mb-8">
                      <img
                        src={viewingClaim.itemId.imageUrl}
                        alt={viewingClaim.itemId.name}
                        className="w-full h-96 object-cover rounded-xl border border-gray-200 shadow-sm"
                      />
                    </div>
                  )}
                  
                  <div className="space-y-6">
                    <div className="flex flex-col gap-2">
                      <span className="text-sm text-gray-500 font-semibold uppercase tracking-wide">Description</span>
                      <p className="text-gray-900 bg-gray-50 p-4 rounded-lg leading-relaxed">
                        {viewingClaim.itemId?.description || 'No description provided'}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div className="flex flex-col gap-2">
                        <span className="text-sm text-gray-500 font-semibold uppercase tracking-wide">Category</span>
                        <p className="text-gray-900 font-semibold text-lg">{viewingClaim.itemId?.category || 'N/A'}</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className="text-sm text-gray-500 font-semibold uppercase tracking-wide">Item Status</span>
                        <p className="text-gray-900 font-semibold text-lg">{viewingClaim.itemId?.status || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 pt-2">
                      <span className="text-sm text-gray-500 font-semibold uppercase tracking-wide flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Location Found
                      </span>
                      <p className="text-gray-900 font-semibold text-lg">{viewingClaim.itemId?.location || 'N/A'}</p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <span className="text-sm text-gray-500 font-semibold uppercase tracking-wide flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Date Found
                      </span>
                      <p className="text-gray-900 font-semibold text-lg">
                        {viewingClaim.itemId?.date ? formatDate(viewingClaim.itemId.date) : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Claimant Information */}
                <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                    <User className="w-7 h-7 text-orange-600" />
                    Claimant Information
                  </h2>
                  
                  <div className="space-y-6">
                    <div className="flex flex-col gap-2">
                      <span className="text-sm text-gray-500 font-semibold uppercase tracking-wide">Full Name</span>
                      <p className="text-gray-900 font-semibold text-xl">
                        {viewingClaim.claimantId?.name || 'N/A'}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <span className="text-sm text-gray-500 font-semibold uppercase tracking-wide">Email Address</span>
                      <p className="text-gray-900 font-semibold text-lg">
                        {viewingClaim.claimantId?.email || 'N/A'}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <span className="text-sm text-gray-500 font-semibold uppercase tracking-wide">Phone Number</span>
                      <p className="text-gray-900 font-semibold text-lg">
                        {viewingClaim.claimantId?.phoneNumber || 'N/A'}
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 pt-6 border-t-2 border-gray-200">
                      <span className="text-sm text-gray-500 font-semibold uppercase tracking-wide flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Proof of Ownership
                      </span>
                      <div className="bg-orange-50 border-l-4 border-orange-500 p-5 rounded-lg">
                        <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">
                          {viewingClaim.proofOfOwnership || 'No proof of ownership provided'}
                        </p>
                      </div>
                    </div>

                    {viewingClaim.imageUrl && (
                      <div className="flex flex-col gap-3 pt-6 border-t-2 border-gray-200">
                        <span className="text-sm text-gray-500 font-semibold uppercase tracking-wide flex items-center gap-2">
                          <ImageIcon className="w-4 h-4" />
                          Supporting Image
                        </span>
                        <div className="mt-2">
                          <img
                            src={viewingClaim.imageUrl}
                            alt="Claim proof"
                            className="w-full h-96 object-cover rounded-xl border border-gray-200 shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => {
                              setPreviewImageUrl(viewingClaim.imageUrl);
                              setIsPreviewOpen(true);
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {viewingClaim.reviewNotes && (
                      <div className="flex flex-col gap-3 pt-6 border-t-2 border-gray-200">
                        <span className="text-sm text-gray-500 font-semibold uppercase tracking-wide">Review Notes</span>
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-5 rounded-lg">
                          <p className="text-gray-900 leading-relaxed">{viewingClaim.reviewNotes}</p>
                          {viewingClaim.reviewedBy && (
                            <p className="text-sm text-gray-600 mt-3">
                              Reviewed by: {viewingClaim.reviewedBy.name}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {viewingClaim.status === 'Pending' && (
                <div className="space-y-6">
                  {/* Moderator Information Card */}
                  <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-2xl shadow-lg p-6 border border-orange-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <UserCircle className="w-5 h-5 text-orange-600" />
                      Moderator Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg p-4">
                        <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Moderator Name</p>
                        <p className="text-lg font-semibold text-gray-900">{user?.name || 'N/A'}</p>
                      </div>
                      <div className="bg-white rounded-lg p-4">
                        <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Email Address</p>
                        <p className="text-sm text-gray-700 font-medium">{user?.email || 'N/A'}</p>
                      </div>
                      <div className="bg-white rounded-lg p-4">
                        <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Role</p>
                        <p className="text-sm font-semibold text-orange-600">Moderator</p>
                      </div>
                      <div className="bg-white rounded-lg p-4">
                        <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Review Time</p>
                        <p className="text-sm text-gray-700 font-medium">{new Date().toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Review Actions */}
                  <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Review Actions</h3>
                    <div className="flex gap-6">
                      <button
                        onClick={() => {
                          openReviewModal(viewingClaim, 'Approved');
                          setViewingClaim(null);
                        }}
                        className="flex-1 flex items-center justify-center gap-3 px-8 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all font-semibold text-lg shadow-md hover:shadow-lg active:scale-95"
                      >
                        <Check className="w-6 h-6" />
                        Approve Claim
                      </button>
                      <button
                        onClick={() => {
                          openReviewModal(viewingClaim, 'Rejected');
                          setViewingClaim(null);
                        }}
                        className="flex-1 flex items-center justify-center gap-3 px-8 py-4 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-semibold text-lg shadow-md hover:shadow-lg active:scale-95"
                      >
                        <X className="w-6 h-6" />
                        Reject Claim
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
}