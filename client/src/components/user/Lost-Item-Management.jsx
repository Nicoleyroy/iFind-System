import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from "../layout/navbar";
import { API_ENDPOINTS } from '../../utils/constants';

const LostItemManagement = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null); // For detail modal
  
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
  }, []);

  // Filter items based on search and exclude deleted/archived items
  const filtered = items.filter(item => {
    // Exclude items without valid user (orphaned posts)
    if (!item.userId) {
      return false;
    }
    
    // Exclude deleted, archived, and claimed items from user view
    if (item.status === 'Deleted' || item.status === 'Archived' || item.status === 'Claimed') {
      return false;
    }
    
    const matchesSearch = item.name?.toLowerCase().includes(search.toLowerCase()) ||
                         item.description?.toLowerCase().includes(search.toLowerCase()) ||
                         item.location?.toLowerCase().includes(search.toLowerCase());
    
    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const handleViewDetails = (item) => {
    setSelectedItem(item);
  };

  const handleCloseModal = () => {
    setSelectedItem(null);
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
                Lost Items
              </h1>
              <p className="text-[#626C71] text-sm mt-1">
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
                         transition-all duration-200 bg-white text-[#134252] hover:bg-gray-50 
                         border-2 border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md
                         active:scale-95"
              >
                Found Items
              </button>
              <button
                onClick={() => navigate('/lost')}
                className="flex-1 lg:flex-none lg:w-36 px-6 py-3.5 rounded-xl font-semibold text-sm 
                         transition-all duration-200 bg-gradient-to-r from-orange-500 to-orange-600 
                         text-white shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40
                         hover:from-orange-600 hover:to-orange-700 active:scale-95"
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
                          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" 
                        />
                      </svg>
                    </div>
                    <div className="absolute inset-0 bg-orange-400/20 blur-3xl -z-10 rounded-full"></div>
                  </div>
                  <h3 className="text-[#134252] text-xl font-bold mb-2">No items found</h3>
                  <p className="text-[#626C71] text-sm leading-relaxed">
                    {search ? 'Try adjusting your search terms or clearing filters' : 'No lost items have been reported yet'}
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
                    {item.imageUrl ? (
                      <img 
                        src={item.imageUrl} 
                        alt={item.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                      />
                    ) : (
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
                    )}
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
                        {item.status || 'Unclaimed'}
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

                    {/* View Details Button - Enhanced */}
                    <button
                      onClick={() => handleViewDetails(item)}
                      className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 
                               bg-gradient-to-r from-orange-500 to-orange-600 text-white 
                               shadow-md shadow-orange-500/30 hover:shadow-lg hover:shadow-orange-500/40
                               hover:from-orange-600 hover:to-orange-700 active:scale-95
                               group-hover:shadow-xl"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Item Detail Modal - Modern Design */}
      {selectedItem && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn"
          onClick={handleCloseModal}
        >
          <div 
            className="bg-white rounded-3xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header - Modern Gradient */}
            <div className="relative bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 text-white px-6 py-4 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Item Details</h2>
                    <p className="text-orange-100 text-xs">Lost item information</p>
                  </div>
                </div>
                <button 
                  onClick={handleCloseModal}
                  className="w-9 h-9 flex items-center justify-center bg-white/10 hover:bg-white/20 
                           rounded-full transition-all duration-200 active:scale-95 backdrop-blur-sm"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="overflow-y-auto flex-1">
              <div className="p-6">
                {/* Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column - Image */}
                  <div className="space-y-4">
                    {selectedItem.imageUrl ? (
                      <div className="relative w-full aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden shadow-md">
                        <img 
                          src={selectedItem.imageUrl} 
                          alt={selectedItem.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 right-3">
                          <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm ${
                            selectedItem.status === 'Pending'
                              ? 'bg-yellow-500/90 text-white'
                              : selectedItem.status === 'Claimed'
                              ? 'bg-green-500/90 text-white'
                              : 'bg-orange-500/90 text-white'
                          }`}>
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                            {selectedItem.status || 'Unclaimed'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
                        <svg className="w-20 h-20 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Right Column - Details */}
                  <div className="space-y-4">
                    {/* Title */}
                    <div>
                      <h3 className="text-2xl font-bold text-[#134252] mb-1">
                        {selectedItem.name}
                      </h3>
                    </div>

                    {/* Description */}
                    <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                        </svg>
                        <label className="text-xs font-bold text-orange-900">Description</label>
                      </div>
                      <p className="text-[#626C71] text-sm leading-relaxed">
                        {selectedItem.description || 'No description provided'}
                      </p>
                    </div>

                    {/* Info Grid */}
                    <div className="space-y-3">
                      {/* Location */}
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="flex items-start gap-3">
                          <svg className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <div className="flex-1 min-w-0">
                            <label className="block text-xs font-bold text-[#134252] mb-0.5">Last Seen Location</label>
                            <p className="text-[#626C71] text-sm">{selectedItem.location || 'Not specified'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Date */}
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="flex items-start gap-3">
                          <svg className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <div className="flex-1 min-w-0">
                            <label className="block text-xs font-bold text-[#134252] mb-0.5">Date Lost</label>
                            <p className="text-[#626C71] text-sm">
                              {selectedItem.date 
                                ? new Date(selectedItem.date).toLocaleDateString('en-US', { 
                                    weekday: 'long',
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                  })
                                : 'Not specified'
                              }
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Category */}
                      {selectedItem.category && (
                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                          <div className="flex items-start gap-3">
                            <svg className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            <div className="flex-1 min-w-0">
                              <label className="block text-xs font-bold text-[#134252] mb-0.5">Category</label>
                              <p className="text-[#626C71] text-sm">{selectedItem.category}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Contact Information */}
                    {selectedItem.contactInfo && (
                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shrink-0 shadow-md">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <label className="block text-xs font-bold text-orange-900 mb-1">Contact Information</label>
                            <p className="text-[#134252] font-semibold text-sm mb-1 break-all">
                              {selectedItem.contactInfo}
                            </p>
                            <p className="text-orange-700 text-xs leading-relaxed">
                              Reach out if you have found this item
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 px-6 py-4 shrink-0 bg-gray-50">
              <div className="flex gap-3">
                <button
                  onClick={handleCloseModal}
                  className="flex-1 px-5 py-2.5 rounded-xl font-semibold text-sm 
                           bg-white border-2 border-gray-200 text-[#134252] hover:bg-gray-50 
                           transition-all duration-200 active:scale-95"
                >
                  Close
                </button>
                {selectedItem.contactInfo && (
                  <a
                    href={`mailto:${selectedItem.contactInfo.includes('@') ? selectedItem.contactInfo : ''}${selectedItem.contactInfo.includes('tel:') ? selectedItem.contactInfo : ''}`}
                    className="flex-1 px-5 py-2.5 rounded-xl font-semibold text-sm text-center
                             bg-gradient-to-r from-orange-500 to-orange-600 text-white 
                             shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40
                             hover:from-orange-600 hover:to-orange-700 
                             transition-all duration-200 active:scale-95"
                  >
                    Contact Owner
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LostItemManagement;
