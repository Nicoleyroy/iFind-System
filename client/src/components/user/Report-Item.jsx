import React, { useState } from 'react';
import Navbar from "../layout/navbar";
import { uploadToCloudinary } from '../../utils/cloudinary';
import { API_ENDPOINTS } from '../../utils/constants';

function ReportItem() {
  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [dateInfo, setDateInfo] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [description, setDescription] = useState("");
  const [itemType, setItemType] = useState("lost"); // 'lost' or 'found'
  const [imageFiles, setImageFiles] = useState([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (dateInfo && dateInfo > today) {
      setError('Date cannot be in the future');
      return;
    }
    let imageUrl = '';
    let images = [];
    setUploading(true);
    try {
      if (imageFiles && imageFiles.length > 0) {
        // upload all files to Cloudinary and get URLs
        const uploadPromises = imageFiles.map(file => uploadToCloudinary(file));
        images = await Promise.all(uploadPromises);
        imageUrl = images[0] || '';
      }

      // Get current user ID from localStorage
      let userId = null;
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          userId = user._id || user.id;
        } catch (e) {
          console.warn('Failed to parse user from localStorage', e);
        }
      }

      const payload = {
        name: itemName,
        category,
        location,
        date: dateInfo,
        contactInfo,
        description,
        imageUrl,
        images,
        userId,
      };

      const endpoint = itemType === 'lost' ? API_ENDPOINTS.LOST_ITEMS : API_ENDPOINTS.FOUND_ITEMS;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json && json.message ? json.message : 'Failed to submit');
      
      setSuccess('Report submitted successfully!');
      setItemName("");
      setCategory("");
      setLocation("");
      setDateInfo("");
      setContactInfo("");
      setDescription("");
      setItemType("lost");
      setImageFiles([]);
      setPreviewIndex(0);
    } catch (err) {
      setError(`Failed to submit: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setImageFiles(files);
    setPreviewIndex(0);
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#FCFCF9] px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-[#134252] text-3xl font-semibold">Report Item</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Image upload placeholder */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-[#5E5240]/10 p-4">
                <div className="aspect-[4/3] rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-3xl">
                  {imageFiles && imageFiles.length > 0 ? (
                    <img
                      src={URL.createObjectURL(imageFiles[previewIndex])}
                      alt="Photo"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <span>400 × 300</span>
                  )}
                </div>
                <label htmlFor="image-upload" className="mt-4 block">
                  <span className="sr-only">Upload Photo</span>
                  <input 
                    id="image-upload"
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileChange} 
                    className="hidden"
                    multiple
                  />
                  <div className="mt-4 w-full text-center bg-orange-50 text-orange-500 hover:bg-orange-100 transition rounded-md py-2 cursor-pointer">
                    Upload Photo
                  </div>
                </label>

                {/* thumbnails */}
                {imageFiles && imageFiles.length > 1 && (
                  <div className="mt-3 flex gap-2 overflow-x-auto">
                    {imageFiles.map((f, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setPreviewIndex(idx)}
                        className={`w-16 h-12 rounded-md overflow-hidden border ${idx === previewIndex ? 'border-orange-500' : 'border-gray-100'}`}
                      >
                        <img src={URL.createObjectURL(f)} alt={`thumb-${idx}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-[#5E5240]/10 p-4">
                <p className="text-sm font-semibold text-[#626C71] mb-4">Item Details</p>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded-md">
                    {success}
                  </div>
                )}
                <div className="space-y-4">
                  {/* Item Type Selection */}
                  <div>
                    <label className="block text-xs text-[#626C71] mb-2">Category</label>
                    <div className="flex gap-4">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="itemType"
                          value="lost"
                          checked={itemType === "lost"}
                          onChange={(e) => setItemType(e.target.value)}
                          className="mr-2 text-[#C0152F] focus:ring-[#C0152F]"
                        />
                        <span className="text-sm text-[#134252]">Lost Item</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="itemType"
                          value="found"
                          checked={itemType === "found"}
                          onChange={(e) => setItemType(e.target.value)}
                          className="mr-2 text-[#C0152F] focus:ring-[#C0152F]"
                        />
                        <span className="text-sm text-[#134252]">Found Item</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-[#626C71] mb-1">Item Name</label>
                    <input
                      type="text"
                      placeholder="Name of the item..."
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      className="w-full rounded-md border border-[#5E5240]/20 bg-white px-3 py-2 text-sm text-[#134252] focus:outline-none focus:ring-2 focus:ring-[#21808D]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#626C71] mb-1">Item Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full rounded-md border border-[#5E5240]/20 bg-white px-3 py-2 text-sm text-[#134252] focus:outline-none focus:ring-2 focus:ring-[#21808D]"
                    >
                      <option value="">Select a category...</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Personal Items">Personal Items</option>
                      <option value="Bags & Wallets">Bags & Wallets</option>
                      <option value="Keys">Keys</option>
                      <option value="Clothing">Clothing</option>
                      <option value="Accessories">Accessories</option>
                      <option value="Books & Documents">Books & Documents</option>
                      <option value="Sports Equipment">Sports Equipment</option>
                      <option value="Jewelry">Jewelry</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-[#626C71] mb-1">Location</label>
                    <input
                      type="text"
                      placeholder={itemType === "lost" ? "Last seen location..." : "Found location..."}
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full rounded-md border border-[#5E5240]/20 bg-white px-3 py-2 text-sm text-[#134252] focus:outline-none focus:ring-2 focus:ring-[#21808D]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#626C71] mb-1">Date info</label>
                    <input
                      type="date"
                      value={dateInfo}
                      onChange={(e) => setDateInfo(e.target.value)}
                      className="w-full rounded-md border border-[#5E5240]/20 bg-white px-3 py-2 text-sm text-[#134252] focus:outline-none focus:ring-2 focus:ring-[#21808D]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#626C71] mb-1">Contact Info</label>
                    <input
                      type="text"
                      placeholder="Contact number, email, etc..."
                      value={contactInfo}
                      onChange={(e) => setContactInfo(e.target.value)}
                      className="w-full rounded-md border border-[#5E5240]/20 bg-white px-3 py-2 text-sm text-[#134252] focus:outline-none focus:ring-2 focus:ring-[#21808D]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#626C71] mb-1">Item Description</label>
                    <textarea
                      rows={4}
                      placeholder="Describe the item..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full rounded-md border border-[#5E5240]/20 bg-white px-3 py-2 text-sm text-[#134252] focus:outline-none focus:ring-2 focus:ring-[#21808D]"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="submit"
                    disabled={uploading}
                    className={`bg-orange-500 text-white hover:bg-orange-600 active:bg-orange-700 shadow-sm hover:shadow px-4 py-2 rounded-md text-sm font-medium ${uploading ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    {uploading ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export default ReportItem;


