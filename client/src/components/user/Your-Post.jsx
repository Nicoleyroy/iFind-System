import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from "../layout/navbar";
import { API_ENDPOINTS } from '../../utils/constants';
import { uploadToCloudinary } from '../../utils/cloudinary';

const YourPosts = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [items, setItems] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    location: '',
    date: '',
    contactInfo: '',
    description: '',
    type: 'lost',
    imageUrl: '',
  });
  const [imageFile, setImageFile] = useState(null);
  
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

  const loadItems = async () => {
    try {
      // Fetch all items
      const res = await fetch(API_ENDPOINTS.ITEMS);
      const json = await res.json();
      setItems(Array.isArray(json.data) ? json.data : []);
    } catch (e) {
      console.warn('Failed to load items', e);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  // Filter items to only show posts uploaded by the current user
  const filtered = items.filter(item => {
    if (!currentUserId) {
      // If no user is logged in, don't show any items
      return false;
    }
    
    // Match userId - handle both string and ObjectId comparisons
    const itemUserId = item.userId ? String(item.userId) : null;
    const userUserId = String(currentUserId);
    const matchesUser = itemUserId === userUserId;
    
    const matchesSearch = item.name?.toLowerCase().includes(search.toLowerCase()) ||
                         item.description?.toLowerCase().includes(search.toLowerCase()) ||
                         item.location?.toLowerCase().includes(search.toLowerCase());
    
    return matchesUser && matchesSearch;
  });

  const handleEdit = (item) => {
    setEditingItem(item);
    setEditForm({
      name: item.name || '',
      location: item.location || '',
      date: item.date ? new Date(item.date).toISOString().split('T')[0] : '',
      contactInfo: item.contactInfo || '',
      description: item.description || '',
      type: item.type || 'lost',
      imageUrl: item.imageUrl || '',
    });
    setImageFile(null);
    setError('');
    setSuccess('');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      let imageUrl = editForm.imageUrl;
      
      // Upload new image if a file was selected
      if (imageFile) {
        imageUrl = await uploadToCloudinary(imageFile);
      }

      const payload = {
        name: editForm.name,
        location: editForm.location,
        date: editForm.date,
        contactInfo: editForm.contactInfo,
        description: editForm.description,
        type: editForm.type,
        imageUrl,
      };

      const res = await fetch(API_ENDPOINTS.ITEM_BY_ID(editingItem._id || editingItem.id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json && json.message ? json.message : 'Failed to update item');
      
      setSuccess('Item updated successfully!');
      setEditingItem(null);
      await loadItems(); // Reload items
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(`Failed to update: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (itemId) => {
    setError('');
    setLoading(true);
    
    try {
      const res = await fetch(API_ENDPOINTS.ITEM_BY_ID(itemId), {
        method: 'DELETE',
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json && json.message ? json.message : 'Failed to delete item');
      
      setSuccess('Item deleted successfully!');
      setDeleteConfirm(null);
      await loadItems(); // Reload items
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(`Failed to delete: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    setImageFile(file ?? null);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMenuId && !event.target.closest('.dropdown-menu-container')) {
        setOpenMenuId(null);
      }
    };

    if (openMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [openMenuId]);

  return (
    <>
      <Navbar />
      
      <main className="min-h-screen bg-[#FCFCF9] px-4 py-8 sm:px-6 lg:px-8">
        {/* Success/Error Messages */}
        {success && (
          <div className="max-w-7xl mx-auto mb-4 p-3 bg-green-50 text-green-700 text-sm rounded-md">
            {success}
          </div>
        )}
        {error && (
          <div className="max-w-7xl mx-auto mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md">
            {error}
          </div>
        )}
        {/* Header Section */}
        <header className="max-w-7xl mx-auto mb-8">
          <h1 className="text-[#134252] text-3xl font-semibold mb-6">
            Your Posts
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
                  placeholder="Search your posts..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/your-posts')}
                className="w-40 px-4 py-2.5 rounded-lg font-medium text-sm transition-all bg-[#C0152F] text-white shadow-sm"
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
                className="w-40 px-4 py-2.5 rounded-lg font-medium text-sm transition-all bg-[#8C1007]/10 text-[#134252] hover:bg-[#8C1007]/20 border border-[#8C1007]/10"
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
                  {search ? 'Try adjusting your search terms' : 'You haven\'t posted any items yet'}
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
                  <div className="aspect-square bg-gray-100 overflow-hidden relative group">
                    {/* 3-dot Menu Button */}
                    <div className="absolute top-2 right-2 z-10 dropdown-menu-container">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === (item._id || item.id) ? null : (item._id || item.id));
                        }}
                        className="p-2 bg-white/90 hover:bg-white rounded-full shadow-md transition-all backdrop-blur-sm"
                        aria-label="More options"
                      >
                        <svg 
                          className="w-5 h-5 text-[#134252]" 
                          fill="currentColor" 
                          viewBox="0 0 20 20"
                        >
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>
                      
                      {/* Dropdown Menu */}
                      {openMenuId === (item._id || item.id) && (
                        <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(item);
                              setOpenMenuId(null);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-[#134252] hover:bg-gray-100 flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit Post
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirm(item._id || item.id);
                              setOpenMenuId(null);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-[#C0152F] hover:bg-red-50 flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete Post
                          </button>
                        </div>
                      )}
                    </div>
                    
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
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-[#134252]">Edit Post</h2>
                <button
                  onClick={() => {
                    setEditingItem(null);
                    setError('');
                    setSuccess('');
                  }}
                  className="text-[#626C71] hover:text-[#134252]"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-[#626C71] mb-1">Item Name</label>
                    <input
                      type="text"
                      required
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full rounded-md border border-[#5E5240]/20 bg-white px-3 py-2 text-sm text-[#134252] focus:outline-none focus:ring-2 focus:ring-[#21808D]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#626C71] mb-1">Location</label>
                    <input
                      type="text"
                      value={editForm.location}
                      onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                      className="w-full rounded-md border border-[#5E5240]/20 bg-white px-3 py-2 text-sm text-[#134252] focus:outline-none focus:ring-2 focus:ring-[#21808D]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#626C71] mb-1">Date</label>
                    <input
                      type="date"
                      value={editForm.date}
                      onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                      className="w-full rounded-md border border-[#5E5240]/20 bg-white px-3 py-2 text-sm text-[#134252] focus:outline-none focus:ring-2 focus:ring-[#21808D]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#626C71] mb-1">Contact Info</label>
                    <input
                      type="text"
                      value={editForm.contactInfo}
                      onChange={(e) => setEditForm({ ...editForm, contactInfo: e.target.value })}
                      className="w-full rounded-md border border-[#5E5240]/20 bg-white px-3 py-2 text-sm text-[#134252] focus:outline-none focus:ring-2 focus:ring-[#21808D]"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs text-[#626C71] mb-1">Type</label>
                    <select
                      value={editForm.type}
                      onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                      className="w-full rounded-md border border-[#5E5240]/20 bg-white px-3 py-2 text-sm text-[#134252] focus:outline-none focus:ring-2 focus:ring-[#21808D]"
                    >
                      <option value="lost">Lost</option>
                      <option value="found">Found</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs text-[#626C71] mb-1">Description</label>
                    <textarea
                      rows={4}
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="w-full rounded-md border border-[#5E5240]/20 bg-white px-3 py-2 text-sm text-[#134252] focus:outline-none focus:ring-2 focus:ring-[#21808D]"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs text-[#626C71] mb-1">Image</label>
                    {imageFile ? (
                      <img
                        src={URL.createObjectURL(imageFile)}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg mb-2"
                      />
                    ) : editForm.imageUrl ? (
                      <img
                        src={editForm.imageUrl}
                        alt="Current"
                        className="w-full h-48 object-cover rounded-lg mb-2"
                      />
                    ) : null}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="w-full rounded-md border border-[#5E5240]/20 bg-white px-3 py-2 text-sm text-[#134252] focus:outline-none focus:ring-2 focus:ring-[#21808D]"
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingItem(null);
                      setError('');
                      setSuccess('');
                    }}
                    className="px-4 py-2 rounded-md text-sm font-medium text-[#134252] bg-gray-100 hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`px-4 py-2 rounded-md text-sm font-medium text-white bg-[#21808D] hover:bg-[#1a6b75] ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    {loading ? 'Updating...' : 'Update Post'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-[#134252] mb-4">Delete Post</h2>
            <p className="text-[#626C71] mb-6">Are you sure you want to delete this post? This action cannot be undone.</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-md text-sm font-medium text-[#134252] bg-gray-100 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={loading}
                className={`px-4 py-2 rounded-md text-sm font-medium text-white bg-[#C0152F] hover:bg-[#A01327] ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default YourPosts;

