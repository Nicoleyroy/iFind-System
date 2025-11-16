import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from "../layout/navbar";
import { API_ENDPOINTS } from '../../utils/constants';

const FoundItems = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [items, setItems] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [userClaims, setUserClaims] = useState([]); // Array of user's claim requests
  const [claimModal, setClaimModal] = useState(null); // { itemId, itemName }
  const [proofOfOwnership, setProofOfOwnership] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedItem, setSelectedItem] = useState(null); // For item details modal

  useEffect(() => {
    // Get current user from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUserId(user._id || user.id);
      } catch (e) {
        console.warn('Failed to parse user from localStorage', e);
      }
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        // Fetch only found items
        const res = await fetch(API_ENDPOINTS.FOUND_ITEMS);
        const json = await res.json();
        setItems(Array.isArray(json.data) ? json.data : []);
      } catch (e) {
        console.warn('Failed to load items', e);
      }
    };
    load();
  }, []);

  useEffect(() => {
    // Load user's claim requests
    const loadUserClaims = async () => {
      if (!currentUserId) return;
      
      try {
        const res = await fetch(API_ENDPOINTS.CLAIMS);
        const json = await res.json();
        if (Array.isArray(json.data)) {
          // Filter to only show claims by the current user
          const userClaimRequests = json.data.filter(
            claim => String(claim.claimantId?._id || claim.claimantId?.id || claim.claimantId) === String(currentUserId)
          );
          setUserClaims(userClaimRequests);
        }
      } catch (e) {
        console.warn('Failed to load user claims', e);
      }
    };
    loadUserClaims();
  }, [currentUserId]);

  // Filter items based on search and exclude deleted/archived items
  const filtered = items.filter(item => {
    // Exclude deleted, archived, and claimed items from user view
    if (item.status === 'Deleted' || item.status === 'Archived' || item.status === 'Claimed') {
      return false;
    }
    
    const matchesSearch = item.name?.toLowerCase().includes(search.toLowerCase()) ||
                         item.description?.toLowerCase().includes(search.toLowerCase()) ||
                         item.location?.toLowerCase().includes(search.toLowerCase());
    
    return matchesSearch;
  });

  // Check if user has a pending claim for an item
  const hasPendingClaim = (itemId) => {
    if (!currentUserId) return false;
    return userClaims.some(
      claim => 
        String(claim.itemId?._id || claim.itemId?.id || claim.itemId) === String(itemId) &&
        claim.status === 'Pending'
    );
  };

  const handleClaim = (item) => {
    if (!currentUserId) {
      setError('Please log in to claim an item');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    // Check if user already has a pending claim for this item
    if (hasPendingClaim(item.id || item._id)) {
      setError('You already have a pending claim request for this item');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    setClaimModal({ itemId: item.id || item._id, itemName: item.name });
    setProofOfOwnership('');
    setError('');
    setSuccess('');
  };

  const handleSubmitClaim = async (e) => {
    e.preventDefault();
    if (!claimModal || !currentUserId) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(API_ENDPOINTS.CLAIM_FOUND_ITEM(claimModal.itemId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claimantId: currentUserId,
          proofOfOwnership: proofOfOwnership,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to submit claim request');
      }

      setSuccess('Claim request submitted successfully! A moderator will review your request.');
      setClaimModal(null);
      setProofOfOwnership('');
      
      // Reload items and user claims to update status
      const itemsRes = await fetch(API_ENDPOINTS.FOUND_ITEMS);
      const itemsJson = await itemsRes.json();
      setItems(Array.isArray(itemsJson.data) ? itemsJson.data : []);

      // Reload user claims
      if (currentUserId) {
        const claimsRes = await fetch(API_ENDPOINTS.CLAIMS);
        const claimsJson = await claimsRes.json();
        if (Array.isArray(claimsJson.data)) {
          const userClaimRequests = claimsJson.data.filter(
            claim => String(claim.claimantId?._id || claim.claimantId?.id || claim.claimantId) === String(currentUserId)
          );
          setUserClaims(userClaimRequests);
        }
      }
      
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.message || 'Failed to submit claim request');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (item) => {
    setSelectedItem(item);
  };

  const handleCloseModal = () => {
    setSelectedItem(null);
  };

  return (
    <>
      <Navbar />
      
      <main className="min-h-screen bg-gradient-to-br from-orange-50 via-orange-100/30 to-orange-200/40">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-400 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-12 sm:px- lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
                Found Items Directory
              </h1>
              <p className="text-orange-50 text-lg max-w-2xl mx-auto">
                Browse through items that have been found and claim what belongs to you
              </p>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {success && (
            <div className="mt-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-r-lg shadow-sm flex items-start gap-3">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              <span className="text-sm font-medium">{success}</span>
            </div>
          )}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg shadow-sm flex items-start gap-3">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
              </svg>
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}
        </div>

        {/* Filter and Search Section */}
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              {/* Search Bar */}
              <div className="w-full lg:flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Items
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    placeholder="Search by name, description, or location..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              {/* Category Filter Buttons */}
              <div className="w-full lg:w-auto">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => navigate('/found')}
                    className="flex-1 lg:w-32 px-4 py-3 rounded-lg font-semibold text-sm transition-all bg-gradient-to-r from-orange-500 to-orange-400 text-white shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
                  >
                    Found
                  </button>
                  <button
                    onClick={() => navigate('/lost')}
                    className="flex-1 lg:w-32 px-4 py-3 rounded-lg font-semibold text-sm transition-all bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-300 shadow-sm hover:shadow-md"
                  >
                    Lost
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* Items Grid */}
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filtered.length === 0 ? (
              <div className="col-span-full text-center py-16">
                <svg 
                  className="mx-auto h-16 w-16 text-[#626C71]/40 mb-4" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={1.5} 
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" 
                  />
                </svg>
                <p className="text-gray-900 text-lg font-medium mb-2">No items found</p>
                <p className="text-gray-600 text-sm">
                  {search ? 'Try adjusting your search terms' : 'No items have been reported yet'}
                </p>
              </div>
            ) : (
              filtered.map((item) => (
                <div
                  key={item.id || item._id}
                  className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md 
                           transition-all duration-200 flex flex-col"
                >
                  {/* User Profile Header */}
                  <div className="p-2.5 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      {item.userId?.profilePicture ? (
                        <img
                          src={item.userId.profilePicture}
                          alt={item.userId.name}
                          className="w-7 h-7 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-500 to-orange-400 flex items-center justify-center text-white text-xs font-semibold">
                          {item.userId?.name ? item.userId.name.substring(0, 2).toUpperCase() : 'U'}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-gray-900 truncate">
                          {item.userId?.name || 'Unknown User'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Item Image */}
                  <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                    {item.imageUrl ? (
                      <img 
                        src={item.imageUrl} 
                        alt={item.name} 
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" 
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full text-[#626C71]/40">
                        <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={1.5} 
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Item Details */}
                  <div className="p-3 flex flex-col flex-grow">
                    {/* Title and Date */}
                    <div className="flex justify-between items-start mb-1.5">
                      <h3 className="text-gray-900 font-semibold text-sm flex-1">
                        {item.name}
                      </h3>
                      <span className="text-gray-500 text-xs whitespace-nowrap ml-2">
                        {item.date ? new Date(item.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        }) : ''}
                      </span>
                    </div>

                    {/* Location */}
                    <p className="text-gray-600 text-xs mb-1.5">
                      {item.location}
                    </p>

                    {/* Description */}
                    <p className="text-gray-700 text-xs mb-2 line-clamp-2 flex-grow">
                      {item.description}
                    </p>

                    {/* Status Badge */}
                    <div className="mb-2">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          item.status === 'Pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : item.status === 'Claimed'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-orange-100 text-orange-700'
                        }`}
                      >
                        {item.status || 'Unclaimed'}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <button
                        onClick={() => handleViewDetails(item)}
                        className="w-full py-2 rounded-lg font-medium text-xs transition-all bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95"
                      >
                        View Details
                      </button>
                      
                      {hasPendingClaim(item.id || item._id) ? (
                        <div className="w-full py-2 rounded-lg font-medium text-xs bg-yellow-100 text-yellow-700 text-center">
                          Claim Request Pending
                        </div>
                      ) : (
                        <button
                          onClick={() => handleClaim(item)}
                          className="w-full py-2 rounded-lg font-medium text-xs transition-all bg-gradient-to-r from-orange-500 to-orange-400 text-white hover:shadow-md active:scale-95 shadow-sm"
                        >
                          Claim Item
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Item Details Modal */}
      {selectedItem && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={handleCloseModal}
        >
          <div 
            className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-xl">
              <h2 className="text-xl font-semibold text-gray-900">Item Details</h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Item Image */}
              {selectedItem.imageUrl && (
                <div className="mb-6 rounded-lg overflow-hidden">
                  <img 
                    src={selectedItem.imageUrl} 
                    alt={selectedItem.name}
                    className="w-full h-64 object-cover"
                  />
                </div>
              )}

              {/* Item Information */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedItem.name}</h3>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      selectedItem.status === 'Pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : selectedItem.status === 'Claimed'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-orange-100 text-orange-700'
                    }`}
                  >
                    {selectedItem.status || 'Unclaimed'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Date Found</p>
                    <p className="text-gray-900">
                      {selectedItem.date ? new Date(selectedItem.date).toLocaleDateString('en-US', { 
                        year: 'numeric',
                        month: 'long', 
                        day: 'numeric' 
                      }) : 'N/A'}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Location</p>
                    <p className="text-gray-900">{selectedItem.location || 'N/A'}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Category</p>
                    <p className="text-gray-900">{selectedItem.category || 'N/A'}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Reported By</p>
                    <div className="flex items-center gap-2">
                      {selectedItem.userId?.profilePicture ? (
                        <img
                          src={selectedItem.userId.profilePicture}
                          alt={selectedItem.userId.name}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-500 to-orange-400 flex items-center justify-center text-white text-xs font-semibold">
                          {selectedItem.userId?.name ? selectedItem.userId.name.substring(0, 2).toUpperCase() : 'U'}
                        </div>
                      )}
                      <p className="text-gray-900">{selectedItem.userId?.name || 'Unknown User'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Description</p>
                  <p className="text-gray-900 leading-relaxed">{selectedItem.description || 'No description provided.'}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-6 border-t border-gray-200 flex gap-3">
                <button
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 rounded-lg font-medium text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
                {!hasPendingClaim(selectedItem.id || selectedItem._id) && (
                  <button
                    onClick={() => {
                      handleCloseModal();
                      handleClaim(selectedItem);
                    }}
                    className="flex-1 px-4 py-2 rounded-lg font-medium text-sm text-white bg-gradient-to-r from-orange-500 to-orange-400 hover:shadow-md transition-all"
                  >
                    Claim This Item
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Claim Request Modal */}
      {claimModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Claim Item</h2>
            <p className="text-gray-600 text-sm mb-4">
              Please provide proof of ownership for <strong>{claimModal.itemName}</strong>. This will be reviewed by a moderator.
            </p>
            
            <form onSubmit={handleSubmitClaim} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Proof of Ownership
                </label>
                <textarea
                  value={proofOfOwnership}
                  onChange={(e) => setProofOfOwnership(e.target.value)}
                  required
                  rows={4}
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="Describe how you can prove this item belongs to you (e.g., unique features, purchase receipt, photos, etc.)"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setClaimModal(null);
                    setProofOfOwnership('');
                    setError('');
                  }}
                  disabled={loading}
                  className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-4 py-2 rounded-md text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-orange-400 hover:shadow-md transition-all ${
                    loading ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? 'Submitting...' : 'Submit Claim Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default FoundItems;
