import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from "../layout/navbar";
import { API_ENDPOINTS } from '../../utils/constants';

const LostItemManagement = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
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
    // Exclude deleted, archived, and claimed items from user view
    if (item.status === 'Deleted' || item.status === 'Archived' || item.status === 'Claimed') {
      return false;
    }
    
    const matchesSearch = item.name?.toLowerCase().includes(search.toLowerCase()) ||
                         item.description?.toLowerCase().includes(search.toLowerCase()) ||
                         item.location?.toLowerCase().includes(search.toLowerCase());
    
    return matchesSearch;
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
      
      <main className="min-h-screen bg-[#FCFCF9] px-4 py-8 sm:px-6 lg:px-8">
        {/* Header Section */}
        <header className="max-w-7xl mx-auto mb-8">
  <h1 className="text-[#134252] text-3xl font-semibold mb-6">
    Lost Items
  </h1>
  
  <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
    {/* Search Bar */}
    <div className="w-full sm:w-auto sm:flex-1 max-w-md">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg 
            className="h-5 w-5 text-[#626C71]/60" 
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
          className="w-full pl-10 pr-4 py-2.5 border border-[#5E5240]/20 rounded-lg 
                   bg-white text-[#134252] placeholder-[#626C71]/60 text-sm
                   focus:outline-none focus:ring-2 focus:ring-[#21808D] focus:border-transparent
                   transition-all shadow-sm"
          placeholder="Search lost items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
    </div>

    {/* Filter Buttons */}
    <div className="flex gap-2">
      <button
        onClick={() => navigate('/found')}
        className="w-40 px-4 py-2.5 rounded-lg font-medium text-sm transition-all bg-[#8C1007]/10 text-[#134252] hover:bg-[#8C1007]/20 border border-[#8C1007]/10"
      >
        Found
      </button>
      <button
        onClick={() => navigate('/lost')}
        className="w-40 px-4 py-2.5 rounded-lg font-medium text-sm transition-all bg-[#C0152F] text-white shadow-sm"
      >
        Lost
      </button>
    </div>
  </div>
</header>


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
                <p className="text-[#134252] text-lg font-medium mb-2">No items found</p>
                <p className="text-[#626C71] text-sm">
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
                        <div className="w-7 h-7 rounded-full bg-[#C0152F] flex items-center justify-center text-white text-xs font-semibold">
                          {item.userId?.name ? item.userId.name.substring(0, 2).toUpperCase() : 'U'}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-[#134252] truncate">
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
                      <h3 className="text-[#134252] font-semibold text-sm flex-1">
                        {item.name}
                      </h3>
                      <span className="text-[#626C71] text-xs whitespace-nowrap ml-2">
                        {item.date ? new Date(item.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        }) : ''}
                      </span>
                    </div>

                    {/* Location */}
                    <p className="text-[#626C71] text-xs mb-1.5">
                      {item.location}
                    </p>

                    {/* Description */}
                    <p className="text-[#134252] text-xs mb-2 line-clamp-2 flex-grow">
                      {item.description}
                    </p>

                    {/* Status Badge */}
                    <div className="mb-2">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          item.status === 'Pending'
                            ? 'bg-[#FFC107]/20 text-[#F57C00]'
                            : item.status === 'Claimed'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-[#FF5459]/20 text-[#C0152F]'
                        }`}
                      >
                        {item.status || 'Unclaimed'}
                      </span>
                    </div>

                    {/* View Details Button */}
                    <button
                      onClick={() => handleViewDetails(item)}
                      className="w-full py-2 rounded-lg font-medium text-xs transition-all bg-[#C0152F] text-white hover:bg-[#A01327] active:bg-[#8B1122] shadow-sm hover:shadow"
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

      {/* Item Detail Modal */}
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
            <div className="sticky top-0 bg-gradient-to-r from-[#C0152F] to-[#8C1007] text-white px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Lost Item Details</h2>
              <button 
                onClick={handleCloseModal}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Item Image */}
              {selectedItem.imageUrl && (
                <div className="w-full aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <img 
                    src={selectedItem.imageUrl} 
                    alt={selectedItem.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Item Information */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-2xl font-semibold text-[#134252] mb-2">
                    {selectedItem.name}
                  </h3>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    selectedItem.status === 'Pending'
                      ? 'bg-[#FFC107]/20 text-[#F57C00]'
                      : selectedItem.status === 'Claimed'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-[#FF5459]/20 text-[#C0152F]'
                  }`}>
                    {selectedItem.status || 'Unclaimed'}
                  </span>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-[#134252] mb-1">
                    Description
                  </label>
                  <p className="text-[#626C71] text-sm leading-relaxed">
                    {selectedItem.description || 'No description provided'}
                  </p>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-semibold text-[#134252] mb-1">
                    Location
                  </label>
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-[#C0152F] mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-[#626C71] text-sm">
                      {selectedItem.location || 'Location not specified'}
                    </p>
                  </div>
                </div>

                {/* Date Lost */}
                <div>
                  <label className="block text-sm font-semibold text-[#134252] mb-1">
                    Date Lost
                  </label>
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-[#C0152F] mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-[#626C71] text-sm">
                      {selectedItem.date 
                        ? new Date(selectedItem.date).toLocaleDateString('en-US', { 
                            weekday: 'long',
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })
                        : 'Date not specified'
                      }
                    </p>
                  </div>
                </div>

                {/* Category */}
                {selectedItem.category && (
                  <div>
                    <label className="block text-sm font-semibold text-[#134252] mb-1">
                      Category
                    </label>
                    <p className="text-[#626C71] text-sm">
                      {selectedItem.category}
                    </p>
                  </div>
                )}

                {/* Contact Information - Highlighted Section */}
                {selectedItem.contactInfo && (
                  <div className="bg-[#C0152F]/5 border-2 border-[#C0152F]/20 rounded-lg p-4">
                    <label className="flex items-center gap-2 text-sm font-semibold text-[#C0152F] mb-2">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Contact Information
                    </label>
                    <p className="text-[#134252] text-sm font-medium leading-relaxed">
                      {selectedItem.contactInfo}
                    </p>
                    <p className="text-[#626C71] text-xs mt-2">
                      Please reach out to the owner using the contact details above if you have found this item.
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2.5 rounded-lg font-medium text-sm bg-gray-100 text-[#134252] hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
                {selectedItem.contactInfo && (
                  <a
                    href={`mailto:${selectedItem.contactInfo.includes('@') ? selectedItem.contactInfo : ''}${selectedItem.contactInfo.includes('tel:') ? selectedItem.contactInfo : ''}`}
                    className="flex-1 px-4 py-2.5 rounded-lg font-medium text-sm bg-[#C0152F] text-white hover:bg-[#A01327] transition-colors text-center"
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
