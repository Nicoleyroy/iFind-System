import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from "../layout/navbar";
import { API_ENDPOINTS } from '../../utils/constants';
import { confirm, success as swalSuccess, error as swalError, inputPrompt, inputTextarea } from '../../utils/swal';
import Swal from 'sweetalert2';

const LostItemManagement = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null); // For detail modal
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [marking, setMarking] = useState(false);
  const [actionError, setActionError] = useState('');
  const [contacting, setContacting] = useState(false);
  const [messageFormData, setMessageFormData] = useState({ name: '', email: '', message: '' });
  const [messageModal, setMessageModal] = useState(null); // { itemId, itemName }
  
  useEffect(() => {
    const load = async () => {
      try {
        // Fetch only lost items
        const res = await fetch(API_ENDPOINTS.LOST_ITEMS);
        const json = await res.json();
        setItems(Array.isArray(json.data) ? json.data : []);
      } catch (e) {
        console.warn('Failed to load items', e);
      }
    };
    load();
    // get current user id from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUserId(user._id || user.id || null);
      } catch (e) {
        console.warn('Failed to parse user from localStorage', e);
      }
    }
  }, []);

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

  const handleViewDetails = (item) => {
    setSelectedItem(item);
    setSelectedImageIndex(0);
  };

  const handleCloseModal = () => {
    setSelectedItem(null);
    setSelectedImageIndex(0);
  };

  const handleMarkReturned = async () => {
    if (!selectedItem) return;
    // only the owner can mark returned
    const ownerId = selectedItem.userId?._id || selectedItem.userId?.id || selectedItem.userId;
    if (!currentUserId || String(ownerId) !== String(currentUserId)) {
      setActionError('Only the owner who reported this item can mark it as returned.');
      setTimeout(() => setActionError(''), 4000);
      return;
    }

    const ok = await confirm('Mark this lost item as Returned?', 'This will update the post status to Returned.');
    if (!ok) return;

    setMarking(true);
    setActionError('');
    try {
      const res = await fetch(API_ENDPOINTS.LOST_ITEM_BY_ID(selectedItem._id || selectedItem.id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Returned' }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to update item');

      // update local state
      const updated = json.data;
      setSelectedItem(updated);
      setItems(prev => prev.map(it => (String(it._id || it.id) === String(updated._id || updated.id) ? updated : it)));
    } catch (err) {
      setActionError(err.message || 'Failed to mark returned');
      setTimeout(() => setActionError(''), 4000);
    } finally {
      setMarking(false);
    }
  };

  const handleContactOwner = async (mode) => {
    if (!selectedItem) return;

    const info = selectedItem.contactInfo || '';
    const isEmail = info.includes('@');
    const isTel = /\d{6,}/.test(info);

    // Call
    if (mode === 'call') {
      if (!isTel) {
        swalError('No phone number', 'Owner did not provide a phone number');
        return;
      }
      const tel = `tel:${info.replace(/[^0-9+]/g, '')}`;
      window.open(tel, '_self');
      return;
    }

    // Email via mailto
    if (mode === 'email') {
      if (!isEmail) {
        swalError('No email', 'Owner did not provide an email address');
        return;
      }
      const subject = encodeURIComponent(`Regarding your lost item: ${selectedItem.name || ''}`);
      const body = encodeURIComponent(`Hi ${selectedItem.userId?.name || ''},\n\nI believe I found your item: ${selectedItem.name || ''}.\n\n`);
      window.location.href = `mailto:${info}?subject=${subject}&body=${body}`;
      return;
    }

    // Default: send mediated message (message box + server POST)
    if (!currentUserId) {
      swalError('Please log in', 'You must be logged in to send a message to the owner.');
      return;
    }

    // Show quick contact modal with masked contact info and Call/Send Message actions
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
      // Open tel link
      const tel = `tel:${info.replace(/[^0-9+]/g, '')}`;
      window.open(tel, '_self');
      return;
    }

    if (!result.isConfirmed) return;

    // Prompt for message textarea with prefilled body
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
  };

  // Helpers to mask contact info
  const maskEmail = (email) => {
    const [local, domain] = email.split('@');
    const maskedLocal = local.length > 2 ? `${local[0]}***${local.slice(-1)}` : `${local[0]}*`;
    const [domName, domTld] = domain.split('.');
    const maskedDom = domName.length > 2 ? `${domName[0]}***${domName.slice(-1)}` : `${domName[0]}*`;
    return `${maskedLocal}@${maskedDom}.${domTld}`;
  };

  const maskPhone = (phone) => {
    const digits = phone.replace(/[^0-9+]/g, '');
    if (digits.length <= 4) return '***';
    const visible = digits.slice(-4);
    return `${digits.slice(0, digits.length - 8)}***${visible}`;
  };

  // If viewing item details, show full-page view instead of grid
  if (selectedItem) {
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
          <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Left Column - Image (40%) */}
              <div className="lg:col-span-2">
                <div className="sticky top-24">
                  {(() => {
                    const imgs = selectedItem.images && selectedItem.images.length > 0 ? selectedItem.images : (selectedItem.imageUrl ? [selectedItem.imageUrl] : []);
                    if (imgs.length > 0) {
                      return (
                        <div className="space-y-4">
                          <div className="relative w-full aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl overflow-hidden shadow-lg">
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
                                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                                    i === selectedImageIndex ? 'border-orange-500 scale-105' : 'border-gray-200 hover:border-gray-300'
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
                      <div className="w-full aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center shadow-lg">
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
              <div className="lg:col-span-3 space-y-6">
                {/* Title */}
                <div>
                  <h2 className="text-3xl font-bold text-[#134252] mb-2">{selectedItem.name}</h2>
                </div>

                {/* Description */}
                <div>
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
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Last Seen Location</p>
                      <p className="text-[#134252] text-base">{selectedItem.location || 'Not specified'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 py-1">
                    <svg className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Date Lost</p>
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

                {actionError && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-4 rounded-xl">{actionError}</div>
                )}
              </div>
            </div>
          </div>

          {/* Sticky Bottom Action Bar */}
          <div className="sticky bottom-0 z-40 bg-white/80 backdrop-blur-xl border-t border-white/20">
            <div className="max-w-7xl mx-auto px-4 py-3.5 sm:px-6 lg:px-8">
              <div className="flex flex-wrap gap-2.5">
                {selectedItem.contactInfo && (
                  <button
                    onClick={() => {
                      if (!currentUserId) {
                        swalError('Please log in', 'You must be logged in to contact the owner.');
                        return;
                      }
                      setMessageModal({ itemId: selectedItem._id || selectedItem.id, itemName: selectedItem.name || '' });
                    }}
                    disabled={contacting}
                    className={`flex-1 min-w-[160px] px-5 py-2.5 rounded-lg font-medium text-sm transition-colors ${contacting ? 'opacity-60 cursor-not-allowed bg-orange-400 text-white' : 'bg-orange-600 text-white hover:bg-orange-700'}`}
                  >
                    {contacting ? 'Sending...' : 'Send Message'}
                  </button>
                )}

                {selectedItem && currentUserId && String(currentUserId) === String(selectedItem.userId?._id || selectedItem.userId?.id || selectedItem.userId) && selectedItem.status !== 'Returned' && (
                  <button
                    onClick={handleMarkReturned}
                    disabled={marking}
                    className={`flex-1 min-w-[160px] px-5 py-2.5 rounded-lg font-medium text-sm text-white transition-colors ${marking ? 'opacity-60 cursor-not-allowed bg-green-400' : 'bg-green-600 hover:bg-green-700'}`}
                  >
                    {marking ? 'Updating...' : 'Mark Returned'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Message Modal */}
        {messageModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
              <h2 className="text-2xl font-bold text-gray-800 mb-1">Send Message</h2>
              <p className="text-sm text-gray-600 mb-4">Contact about: <span className="font-semibold">{messageModal.itemName}</span></p>
              
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
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-amber-50 px-4 py-12 sm:px-6 lg:px-8">
        {/* Header Section */}
        <header className="max-w-7xl mx-auto mb-12">
          {/* Title with decorative element */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex-shrink-0">
              <div className="w-1.5 h-12 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full shadow-lg"></div>
            </div>
            <div>
              <h1 className="text-[#0F172A] text-4xl font-bold tracking-tight">
                Lost Items
              </h1>
              <p className="text-[#475569] text-sm mt-1">
                Browse items that people are looking for
              </p>
            </div>
          </div>
  
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
                  className="w-full pl-12 pr-4 py-3.5 bg-white/70 backdrop-blur-md border-2 border-blue-600 rounded-xl 
                           text-[#0F172A] placeholder-[#64748B] text-sm shadow-lg shadow-orange-500/5
                           focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:bg-white/90
                           transition-all hover:shadow-xl hover:shadow-orange-500/10"
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
                         transition-all duration-200 bg-white/70 backdrop-blur-md text-[#0F172A] 
                         border-2 border-transparent hover:bg-orange-500 hover:text-white shadow-lg hover:shadow-xl hover:bg-orange-500
                         active:scale-95 active:border-blue-600"
              >
                Found Items
              </button>
              <button
                onClick={() => navigate('/lost')}
                className="flex-1 lg:flex-none lg:w-36 px-6 py-3.5 rounded-xl font-semibold text-sm 
                         transition-all duration-200 bg-gradient-to-r from-orange-500 to-orange-600 
                         text-white shadow-lg shadow-orange-500/50 hover:shadow-xl hover:shadow-orange-500/60 hover:bg-orange-600
                         hover:scale-105 active:scale-95"
              >
                Lost Items
              </button>
            </div>
          </div>

          {/* Category Filters */}
          <div className="mt-6">
            <label className="block text-sm font-semibold text-[#0F172A] mb-3">Filter by Category</label>
            <div className="flex flex-wrap gap-2">
              {['All', 'Electronics', 'Personal Items', 'Bags & Wallets', 'Keys', 'Clothing', 'Accessories', 'Books & Documents', 'Sports Equipment', 'Jewelry', 'Other'].map((category) => (
                <button
                  key={category}
                  onClick={() => setCategoryFilter(category)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                    categoryFilter === category
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-blue-900/20 scale-105 border-2 border-blue-600'
                      : 'bg-white/70 backdrop-blur-md text-[#475569] border border-transparent hover:bg-orange-500 hover:text-white shadow-md hover:shadow-lg'
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
              {filtered.length === 0 ? 'No items found matching your criteria' : `Showing ${filtered.length} ${filtered.length === 1 ? 'item' : 'items'}`}
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
                        className="w-12 h-12 text-orange-600" 
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
                    </div>
                    <div className="absolute inset-0 bg-orange-400/20 blur-3xl -z-10 rounded-full"></div>
                  </div>
                  <h3 className="text-[#134252] text-xl font-bold mb-2">No items found matching your criteria</h3>
                  <p className="text-[#626C71] text-sm leading-relaxed">
                    {search ? 'Try adjusting your search terms or clearing filters' : 'No lost items have been reported yet'}
                  </p>
                </div>
              </div>
            ) : (
              filtered.map((item) => {
                const userName = item.userId?.name || 'User';
                const initials = userName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
                const primaryImage = item.images && item.images.length > 0 ? item.images[0] : item.imageUrl;
                return (
                  <div
                    key={item.id || item._id}
                    className="group bg-white/80 backdrop-blur-xl rounded-2xl overflow-hidden shadow-xl shadow-orange-500/15 hover:shadow-2xl hover:shadow-orange-500/25 transition-all duration-300 flex flex-col hover:-translate-y-2"
                  >
                    {/* Top bar: initials only and status */}
                    <div className="flex items-center justify-between px-4 pt-4 pb-2">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-[#134252] text-xs">
                        {initials}
                      </div>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold backdrop-blur-sm shadow-lg ${
                          item.status === 'Pending'
                            ? 'bg-orange-500/90 text-white'
                            : item.status === 'Claimed'
                            ? 'bg-orange-500/90 text-white'
                            : 'bg-orange-500/90 text-white'
                        }`}
                      >
                        {item.status || 'Active'}
                      </span>
                    </div>

                    {/* Image */}
                    <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden flex items-center justify-center mx-4 rounded-xl">
                      {primaryImage ? (
                        <img
                          src={primaryImage}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full">
                          <div className="text-center">
                            <svg className="w-16 h-16 mx-auto text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-xs text-gray-400">No image</p>
                          </div>
                        </div>
                      )}

                      {item.category && (
                        <div className="absolute bottom-3 left-3">
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold bg-white/80 text-[#134252] border border-gray-200 shadow-sm">
                            {item.category}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Name and CTA */}
                    <div className="p-4 flex flex-col gap-3 grow">
                      <h3 className="flex-1 text-[#134252] font-bold text-base leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {item.name || 'Untitled item'}
                      </h3>
                      <button
                        onClick={() => handleViewDetails(item)}
                        className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-blue-900/15 hover:shadow-xl hover:shadow-blue-900/25 hover:scale-105 active:scale-95"
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

        {/* Message Modal */}
        {messageModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
              <h2 className="text-2xl font-bold text-gray-800 mb-1">Send Message</h2>
              <p className="text-sm text-gray-600 mb-4">Contact about: <span className="font-semibold">{messageModal.itemName}</span></p>
              
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
      </main>
    </>
  );
};

export default LostItemManagement;
