import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from "../layout/navbar";
import { API_ENDPOINTS } from '../../utils/constants';

const LostItemManagement = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [items, setItems] = useState([]); // Empty array, ready for backend data
  useEffect(() => {
    const load = async () => {
      try {
        // Fetch only lost items
        const res = await fetch(`${API_ENDPOINTS.ITEMS}?type=lost`);
        const json = await res.json();
        setItems(Array.isArray(json.data) ? json.data : []);
      } catch (e) {
        console.warn('Failed to load items', e);
      }
    };
    load();
  }, []);

  // Filter items based on search
  const filtered = items.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(search.toLowerCase()) ||
                         item.description?.toLowerCase().includes(search.toLowerCase()) ||
                         item.location?.toLowerCase().includes(search.toLowerCase());
    
    return matchesSearch;
  });

  const handleClaim = (itemId) => {
    alert(`Claim request submitted for item #${itemId}`);
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
        onClick={() => navigate('/your-posts')}
        className="w-40 px-4 py-2.5 rounded-lg font-medium text-sm transition-all bg-[#8C1007]/10 text-[#134252] hover:bg-[#8C1007]/20 border border-[#8C1007]/10"
      >
        Your Posts
      </button>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  {/* Item Image */}
                  <div className="aspect-square bg-gray-100 overflow-hidden">
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
                  <div className="p-4 flex flex-col flex-grow">
                    {/* Title and Date */}
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-[#134252] font-semibold text-base flex-1">
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
                    <p className="text-[#626C71] text-sm mb-2">
                      {item.location}
                    </p>

                    {/* Description */}
                    <p className="text-[#134252] text-sm mb-3 line-clamp-2 flex-grow">
                      {item.description}
                    </p>

                    {/* Status Badge */}
                    <div className="mb-3">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
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

                    {/* Claim Button */}
                    <button
                      onClick={() => handleClaim(item.id || item._id)}
                      disabled={item.status === 'Claimed'}
                      className={`w-full py-2.5 rounded-lg font-medium text-sm transition-all ${
                        item.status === 'Claimed'
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-[#C0152F] text-white hover:bg-[#A01327] active:bg-[#8B1122] shadow-sm hover:shadow'
                      }`}
                    >
                      {item.status === 'Claimed' ? 'Already Claimed' : 'Claim Item'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </>
  );
};

export default LostItemManagement;
