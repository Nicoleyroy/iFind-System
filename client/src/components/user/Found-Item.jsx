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
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'details', 'claim'
  const [messageFormData, setMessageFormData] = useState({ name: '', email: '', message: '' });
  const [messageModal, setMessageModal] = useState(null); // { itemId, itemName }

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
    
    const matchesSearch = item.name?.toLowerCase().includes(search.toLowerCase());
    
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
      const normalizedProof = String(proofOfOwnership || '').trim();
      if (!normalizedProof) {
        setError('Proof of Ownership is required.');
        setLoading(false);
        return;
      }
      if (normalizedProof.length > 500) {
        setError('Proof of Ownership text is too long.');
        setLoading(false);
        return;
      }
      const proofPattern = /^[A-Za-z0-9\s.,'"\-()]+$/;
      if (!proofPattern.test(normalizedProof)) {
        setError('Invalid characters in Proof of Ownership.');
        setLoading(false);
        return;
      }

      if (claimImage) {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (!allowedTypes.includes(claimImage.type)) {
          setError('Supporting Photo must be an image file (JPG, PNG, etc.)');
          setLoading(false);
          return;
        }
        const maxSizeBytes = 5 * 1024 * 1024;
        if (claimImage.size > maxSizeBytes) {
          setError('Supporting Photo exceeds maximum allowed size.');
          setLoading(false);
          return;
        }
      }

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
          proofOfOwnership: normalizedProof,
          imageUrl,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to submit claim request');
      }

      // Show success message with SweetAlert
      await Swal.fire({
        icon: 'success',
        title: 'Claim Submitted!',
        text: 'Your claim request has been submitted successfully. A moderator will review it shortly.',
        confirmButtonColor: '#f97316'
      });

      // Reset states and navigate back to grid
      setClaimModal(null);
      setProofOfOwnership('');
      setClaimImage(null);
      setSelectedItem(null);
      setViewMode('grid');
      
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
    } catch (err) {
      setError(err.message || 'Failed to submit claim request');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (item) => {
    setSelectedItem(item);
    setSelectedImageIndex(0);
    setViewMode('details');
  };

  const handleCloseModal = () => {
    setSelectedItem(null);
    setSelectedImageIndex(0);
    setViewMode('grid');
    setProofOfOwnership('');
    setClaimImage(null);
    setError('');
    setSuccess('');
  };

  const handleStartClaim = (item) => {
    setSelectedItem(item);
    setClaimModal({ itemId: item.id || item._id, itemName: item.name });
    setProofOfOwnership('');
    setClaimImage(null);
    setError('');
    setSuccess('');
    setViewMode('claim');
  };

  const handleBackToDetails = () => {
    setViewMode('details');
    setClaimModal(null);
    setProofOfOwnership('');
    setClaimImage(null);
    setError('');
  };

  // If viewing item details or claim form, show full-page view instead of grid
  if (selectedItem && viewMode === 'details') {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-white">
          {/* Sticky Top Bar */}
          <div className="sticky top-0 z-40 border-b border-orange-100" style={{ background: 'linear-gradient(to bottom right, #fff7ed, #fef2f2, #fffbeb)' }}>
            <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between">
                <button
                  onClick={handleCloseModal}
                  className="flex items-center gap-2 text-[#134252] hover:text-orange-600 transition-colors font-medium"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span>Back to Results</span>
                </button>
                <div className="flex items-center gap-3">
                  <h1 className="text-lg font-bold text-[#134252]">Item Details</h1>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      selectedItem.status === 'Pending'
                        ? 'bg-orange-500 text-white'
                        : selectedItem.status === 'Claimed'
                        ? 'bg-orange-500 text-white'
                        : 'bg-orange-500 text-white'
                    }`}
                  >
                    {selectedItem.status || 'Active'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content - Two Column Layout */}
          <div className="max-w-7xl mx-auto px-4 py-6 sm:py-12 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-12">
              {/* Left Column - Image (40%) */}
              <div className="lg:col-span-2">
                <div className="sticky top-24">
                  {(() => {
                    const imgs = selectedItem.images && selectedItem.images.length > 0 ? selectedItem.images : (selectedItem.imageUrl ? [selectedItem.imageUrl] : []);
                    if (imgs.length > 0) {
                      return (
                        <div className="space-y-4">
                          <div className="relative w-full bg-gray-100 rounded-lg overflow-hidden border border-gray-200" style={{maxHeight: '65vh', aspectRatio: '1/1'}}>
                            <img
                              src={imgs[selectedImageIndex]}
                              alt={selectedItem.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          {imgs.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto pb-2">
                              {imgs.map((u, i) => (
                                <button
                                  key={i}
                                  onClick={() => setSelectedImageIndex(i)}
                                  className={`shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                                    i === selectedImageIndex ? 'border-orange-500' : 'border-gray-200 hover:border-gray-300'
                                  }`}
                                >
                                  <img src={u} alt={`${selectedItem.name}-${i}`} className="w-full h-full object-cover" />
                                </button>
                              ))}
                            </div>
                          )}
                          {selectedItem.category && (
                            <div className="flex items-center gap-2 px-4 py-3 bg-white rounded-xl border border-gray-200">
                              <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                              </svg>
                              <span className="text-sm font-semibold text-[#134252]">{selectedItem.category}</span>
                            </div>
                          )}
                        </div>
                      );
                    }
                    return (
                      <div className="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                        <div className="text-center">
                          <svg className="w-24 h-24 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-gray-400">No image available</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Right Column - Information (60%) */}
              <div className="lg:col-span-3 space-y-4 sm:space-y-8">
                {/* Title */}
                <div className="pt-2">
                  <h2 className="text-2xl sm:text-3xl font-bold text-[#134252] mb-4">{selectedItem.name}</h2>
                </div>

                {/* Description */}
                <div className="-mt-2">
                  <p className="text-[#626C71] text-base leading-relaxed">
                    {selectedItem.description || 'No description provided.'}
                  </p>
                </div>

                {/* Info Rows - Flattened */}
                <div className="space-y-5">
                  <div className="flex items-start gap-4 py-1">
                    <svg className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Location Found</p>
                      <p className="text-[#134252] text-base">{selectedItem.location || 'Not specified'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 py-1">
                    <svg className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Date Found</p>
                      <p className="text-[#134252] text-base">
                        {selectedItem.date 
                          ? new Date(selectedItem.date).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })
                          : 'Not specified'
                        }
                      </p>
                    </div>
                  </div>

                  {selectedItem.category && (
                    <div className="flex items-start gap-4 py-1">
                      <svg className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Category</p>
                        <p className="text-[#134252] text-base">{selectedItem.category}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Contact Section - Moved lower */}
                <div className="border-t border-gray-200 pt-8 mt-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-[#134252] text-sm shrink-0">
                      {selectedItem.userId?.name ? selectedItem.userId.name.substring(0, 2).toUpperCase() : 'U'}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Contact Owner</p>
                      <p className="text-[#626C71] text-sm">
                        {selectedItem.contactInfo ? 'Use the buttons at the bottom to get in touch' : 'No contact info available'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Bottom Action Bar */}
          <div className="sticky bottom-0 z-40 bg-white border-t border-gray-200">
            <div className="max-w-7xl mx-auto px-3 py-3 sm:px-4 sm:py-3 lg:px-8">
              <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                {!hasPendingClaim(selectedItem.id || selectedItem._id) && (
                  <button
                    onClick={() => handleStartClaim(selectedItem)}
                    className="flex-1 sm:min-w-40 px-4 py-3 rounded-lg text-sm font-medium border-2 border-sky-600 text-sky-700 hover:bg-sky-50"
                  >
                    Claim This Item
                  </button>
                )}

                {(() => {
                  return (
                    <>
                      <button
                        onClick={async () => {
                          if (!currentUserId) {
                            swalError('Please log in', 'You must be logged in to contact the owner.');
                            return;
                          }
                          setMessageModal({ itemId: selectedItem._id || selectedItem.id, itemName: selectedItem.name || '' });
                        }}
                        disabled={contacting}
                        className={`w-full sm:flex-1 px-4 py-3 rounded-lg text-sm font-medium ${contacting ? 'opacity-60 cursor-not-allowed bg-orange-400 text-white' : 'bg-orange-500 text-white hover:bg-orange-600'}`}
                      >
                        {contacting ? 'Sending...' : 'Send Message'}
                      </button>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </main>

        {/* Message Modal */}
        {messageModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
            <div className="bg-white rounded-xl sm:rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">Send Message</h2>
              <p className="text-sm text-gray-600 mb-4">Contact the finder about: <span className="font-semibold">{messageModal.itemName}</span></p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={messageFormData.name}
                    onChange={(e) => setMessageFormData({ ...messageFormData, name: e.target.value })}
                    placeholder="Your full name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={messageFormData.email}
                    onChange={(e) => setMessageFormData({ ...messageFormData, email: e.target.value })}
                    placeholder="your.email@example.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                  <textarea
                    value={messageFormData.message}
                    onChange={(e) => setMessageFormData({ ...messageFormData, message: e.target.value })}
                    placeholder="Write your message here..."
                    rows="4"
                    maxLength="500"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">{messageFormData.message.length}/500 characters</p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setMessageModal(null);
                    setMessageFormData({ name: '', email: '', message: '' });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!messageFormData.name.trim()) {
                      swalError('Required', 'Please enter your full name');
                      return;
                    }
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!messageFormData.email.trim() || !emailRegex.test(messageFormData.email.trim())) {
                      swalError('Required', 'Please enter a valid email address');
                      return;
                    }
                    if (!messageFormData.message.trim()) {
                      swalError('Required', 'Please write a message');
                      return;
                    }

                    setContacting(true);
                    try {
                      const res = await fetch(API_ENDPOINTS.CONTACT_ITEM(messageModal.itemId), {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                          message: messageFormData.message, 
                          senderId: currentUserId,
                          senderName: messageFormData.name,
                          senderEmail: messageFormData.email
                        }),
                      });
                      const json = await res.json();
                      if (!res.ok) throw new Error(json.message || 'Failed to send message');
                      swalSuccess('Message sent', 'Your message has been sent.');
                      setMessageModal(null);
                      setMessageFormData({ name: '', email: '', message: '' });
                    } catch (err) {
                      swalError('Failed', err.message || 'Failed to send message');
                    } finally {
                      setContacting(false);
                    }
                  }}
                  disabled={contacting}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${contacting ? 'opacity-60 cursor-not-allowed bg-orange-400 text-white' : 'bg-orange-600 text-white hover:bg-orange-700'}`}
                >
                  {contacting ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Claim Request Modal (unchanged) */}
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
                      onChange={(e) => {
                        const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
                        if (!file) {
                          setClaimImage(null);
                          return;
                        }
                        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
                        if (!allowedTypes.includes(file.type)) {
                          setError('Supporting Photo must be an image file (JPG, PNG, etc.)');
                          setClaimImage(null);
                          return;
                        }
                        const maxSizeBytes = 5 * 1024 * 1024;
                        if (file.size > maxSizeBytes) {
                          setError('Supporting Photo exceeds maximum allowed size.');
                          setClaimImage(null);
                          return;
                        }
                        setError('');
                        setClaimImage(file);
                      }}
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
                    className={`px-4 py-2 rounded-md text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 ${
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
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
        {/* Header Section */}
        <header className="max-w-7xl mx-auto mb-8">
          {/* Title */}
          <div className="mb-6">
            <h1 className="text-gray-900 text-3xl font-semibold mb-1">
              Found Items
            </h1>
            <p className="text-gray-600 text-sm">
              Browse items that have been found and claim what belongs to you
            </p>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-start gap-2">
              <svg className="w-5 h-5 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              <span className="text-sm">{success}</span>
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-2">
              <svg className="w-5 h-5 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
              </svg>
              <span className="text-sm">{error}</span>
            </div>
          )}
  
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
            {/* Search Bar */}
            <div className="flex-1 max-w-2xl">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg 
                    className="h-5 w-5 text-gray-400" 
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
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg 
                           text-gray-900 placeholder-gray-500 text-sm
                           focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  placeholder="Search by item name, description, or location..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/found')}
                className="flex-1 lg:flex-none lg:w-32 px-4 py-2.5 rounded-lg font-medium text-sm 
                         bg-orange-500 text-white hover:bg-orange-600"
              >
                Found Items
              </button>
              <button
                onClick={() => navigate('/lost')}
                className="flex-1 lg:flex-none lg:w-32 px-4 py-2.5 rounded-lg font-medium text-sm 
                         bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Lost Items
              </button>
            </div>
          </div>

          {/* Category Filters */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <div className="flex flex-wrap gap-2">
              {['All', 'Electronics', 'Personal Items', 'Bags & Wallets', 'Keys', 'Clothing', 'Accessories', 'Books & Documents', 'Sports Equipment', 'Jewelry', 'Other'].map((category) => (
                <button
                  key={category}
                  onClick={() => setCategoryFilter(category)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                    categoryFilter === category
                      ? 'bg-orange-500 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
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
          <div className="mb-4 flex items-center justify-between">
            <p className="text-gray-600 text-sm">
              {filtered.length === 0 ? 'No items found' : `${filtered.length} ${filtered.length === 1 ? 'item' : 'items'}`}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.length === 0 ? (
              <div className="col-span-full">
                <div className="max-w-md mx-auto text-center py-16">
                  <div className="mb-4">
                    <svg 
                      className="w-16 h-16 mx-auto text-gray-400" 
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
                  <h3 className="text-gray-900 text-lg font-medium mb-1">No items found</h3>
                  <p className="text-gray-600 text-sm">
                    {search ? 'Try adjusting your search terms or filters' : 'No found items have been reported yet'}
                  </p>
                </div>
              </div>
            ) : (
              filtered.map((item) => {
                // Get initials for avatar
                const userName = item.userId?.name || 'User';
                const initials = userName.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();
                const primaryImage = item.images && item.images.length > 0 ? item.images[0] : item.imageUrl;
                return (
                  <div
                    key={item.id || item._id}
                    className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-gray-300 transition-colors flex flex-col"
                  >
                    {/* Image */}
                    <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden flex items-center justify-center">
                      {primaryImage ? (
                        <img
                          src={primaryImage}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4 flex flex-col gap-3 grow">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="flex-1 text-gray-900 font-medium text-sm leading-tight line-clamp-2">
                          {item.name || 'Untitled item'}
                        </h3>
                        {item.category && (
                          <span className="text-xs text-gray-500 shrink-0">
                            {item.category}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleViewDetails(item)}
                        className="w-full py-2 px-4 rounded-md text-sm font-medium bg-orange-500 text-white hover:bg-orange-600"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>

      {/* Full-Page Claim Request View */}
      {viewMode === 'claim' && selectedItem && (
        <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
          {/* Sticky Top Bar with Back Button */}
          <div className="sticky top-0 z-10 px-4 py-4 shadow-md" style={{ background: 'linear-gradient(to bottom right, #fff7ed, #fef2f2, #fffbeb)' }}>
            <div className="max-w-4xl mx-auto flex items-center gap-3">
              <button
                onClick={handleBackToDetails}
                className="flex items-center gap-2 text-[#134252] hover:bg-orange-100/50 px-3 py-1.5 rounded-lg transition-colors font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Back</span>
              </button>
              <div className="flex-1">
                <h1 className="text-xl font-bold text-[#134252]">Claim Request</h1>
                <p className="text-gray-600 text-sm mt-0.5">Submit proof of ownership</p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-4xl mx-auto px-4 py-6 pb-32">
            {/* Item Summary Card */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 mb-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">Item Details</h2>
              <div className="flex gap-4">
                {selectedItem.images && selectedItem.images.length > 0 ? (
                  <img 
                    src={selectedItem.images[0]} 
                    alt={selectedItem.name}
                    className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                  />
                ) : selectedItem.imageUrl ? (
                  <img 
                    src={selectedItem.imageUrl} 
                    alt={selectedItem.name}
                    className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-lg">{selectedItem.name}</h3>
                  {selectedItem.category && (
                    <p className="text-sm text-gray-600 mt-1">{selectedItem.category}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Claim Form */}
            <form onSubmit={handleSubmitClaim} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Proof of Ownership</h2>
                <p className="text-gray-600 text-sm mb-4">
                  Please provide detailed information to prove this item belongs to you. Include unique features, purchase receipts, serial numbers, or any identifying information.
                </p>
                
                <textarea
                  value={proofOfOwnership}
                  onChange={(e) => setProofOfOwnership(e.target.value)}
                  required
                  rows={6}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Example: I can provide the original purchase receipt from ABC Store dated March 15, 2024. The item has a unique scratch on the bottom left corner and my initials 'J.D.' engraved on the back."
                />
              </div>

              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Supporting Photo (Optional)</h2>
                <p className="text-gray-600 text-sm mb-4">
                  Upload a photo that helps verify your ownership (e.g., receipt, serial number, unique markings).
                </p>
                
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setClaimImage(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
                  className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                />
                
                {claimImage && (
                  <div className="mt-4">
                    <img
                      src={URL.createObjectURL(claimImage)}
                      alt="preview"
                      className="w-full max-h-64 object-contain rounded-lg border border-gray-200 bg-gray-50"
                    />
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* Sticky Bottom Bar with Action Buttons */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-10">
            <div className="max-w-4xl mx-auto px-4 py-4 flex gap-3">
              <button
                type="button"
                onClick={handleBackToDetails}
                disabled={loading}
                className="flex-1 py-3 rounded-lg font-semibold text-sm border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmitClaim}
                disabled={loading}
                className={`flex-1 py-3 rounded-lg text-sm font-semibold bg-orange-500 text-white hover:bg-orange-600 ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Submitting...' : 'Submit Claim Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FoundItems;
