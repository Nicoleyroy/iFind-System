import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from "../../layout/navbar";
import { API_ENDPOINTS } from '../../../utils/constants';
import { uploadToCloudinary } from '../../../utils/cloudinary';
import { confirm, success as swalSuccess, error as swalError } from '../../../utils/swal';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [markingId, setMarkingId] = useState(null);
  const [viewArchived, setViewArchived] = useState(false);
  
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
    // Load user data from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
      } catch (e) {
        console.warn('Failed to parse user from localStorage', e);
      }
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      // Fetch both lost and found items
      const [lostRes, foundRes] = await Promise.all([
        fetch(API_ENDPOINTS.LOST_ITEMS),
        fetch(API_ENDPOINTS.FOUND_ITEMS)
      ]);
      
      const lostJson = await lostRes.json();
      const foundJson = await foundRes.json();
      
      const lostItems = Array.isArray(lostJson.data) ? lostJson.data.map(item => ({ ...item, type: 'lost' })) : [];
      const foundItems = Array.isArray(foundJson.data) ? foundJson.data.map(item => ({ ...item, type: 'found' })) : [];
      
      // Combine both arrays
      const allItems = [...lostItems, ...foundItems];
      setItems(allItems);
    } catch (e) {
      console.error('Failed to load items', e);
    }
  };

  // Filter items to only show posts uploaded by the current user
  const filtered = items.filter(item => {
    if (!user) return false;
    
    const currentUserId = user._id || user.id;
    const itemUserId = item.userId?._id || item.userId?.id || item.userId;
    
    const matchesUser = String(itemUserId) === String(currentUserId);
    
    const matchesSearch = item.name?.toLowerCase().includes(search.toLowerCase()) ||
                         item.description?.toLowerCase().includes(search.toLowerCase()) ||
                         item.location?.toLowerCase().includes(search.toLowerCase());
    
    return matchesUser && matchesSearch;
  });

  const displayedItems = filtered.filter(item => viewArchived ? item.status === 'Archived' : item.status !== 'Archived');

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

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
      
      if (imageFile) {
        imageUrl = await uploadToCloudinary(imageFile);
      }

      const payload = {
        name: editForm.name,
        location: editForm.location,
        date: editForm.date,
        contactInfo: editForm.contactInfo,
        description: editForm.description,
        imageUrl,
      };

      // Determine which endpoint to use based on item type
      const endpoint = editingItem.type === 'lost' 
        ? API_ENDPOINTS.LOST_ITEM_BY_ID(editingItem._id || editingItem.id)
        : API_ENDPOINTS.FOUND_ITEM_BY_ID(editingItem._id || editingItem.id);

      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json && json.message ? json.message : 'Failed to update item');
      
      setSuccess('Item updated successfully!');
      setEditingItem(null);
      await loadItems();
      
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
      // Find the item to determine its type
      const itemToDelete = items.find(item => (item._id || item.id) === itemId);
      if (!itemToDelete) {
        throw new Error('Item not found');
      }

      // Determine which endpoint to use based on item type
      const endpoint = itemToDelete.type === 'lost' 
        ? API_ENDPOINTS.LOST_ITEM_BY_ID(itemId)
        : API_ENDPOINTS.FOUND_ITEM_BY_ID(itemId);

      const res = await fetch(endpoint, {
        method: 'DELETE',
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json && json.message ? json.message : 'Failed to delete item');
      
      setSuccess('Item deleted successfully!');
      setDeleteConfirm(null);
      await loadItems();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(`Failed to delete: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkReturned = async (item) => {
    if (!user) return;
    const currentUserId = user._id || user.id;
    const ownerId = item.userId?._id || item.userId?.id || item.userId;
    if (!currentUserId || String(currentUserId) !== String(ownerId)) {
      setError('Only the owner can mark this item as returned.');
      setTimeout(() => setError(''), 4000);
      return;
    }

    const ok = await confirm('Mark this lost item as Returned?', 'This will update the post status.');
    if (!ok) return;

    setMarkingId(item._id || item.id);
    setError('');
    setLoading(true);
    try {
      const endpoint = item.type === 'lost' ? API_ENDPOINTS.LOST_ITEM_BY_ID(item._id || item.id) : API_ENDPOINTS.FOUND_ITEM_BY_ID(item._id || item.id);
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Returned' }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to update item');

      const updated = json.data;
      setItems(prev => prev.map(it => (String(it._id || it.id) === String(updated._id || updated.id) ? updated : it)));
      setSuccess('Item marked as Returned');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to mark returned');
      setTimeout(() => setError(''), 4000);
    } finally {
      setMarkingId(null);
      setLoading(false);
    }
  };

  const handleArchive = async (item) => {
    if (!user) return;
    const currentUserId = user._id || user.id;
    const ownerId = item.userId?._id || item.userId?.id || item.userId;
    if (!currentUserId || String(currentUserId) !== String(ownerId)) {
      setError('Only the owner can archive this item.');
      setTimeout(() => setError(''), 4000);
      return;
    }

    const ok = await confirm('Archive this post?', 'Archived posts will be hidden from public listings.');
    if (!ok) return;

    setMarkingId(item._id || item.id);
    setLoading(true);
    try {
      const endpoint = item.type === 'lost' ? API_ENDPOINTS.LOST_ITEM_BY_ID(item._id || item.id) : API_ENDPOINTS.FOUND_ITEM_BY_ID(item._id || item.id);
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Archived' }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to archive item');

      const updated = json.data;
      setItems(prev => prev.map(it => (String(it._id || it.id) === String(updated._id || updated.id) ? updated : it)));
      setSuccess('Item archived');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to archive');
      setTimeout(() => setError(''), 4000);
    } finally {
      setMarkingId(null);
      setLoading(false);
    }
  };

  const handleRestore = async (item) => {
    if (!user) return;
    const currentUserId = user._id || user.id;
    const ownerId = item.userId?._id || item.userId?.id || item.userId;
    if (!currentUserId || String(currentUserId) !== String(ownerId)) {
      setError('Only the owner can restore this item.');
      setTimeout(() => setError(''), 4000);
      return;
    }

    const ok = await confirm('Restore this archived post?', 'This will make the post visible publicly again.');
    if (!ok) return;

    setMarkingId(item._id || item.id);
    setLoading(true);
    try {
      const endpoint = item.type === 'lost' ? API_ENDPOINTS.LOST_ITEM_BY_ID(item._id || item.id) : API_ENDPOINTS.FOUND_ITEM_BY_ID(item._id || item.id);
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Active' }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to restore item');

      const updated = json.data;
      setItems(prev => prev.map(it => (String(it._id || it.id) === String(updated._id || updated.id) ? updated : it)));
      setSuccess('Item restored');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to restore');
      setTimeout(() => setError(''), 4000);
    } finally {
      setMarkingId(null);
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

  if (!user) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-[#FCFCF9] flex items-center justify-center">
          <p className="text-[#626C71]">Loading profile...</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      
      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Success/Error Messages */}
        {success && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg shadow-sm">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-green-800 font-medium">{success}</p>
              </div>
            </div>
          </div>
        )}
        {error && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
            <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg shadow-sm">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-orange-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-orange-800 font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Profile Header - Professional Style */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Profile Picture */}
              <div className="flex-shrink-0">
                {user.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={user.name}
                    className="w-32 h-32 lg:w-40 lg:h-40 rounded-full border-2 border-gray-200 object-cover shadow-md"
                  />
                ) : (
                  <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-full border-2 border-gray-200 bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-4xl font-bold shadow-md">
                    {getInitials(user.name)}
                  </div>
                )}
              </div>

              {/* Profile Information */}
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                      {user.name || 'User'}
                    </h1>
                    <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Member Profile</p>
                  </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => navigate('/settings')}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg text-sm font-semibold hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-md hover:shadow-lg"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Edit Profile
                      </button>

                      <button
                        onClick={() => navigate('/profile/claims')}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-all duration-200 shadow-sm"
                      >
                        View Claim Requests
                      </button>
                    </div>
                </div>
                  
                {/* Contact Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 rounded-lg p-5 border border-gray-200">
                  {user.email && (
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                        <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Email Address</p>
                        <p className="text-sm text-gray-900 font-medium truncate">{user.email}</p>
                      </div>
                    </div>
                  )}
                  {user.phoneNumber && (
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                        <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Phone Number</p>
                        <p className="text-sm text-gray-900 font-medium">{user.phoneNumber}</p>
                      </div>
                    </div>
                  )}
                  {user.createdAt && (
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                        <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Member Since</p>
                        <p className="text-sm text-gray-900 font-medium">{new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Posts</p>
                      <p className="text-sm text-gray-900 font-medium">{displayedItems.length} {displayedItems.length === 1 ? 'Item' : 'Items'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Posts Section - Professional Layout */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Section Header with Search */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{viewArchived ? 'Archived Posts' : 'My Posts'}</h2>
                    <p className="text-sm text-gray-600 mt-1">Manage and track your lost and found items</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setViewArchived(false)}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${!viewArchived ? 'bg-orange-500 text-white' : 'bg-white border border-gray-200 text-gray-700'}`}
                  >
                    My Posts
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewArchived(true)}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${viewArchived ? 'bg-gray-800 text-white' : 'bg-white border border-gray-200 text-gray-700'}`}
                  >
                    Archived
                  </button>
                </div>
              </div>
              <div className="relative w-full sm:w-80">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm"
                  placeholder="Search posts..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Posts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {displayedItems.length === 0 ? (
              <div className="col-span-full">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16 text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Posts Found</h3>
                  <p className="text-gray-600 max-w-sm mx-auto">
                    {search ? 'No items match your search criteria. Try adjusting your search terms.' : 'You haven\'t posted any items yet. Start by reporting a lost or found item.'}
                  </p>
                </div>
              </div>
            ) : (
              displayedItems.map((item) => (
                <div
                  key={item.id || item._id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all duration-200 flex flex-col"
                >
                  {/* Card Header */}
                  <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {user.profilePicture ? (
                          <img
                            src={user.profilePicture}
                            alt={user.name}
                            className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-sm font-bold border-2 border-white shadow-sm">
                            {getInitials(user.name)}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-900 text-sm truncate">{user.name}</p>
                          <p className="text-xs text-gray-500">
                            {item.date ? new Date(item.date).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            }) : 'No date'}
                          </p>
                        </div>
                      </div>
                      
                      {/* Actions Menu */}
                      <div className="relative dropdown-menu-container">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === (item._id || item.id) ? null : (item._id || item.id));
                          }}
                          className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                          aria-label="More options"
                        >
                          <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </button>
                        
                        {openMenuId === (item._id || item.id) && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-20">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(item);
                                setOpenMenuId(null);
                              }}
                              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                            >
                              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              <span className="font-medium">Edit Post</span>
                            </button>
                              {item.status !== 'Archived' ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleArchive(item);
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                                >
                                  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v13a2 2 0 002 2h14a2 2 0 002-2V7M3 7l9-4 9 4" />
                                  </svg>
                                  <span className="font-medium">Archive Post</span>
                                </button>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRestore(item);
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full text-left px-4 py-2.5 text-sm text-green-600 hover:bg-green-50 flex items-center gap-3 transition-colors"
                                >
                                  <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v13a2 2 0 002 2h14a2 2 0 002-2V7M16 3l-4 4-4-4" />
                                  </svg>
                                  <span className="font-medium">Restore Post</span>
                                </button>
                              )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirm(item._id || item.id);
                                setOpenMenuId(null);
                              }}
                              className="w-full text-left px-4 py-2.5 text-sm text-orange-600 hover:bg-orange-50 flex items-center gap-3 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              <span className="font-medium">Delete Post</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Image */}
                  {item.imageUrl && (
                    <div className="aspect-video overflow-hidden bg-gray-100">
                      <img 
                        src={item.imageUrl} 
                        alt={item.name} 
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" 
                      />
                    </div>
                  )}

                  {/* Card Content */}
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="text-base font-bold text-gray-900 mb-2 line-clamp-2">{item.name}</h3>
                    
                    {item.location && (
                      <div className="flex items-start gap-2 mb-3">
                        <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-sm text-gray-600 line-clamp-1">{item.location}</span>
                      </div>
                    )}
                    
                    {item.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-3">{item.description}</p>
                    )}
                    
                    {/* Footer - Status & Type */}
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100 gap-3">
                      <div className="flex items-center gap-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            item.status === 'Pending'
                              ? 'bg-amber-100 text-amber-800'
                              : item.status === 'Claimed' || item.status === 'Returned'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-orange-100 text-orange-800'
                          }`}
                        >
                          {item.status || 'Unclaimed'}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 capitalize">
                          {item.type}
                        </span>
                      </div>

                      {/* Mark Returned button: only show for lost items and only for the owner */}
                      {item.type === 'lost' && (user && (user._id || user.id) === (item.userId?._id || item.userId?.id || item.userId)) && item.status !== 'Returned' && (
                        <button
                          onClick={() => handleMarkReturned(item)}
                          disabled={loading && markingId === (item._id || item.id)}
                          className={`px-3 py-1 rounded-md text-sm font-medium text-white ${markingId === (item._id || item.id) ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                        >
                          {markingId === (item._id || item.id) ? 'Updating...' : 'Mark Returned'}
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

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Edit Post</h2>
                <button
                  onClick={() => {
                    setEditingItem(null);
                    setError('');
                    setSuccess('');
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Item Name *</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-shadow"
                    placeholder="Enter item name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-shadow"
                    placeholder="Where was it lost/found?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                  <input
                    type="date"
                    value={editForm.date}
                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-shadow"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Info</label>
                  <input
                    type="text"
                    value={editForm.contactInfo}
                    onChange={(e) => setEditForm({ ...editForm, contactInfo: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-shadow"
                    placeholder="Email or phone number"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
                  <div className="mt-1">
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-800">
                      {editForm.type === 'lost' ? 'Lost' : 'Found'}
                    </span>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <textarea
                    rows={4}
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-shadow resize-none"
                    placeholder="Provide details about the item..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Item Image</label>
                  {imageFile ? (
                    <div className="relative">
                      <img
                        src={URL.createObjectURL(imageFile)}
                        alt="Preview"
                        className="w-full h-64 object-cover rounded-lg mb-3 border-2 border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => setImageFile(null)}
                        className="absolute top-2 right-2 p-2 bg-white rounded-lg shadow-lg hover:bg-gray-100 transition-colors"
                      >
                        <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : editForm.imageUrl ? (
                    <div className="relative">
                      <img
                        src={editForm.imageUrl}
                        alt="Current"
                        className="w-full h-64 object-cover rounded-lg mb-3 border-2 border-gray-200"
                      />
                    </div>
                  ) : null}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-500 file:text-white hover:file:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-shadow"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-8 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setEditingItem(null);
                    setError('');
                    setSuccess('');
                  }}
                  className="px-6 py-2.5 rounded-lg text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-6 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all shadow-md hover:shadow-lg ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Updating...
                    </span>
                  ) : 'Update Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-6">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 text-center mb-2">Delete Post</h2>
              <p className="text-gray-600 text-center mb-6">Are you sure you want to delete this post? This action cannot be undone.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  disabled={loading}
                  className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 transition-colors shadow-md hover:shadow-lg ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Deleting...
                    </span>
                  ) : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Profile;

