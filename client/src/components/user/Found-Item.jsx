import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from "../layout/navbar";
import { uploadToCloudinary } from '../../utils/cloudinary';
import { API_ENDPOINTS } from '../../utils/constants';
import { inputPrompt, inputTextarea, success as swalSuccess, error as swalError } from '../../utils/swal';
import Swal from 'sweetalert2';

const FoundItems = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [items, setItems] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [userClaims, setUserClaims] = useState([]); // Array of user's claim requests
  const [claimModal, setClaimModal] = useState(null); // { itemId, itemName }
  const [proofOfOwnership, setProofOfOwnership] = useState('');
  const [claimImage, setClaimImage] = useState(null); // optional image file for claim
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedItem, setSelectedItem] = useState(null); // For item details modal
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [contacting, setContacting] = useState(false);

  // Helpers to mask contact info
  const maskEmail = (email) => {
    const [local = '', domain = ''] = (email || '').split('@');
    const maskedLocal = local.length > 2 ? `${local[0]}***${local.slice(-1)}` : (local[0] ? `${local[0]}*` : '***');
    const [domName = '', domTld = ''] = domain.split('.');
    const maskedDom = domName && domName.length > 2 ? `${domName[0]}***${domName.slice(-1)}` : (domName ? `${domName[0]}*` : '***');
    return `${maskedLocal}@${maskedDom}${domTld ? '.' + domTld : ''}`;
  };

  const maskPhone = (phone) => {
    const digits = (phone || '').replace(/[^0-9+]/g, '');
    if (digits.length <= 4) return '***';
    const visible = digits.slice(-4);
    const prefix = digits.slice(0, Math.max(0, digits.length - 8));
    return `${prefix}***${visible}`;
  };

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
    // Exclude items without valid user (orphaned posts)
    if (!item.userId) {
      return false;
    }
    
    // Exclude deleted, archived, claimed and returned items from user view
    if (item.status === 'Deleted' || item.status === 'Archived' || item.status === 'Claimed' || item.status === 'Returned') {
      return false;
    }
    
    const matchesSearch = item.name?.toLowerCase().includes(search.toLowerCase()) ||
                         item.description?.toLowerCase().includes(search.toLowerCase()) ||
                         item.location?.toLowerCase().includes(search.toLowerCase());
    
    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
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
    setClaimImage(null);
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
      // If an image file was selected, upload to Cloudinary first
      let imageUrl = '';
      if (claimImage) {
        try {
          imageUrl = await uploadToCloudinary(claimImage);
        } catch (uploadErr) {
          console.error('Image upload failed:', uploadErr);
          // Show the real error message to the user and stop submission
          setError(uploadErr.message || 'Failed to upload image. Please try again.');
          setLoading(false);
          return;
        }
      }
      const res = await fetch(API_ENDPOINTS.CLAIM_FOUND_ITEM(claimModal.itemId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claimantId: currentUserId,
          proofOfOwnership: proofOfOwnership,
          imageUrl,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to submit claim request');
      }

      setSuccess('Claim request submitted successfully! A moderator will review your request.');
      setClaimModal(null);
      setProofOfOwnership('');
      setClaimImage(null);
      
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
    setSelectedImageIndex(0);
  };

  const handleCloseModal = () => {
    setSelectedItem(null);
    setSelectedImageIndex(0);
  };

  return (
    <>
      <Navbar />
      
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/30 px-4 py-12 sm:px-6 lg:px-8">
        {/* Header Section */}
        <header className="max-w-7xl mx-auto mb-12">
          {/* Title with decorative element */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex-shrink-0">
              <div className="w-1.5 h-12 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full"></div>
            </div>
            <div>
              <h1 className="text-[#134252] text-4xl font-bold tracking-tight">
                Found Items
              </h1>
              <p className="text-[#626C71] text-sm mt-1">
                Browse items that have been found and claim what belongs to you
              </p>
            </div>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-r-xl shadow-md flex items-start gap-3">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              <span className="text-sm font-medium">{success}</span>
            </div>
          )}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-xl shadow-md flex items-start gap-3">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
              </svg>
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}
  
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
            {/* Search Bar - Enhanced */}
            <div className="flex-1 max-w-2xl">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg 
                    className="h-5 w-5 text-orange-500 group-focus-within:text-orange-600 transition-colors" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl 
                           bg-white text-[#134252] placeholder-[#626C71]/50 text-sm
                           focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500
                           transition-all shadow-sm hover:shadow-md"
                  placeholder="Search by item name, description, or location..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Filter Buttons - Modern Pills */}
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/found')}
                className="flex-1 lg:flex-none lg:w-36 px-6 py-3.5 rounded-xl font-semibold text-sm 
                         transition-all duration-200 bg-gradient-to-r from-blue-700 to-blue-800 
                         text-white shadow-lg shadow-blue-700/30 hover:shadow-xl hover:shadow-blue-700/40
                         hover:from-blue-800 hover:to-blue-900 active:scale-95"
              >
                Found Items
              </button>
              <button
                onClick={() => navigate('/lost')}
                className="flex-1 lg:flex-none lg:w-36 px-6 py-3.5 rounded-xl font-semibold text-sm 
                         transition-all duration-200 bg-white text-[#134252] hover:bg-gray-50 
                         border-2 border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md
                         active:scale-95"
              >
                Lost Items
              </button>
            </div>
          </div>

          {/* Category Filters */}
          <div className="mt-6">
            <label className="block text-sm font-semibold text-[#134252] mb-3">Filter by Category</label>
            <div className="flex flex-wrap gap-2">
              {['All', 'Electronics', 'Personal Items', 'Bags & Wallets', 'Keys', 'Clothing', 'Accessories', 'Books & Documents', 'Sports Equipment', 'Jewelry', 'Other'].map((category) => (
                <button
                  key={category}
                  onClick={() => setCategoryFilter(category)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                    categoryFilter === category
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
                      : 'bg-white text-[#134252] border border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </header>
        {/* Items Grid */}
        <div className="max-w-7xl mx-auto">
          {/* Stats Bar */}
          <div className="mb-6 flex items-center justify-between">
            <p className="text-[#626C71] text-sm">
              {filtered.length === 0 ? 'No items found' : `Showing ${filtered.length} ${filtered.length === 1 ? 'item' : 'items'}`}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.length === 0 ? (
              <div className="col-span-full">
                <div className="max-w-md mx-auto text-center py-20">
                  {/* Empty State Illustration */}
                  <div className="mb-6 relative">
                    <div className="w-24 h-24 mx-auto bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center">
                      <svg 
                        className="w-12 h-12 text-orange-500" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={1.5} 
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                        />
                      </svg>
                    </div>
                    <div className="absolute inset-0 bg-orange-400/20 blur-3xl -z-10 rounded-full"></div>
                  </div>
                  <h3 className="text-[#134252] text-xl font-bold mb-2">No items found</h3>
                  <p className="text-[#626C71] text-sm leading-relaxed">
                    {search ? 'Try adjusting your search terms or clearing filters' : 'No found items have been reported yet'}
                  </p>
                </div>
              </div>
            ) : (
              filtered.map((item) => (
                <div
                  key={item.id || item._id}
                  className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl 
                           transition-all duration-300 flex flex-col border border-gray-100
                           hover:border-orange-200 hover:-translate-y-1"
                >
                  {/* User Profile Header - Enhanced */}
                  <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      {item.userId?.profilePicture ? (
                        <img
                          src={item.userId.profilePicture}
                          alt={item.userId.name}
                          className="w-9 h-9 rounded-full object-cover ring-2 ring-white shadow-md"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-sm font-bold shadow-md ring-2 ring-white">
                          {item.userId?.name ? item.userId.name.substring(0, 2).toUpperCase() : 'U'}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[#134252] truncate">
                          {item.userId?.name || 'Unknown User'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Item Image - Enhanced */}
                  <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                    {(() => {
                      const primaryImage = item.images && item.images.length > 0 ? item.images[0] : item.imageUrl;
                      if (primaryImage) {
                        return (
                          <img
                            src={primaryImage}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        );
                      }
                      return (
                        <div className="flex items-center justify-center w-full h-full">
                          <div className="text-center">
                            <svg className="w-16 h-16 mx-auto text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={1.5} 
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                              />
                            </svg>
                            <p className="text-xs text-gray-400">No image</p>
                          </div>
                        </div>
                      );
                    })()}
                    {/* Status Badge Overlay */}
                    <div className="absolute top-3 right-3">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm shadow-lg ${
                          item.status === 'Pending'
                            ? 'bg-yellow-500/90 text-white'
                            : item.status === 'Claimed'
                            ? 'bg-green-500/90 text-white'
                            : 'bg-orange-500/90 text-white'
                        }`}
                      >
                        {item.status || 'Available'}
                      </span>
                    </div>
                  </div>

                  {/* Item Details - Enhanced */}
                  <div className="p-4 flex flex-col grow">
                    {/* Title */}
                    <h3 className="text-[#134252] font-bold text-base mb-2 line-clamp-1 group-hover:text-orange-600 transition-colors">
                      {item.name}
                    </h3>

                    {/* Location with Icon */}
                    <div className="flex items-start gap-2 mb-3">
                      <svg className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <p className="text-[#626C71] text-xs line-clamp-1">
                        {item.location}
                      </p>
                    </div>

                    {/* Date with Icon */}
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-4 h-4 text-orange-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-[#626C71] text-xs">
                        {item.date ? new Date(item.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        }) : 'Date not available'}
                      </span>
                    </div>

                    {/* Category Badge */}
                    {item.category && (
                      <div className="mb-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-orange-100 text-orange-700 rounded-md text-xs font-medium">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          {item.category}
                        </span>
                      </div>
                    )}

                    {/* Description */}
                    <p className="text-[#626C71] text-sm mb-4 line-clamp-2 grow leading-relaxed">
                      {item.description}
                    </p>

                    {/* Action Buttons - Enhanced */}
                    <div className="space-y-2">
                      <button
                        onClick={() => handleViewDetails(item)}
                        className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 
                                 bg-gray-100 text-[#134252] hover:bg-gray-200 active:scale-95"
                      >
                        View Details
                      </button>
                      
                      {/* Show different states based on user relationship to item */}
                      {String(item.userId?._id || item.userId?.id || item.userId) === String(currentUserId) ? (
                        <button
                          disabled
                          className="w-full py-3 rounded-xl font-semibold text-sm
                                   bg-gray-200 text-gray-500 cursor-not-allowed opacity-60"
                          title="You cannot claim your own item"
                        >
                          Cannot Claim Own Item
                        </button>
                      ) : hasPendingClaim(item.id || item._id) ? (
                        <div className="w-full py-3 rounded-xl font-semibold text-xs bg-yellow-100 text-yellow-700 text-center border-2 border-yellow-200">
                          Claim Request Pending
                        </div>
                      ) : (
                        <button
                          onClick={() => handleClaim(item)}
                          className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 
                                   bg-gradient-to-r from-blue-700 to-blue-800 text-white 
                                   shadow-md shadow-blue-700/30 hover:shadow-lg hover:shadow-blue-700/40
                                   hover:from-blue-800 hover:to-blue-900 active:scale-95
                                   group-hover:shadow-xl"
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
              {(() => {
                const imgs = selectedItem.images && selectedItem.images.length > 0 ? selectedItem.images : (selectedItem.imageUrl ? [selectedItem.imageUrl] : []);
                if (imgs.length === 0) return null;
                return (
                  <div className="mb-6 rounded-lg overflow-hidden">
                    <img
                      src={imgs[selectedImageIndex]}
                      alt={selectedItem.name}
                      className="w-full h-64 object-cover"
                    />
                    {imgs.length > 1 && (
                      <div className="mt-2 flex gap-2 overflow-x-auto">
                        {imgs.map((u, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setSelectedImageIndex(i)}
                            className={`rounded-md overflow-hidden border ${i === selectedImageIndex ? 'border-orange-500' : 'border-gray-200'}`}
                          >
                            <img src={u} alt={`${selectedItem.name}-${i}`} className="w-20 h-14 object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

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
                    className="flex-1 px-4 py-2 rounded-lg font-medium text-sm text-white bg-gradient-to-r from-blue-700 to-blue-800 hover:shadow-md transition-all"
                  >
                    Claim This Item
                  </button>
                )}

                {(() => {
                  const info = selectedItem.contactInfo || '';
                  const isEmail = info.includes('@');
                  const isTel = /\d{6,}/.test(info);
                  return (
                    <div className="flex gap-2 w-full">
                      {isTel && (
                        <button
                          onClick={() => {
                            const tel = `tel:${info.replace(/[^0-9+]/g, '')}`;
                            window.open(tel, '_self');
                          }}
                          className="flex-1 px-4 py-2 rounded-lg font-medium text-sm text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
                        >
                          Call Owner
                        </button>
                      )}
                      {isEmail && (
                        <button
                          onClick={() => {
                            const subject = encodeURIComponent(`Regarding your found item: ${selectedItem.name || ''}`);
                            const body = encodeURIComponent(`Hi ${selectedItem.userId?.name || ''},\n\nI believe I found your item: ${selectedItem.name || ''}.\n\n`);
                            window.location.href = `mailto:${info}?subject=${subject}&body=${body}`;
                          }}
                          className="flex-1 px-4 py-2 rounded-lg font-medium text-sm text-white bg-sky-600 hover:bg-sky-700 transition-colors"
                        >
                          Email Owner
                        </button>
                      )}
                      
                      <button
                        onClick={async () => {
                          if (!currentUserId) {
                            swalError('Please log in', 'You must be logged in to contact the owner.');
                            return;
                          }
                          // Quick contact modal: show masked contact and allow Call or Send Message
                          const info = selectedItem.contactInfo || '';
                          const maskedEmail = info.includes('@') ? maskEmail(info) : null;
                          const maskedPhone = /\d{6,}/.test(info) ? maskPhone(info) : null;

                          const html = `
                            <div class="text-sm mb-3">
                              ${maskedEmail ? `<div><strong>Email:</strong> ${maskedEmail}</div>` : ''}
                              ${maskedPhone ? `<div><strong>Phone:</strong> ${maskedPhone}</div>` : ''}
                            </div>
                            <div class="text-xs text-gray-600">Choose "Send Message" to send a private message via iFind, or "Call" to open your phone app.</div>
                          `;

                          const result = await Swal.fire({
                            title: 'Contact Owner',
                            html,
                            showCancelButton: true,
                            showDenyButton: !!maskedPhone,
                            confirmButtonText: 'Send Message',
                            denyButtonText: 'Call',
                            width: '520px',
                          });

                          if (result.isDenied) {
                            const tel = `tel:${info.replace(/[^0-9+]/g, '')}`;
                            window.open(tel, '_self');
                            return;
                          }

                          if (!result.isConfirmed) return;

                          const prefill = `I found your item: ${selectedItem.name || ''}.`;
                          const message = await inputTextarea('Send Message', '', 'Write your message here', prefill);
                          if (!message) return;
                          setContacting(true);
                          try {
                            const res = await fetch(API_ENDPOINTS.CONTACT_ITEM(selectedItem._id || selectedItem.id), {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ message, senderId: currentUserId }),
                            });
                            const json = await res.json();
                            if (!res.ok) throw new Error(json.message || 'Failed to send message');
                            swalSuccess('Message sent', 'The owner has been notified');
                          } catch (err) {
                            swalError('Failed', err.message || 'Failed to send message');
                          } finally {
                            setContacting(false);
                          }
                        }}
                        disabled={contacting}
                        className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-all ${contacting ? 'opacity-60 cursor-not-allowed bg-orange-400 text-white' : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:shadow-md'}`}
                      >
                        {contacting ? 'Sending...' : 'Send Message'}
                      </button>
                    </div>
                  );
                })()}
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

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Optional image (photo)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setClaimImage(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
                    className="w-full text-sm"
                  />
                  {claimImage && (
                    <div className="mt-2">
                      <img
                        src={URL.createObjectURL(claimImage)}
                        alt="preview"
                        className="w-full h-36 object-cover rounded-md border border-gray-200"
                      />
                    </div>
                  )}
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
                  className={`px-4 py-2 rounded-md text-sm font-medium text-white bg-gradient-to-r from-blue-700 to-blue-800 hover:shadow-md transition-all ${
                    loading ? 'opacity-50 cursor-not-allowed' : ''
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
