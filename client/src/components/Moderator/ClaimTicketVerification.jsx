import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Eye, Check, X, Clock, AlertCircle, 
  User, Package, Calendar, MapPin, FileText, Image as ImageIcon,
  ChevronDown, ChevronUp, CheckCircle, XCircle, Bell, UserCircle, Trash2
} from 'lucide-react';
import { API_ENDPOINTS } from '../../utils/constants';
import ModSidebar from '../layout/ModSidebar';

export default function ClaimTicketVerification() {
  const [claims, setClaims] = useState([]);
  const [filteredClaims, setFilteredClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [actionType, setActionType] = useState('');
  const [processing, setProcessing] = useState(false);
  
  // Filters
  const [activeTab, setActiveTab] = useState('Pending'); // Pending, Approved, Rejected
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedClaim, setExpandedClaim] = useState(null);
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, item-name
  
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

  useEffect(() => {
    fetchClaims();
  }, []);

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
        alert(`Claim ${status.toLowerCase()} successfully!`);
        
        // Close modal
        setShowModal(false);
        setSelectedClaim(null);
        setReviewNotes('');
        setActionType('');
        
        // Refresh claims
        fetchClaims();
      } else {
        alert(data.message || 'Failed to update claim');
      }
    } catch (error) {
      console.error('Error reviewing claim:', error);
      alert('An error occurred while processing the claim');
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
    if (!window.confirm('Are you sure you want to delete this claim? This action cannot be undone.')) {
      return;
    }

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
        alert('Claim deleted successfully!');
        
        // Refresh claims to update stats
        fetchClaims();
      } else {
        alert(data.message || 'Failed to delete claim');
      }
    } catch (error) {
      console.error('Error deleting claim:', error);
      alert('An error occurred while deleting the claim');
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-700 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading claims...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-gray-50 min-h-screen">
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
                     <h1 className="text-4xl font-bold mb-2">Claim Request</h1>
                     <p className="text-red-100 text-lg">Manage and track all lost items in the system</p>
                   </div>
              </div>
          </div>
       

        <div className="p-6">
      {/* Stats Cards */}
      <div className="-mt-12 mb-8">
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
            <button className="mt-3 w-full px-4 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg text-sm font-semibold text-blue-600 transition-colors">
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
            <button className="mt-3 w-full px-4 py-2 bg-yellow-50 hover:bg-yellow-100 rounded-lg text-sm font-semibold text-yellow-600 transition-colors">
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
            <button className="mt-3 w-full px-4 py-2 bg-green-50 hover:bg-green-100 rounded-lg text-sm font-semibold text-green-600 transition-colors">
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
            <button className="mt-3 w-full px-4 py-2 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-semibold text-red-600 transition-colors">
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
            className={`flex-1 px-6 py-4 font-medium transition-colors ${
              activeTab === 'Pending'
                ? 'bg-yellow-50 text-yellow-700 border-b-2 border-yellow-600'
                : 'text-gray-600 hover:bg-gray-50'
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
            className={`flex-1 px-6 py-4 font-medium transition-colors ${
              activeTab === 'Approved'
                ? 'bg-green-50 text-green-700 border-b-2 border-green-600'
                : 'text-gray-600 hover:bg-gray-50'
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
            className={`flex-1 px-6 py-4 font-medium transition-colors ${
              activeTab === 'Rejected'
                ? 'bg-red-50 text-red-700 border-b-2 border-red-600'
                : 'text-gray-600 hover:bg-gray-50'
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
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent appearance-none bg-white min-w-[180px]"
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
                className="text-red-600 hover:text-red-700 font-medium"
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
                        onClick={() => setExpandedClaim(expandedClaim === claim._id ? null : claim._id)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="View Details"
                      >
                        {expandedClaim === claim._id ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedClaim === claim._id && (
                  <div className="px-6 pb-6 border-t border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                      {/* Item Details */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-gray-900 mb-3">Item Information</h4>
                        
                        {claim.itemId?.imageUrl && (
                          <div className="mb-4">
                            <img
                              src={claim.itemId.imageUrl}
                              alt={claim.itemId.name}
                              className="w-full h-48 object-cover rounded-lg border border-gray-200"
                            />
                          </div>
                        )}
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Description:</span>
                            <span className="font-medium text-gray-900 text-right max-w-[60%]">
                              {claim.itemId?.description || 'No description'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Location:</span>
                            <span className="font-medium text-gray-900">
                              {claim.itemId?.location || 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Date Found:</span>
                            <span className="font-medium text-gray-900">
                              {claim.itemId?.date ? formatDate(claim.itemId.date) : 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Item Status:</span>
                            <span className="font-medium text-gray-900">
                              {claim.itemId?.status || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Claimant Details */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-gray-900 mb-3">Claimant Information</h4>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Name:</span>
                            <span className="font-medium text-gray-900">
                              {claim.claimantId?.name || 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Email:</span>
                            <span className="font-medium text-gray-900">
                              {claim.claimantId?.email || 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Phone:</span>
                            <span className="font-medium text-gray-900">
                              {claim.claimantId?.phoneNumber || 'N/A'}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Proof of Ownership:</h5>
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">
                              {claim.proofOfOwnership || 'No proof provided'}
                            </p>
                          </div>
                        </div>

                        {claim.reviewNotes && (
                          <div className="mt-4">
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Review Notes:</h5>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                              <p className="text-sm text-gray-700">{claim.reviewNotes}</p>
                              {claim.reviewedBy && (
                                <p className="text-xs text-gray-500 mt-2">
                                  Reviewed by: {claim.reviewedBy.name}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {claim.status === 'Pending' && (
                      <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => openReviewModal(claim, 'Approved')}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                        >
                          <Check className="w-5 h-5" />
                          Approve Claim
                        </button>
                        <button
                          onClick={() => openReviewModal(claim, 'Rejected')}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                        >
                          <X className="w-5 h-5" />
                          Reject Claim
                        </button>
                        <button
                          onClick={() => handleDeleteClaim(claim._id)}
                          disabled={processing}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors font-medium ml-auto disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-5 h-5" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
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
                          ? 'bg-red-700 text-white'
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Review Notes {actionType === 'Rejected' ? '(Required)' : '(Optional)'}
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={4}
                  placeholder={`Enter your ${actionType === 'Approved' ? 'approval' : 'rejection'} reason or notes...`}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
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
        </div>
      </div>
    </div>
  );
}