import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from "../layout/navbar";
import { uploadToCloudinary } from '../../utils/cloudinary';
import { API_ENDPOINTS } from '../../utils/constants';
import { confirm } from '../../utils/swal';

function ReportItem() {
  const navigate = useNavigate();
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
  
  // Get today's date in local timezone (YYYY-MM-DD)
  const getLocalDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const today = getLocalDateString();

  const hasUnsavedChanges = () => {
    return itemName || category || location || dateInfo || contactInfo || description || imageFiles.length > 0;
  };

  const handleBack = async () => {
    if (hasUnsavedChanges()) {
      const confirmed = await confirm(
        'Discard changes?',
        'You have unsaved changes. Are you sure you want to leave without submitting your report?'
      );
      if (!confirmed) return;
    }
    navigate(-1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!itemName.trim()) {
      setError('Item Name is required.');
      return;
    }
    if (!category) {
      setError('Please select a category.');
      return;
    }
    if (!location.trim()) {
      setError('Location is required.');
      return;
    }
    if (!dateInfo) {
      setError('Date is required.');
      return;
    }
    // Compare date strings directly (both in YYYY-MM-DD format)
    if (dateInfo > today) {
      setError('Date cannot be in the future.');
      return;
    }
    const normalizedContact = String(contactInfo || '').trim();
    const emailPattern = /^\S+@\S+\.\S+$/;
    const phonePattern = /^[+]?\d[\d\s().-]{5,}$/;
    if (!normalizedContact || (!emailPattern.test(normalizedContact) && !phonePattern.test(normalizedContact))) {
      setError('Enter valid contact information.');
      return;
    }
    if (!description.trim()) {
      setError('Description is required.');
      return;
    }
    if (!imageFiles || imageFiles.length === 0) {
      setError('At least one photo is required.');
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
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    const hasInvalid = files.some(file => !allowedTypes.includes(file.type));
    if (hasInvalid) {
      setError('Only JPG and PNG files are allowed.');
      setImageFiles([]);
      setPreviewIndex(0);
      return;
    }
    setError('');
    setImageFiles(files);
    setPreviewIndex(0);
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen px-3 py-4 sm:px-6 sm:py-8 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="mb-4 sm:mb-6 flex items-center gap-2 sm:gap-4">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-orange-50 hover:text-orange-600 transition-all min-h-11"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline">Back</span>
            </button>
            <h1 className="text-[#134252] text-xl sm:text-2xl lg:text-3xl font-semibold">Report Item</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Left: Image upload placeholder */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-[#5E5240]/10 p-3 sm:p-4">
                <div className="aspect-4/3 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-2xl sm:text-3xl">
                  {imageFiles && imageFiles.length > 0 ? (
                    <img
                      src={URL.createObjectURL(imageFiles[previewIndex])}
                      alt="Photo"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <span className="text-center px-2">400 × 300</span>
                  )}
                </div>
                <label htmlFor="image-upload" className="mt-3 sm:mt-4 block">
                  <span className="sr-only">Upload Photo</span>
                  <input 
                    id="image-upload"
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileChange} 
                    className="hidden"
                    multiple
                  />
                  <div className="w-full text-center bg-orange-500 text-white hover:bg-orange-600 active:bg-orange-700 shadow-sm hover:shadow transition rounded-md py-3 cursor-pointer font-medium min-h-11 flex items-center justify-center text-sm sm:text-base">
                    Upload Photo
                  </div>
                </label>

                {/* thumbnails */}
                {imageFiles && imageFiles.length > 1 && (
                  <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
                    {imageFiles.map((f, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setPreviewIndex(idx)}
                        className={`w-16 h-12 shrink-0 rounded-md overflow-hidden border-2 transition-all ${idx === previewIndex ? 'border-orange-500' : 'border-gray-200'}`}
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
              <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-[#5E5240]/10 p-3 sm:p-4 lg:p-6">
                <p className="text-sm font-semibold text-[#626C71] mb-3 sm:mb-4">Item Details</p>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-start gap-2 animate-fadeIn">
                    <svg className="w-5 h-5 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}
                {success && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg flex items-start gap-2 animate-fadeIn">
                    <svg className="w-5 h-5 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{success}</span>
                  </div>
                )}
                <div className="space-y-3 sm:space-y-4">{/* Item Type Selection */}
                  <div>
                    <label className="block text-xs sm:text-sm text-[#626C71] mb-2 font-medium">Category <span className="text-orange-500">*</span></label>
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                      <label className="flex items-center cursor-pointer min-h-11">
                        <input
                          type="radio"
                          name="itemType"
                          value="lost"
                          checked={itemType === "lost"}
                          onChange={(e) => setItemType(e.target.value)}
                          className="mr-2 w-4 h-4 text-[#C0152F] focus:ring-[#C0152F]"
                        />
                        <span className="text-sm sm:text-base text-[#134252]">Lost Item</span>
                      </label>
                      <label className="flex items-center cursor-pointer min-h-11">
                        <input
                          type="radio"
                          name="itemType"
                          value="found"
                          checked={itemType === "found"}
                          onChange={(e) => setItemType(e.target.value)}
                          className="mr-2 w-4 h-4 text-[#C0152F] focus:ring-[#C0152F]"
                        />
                        <span className="text-sm sm:text-base text-[#134252]">Found Item</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm text-[#626C71] mb-1 font-medium">Item Name <span className="text-orange-500">*</span></label>
                    <input
                      type="text"
                      placeholder="Name of the item..."
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      className="w-full rounded-md border border-[#5E5240]/20 bg-white px-3 py-3 text-sm sm:text-base text-[#134252] focus:outline-none focus:ring-2 focus:ring-[#21808D] min-h-11"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm text-[#626C71] mb-1 font-medium">Item Category <span className="text-orange-500">*</span></label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full rounded-md border border-[#5E5240]/20 bg-white px-3 py-3 text-sm sm:text-base text-[#134252] focus:outline-none focus:ring-2 focus:ring-[#21808D] min-h-11"
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
                    <label className="block text-xs sm:text-sm text-[#626C71] mb-1 font-medium">Location <span className="text-orange-500">*</span></label>
                    <input
                      type="text"
                      placeholder={itemType === "lost" ? "Last seen location..." : "Found location..."}
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full rounded-md border border-[#5E5240]/20 bg-white px-3 py-3 text-sm sm:text-base text-[#134252] focus:outline-none focus:ring-2 focus:ring-[#21808D] min-h-11"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm text-[#626C71] mb-1 font-medium">Date info <span className="text-orange-500">*</span></label>
                    <input
                      type="date"
                      value={dateInfo}
                      onChange={(e) => setDateInfo(e.target.value)}
                      className="w-full rounded-md border border-[#5E5240]/20 bg-white px-3 py-3 text-sm sm:text-base text-[#134252] focus:outline-none focus:ring-2 focus:ring-[#21808D] min-h-11"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm text-[#626C71] mb-1 font-medium">Contact Info <span className="text-orange-500">*</span></label>
                    <input
                      type="text"
                      placeholder="Contact number, email, etc..."
                      value={contactInfo}
                      onChange={(e) => setContactInfo(e.target.value)}
                      className="w-full rounded-md border border-[#5E5240]/20 bg-white px-3 py-3 text-sm sm:text-base text-[#134252] focus:outline-none focus:ring-2 focus:ring-[#21808D] min-h-11"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm text-[#626C71] mb-1 font-medium">Item Description <span className="text-orange-500">*</span></label>
                    <textarea
                      rows={4}
                      placeholder="Describe the item..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full rounded-md border border-[#5E5240]/20 bg-white px-3 py-3 text-sm sm:text-base text-[#134252] focus:outline-none focus:ring-2 focus:ring-[#21808D] resize-none"
                    />
                    <p className="mt-1 text-xs text-[#626C71]">
                      {description.length} characters
                    </p>
                  </div>
                </div>

                <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <p className="text-xs sm:text-sm text-[#626C71]">
                    <span className="text-orange-500">*</span> Required fields
                  </p>
                  <button
                    type="submit"
                    disabled={uploading}
                    className={`bg-orange-500 text-white hover:bg-orange-600 active:bg-orange-700 shadow-sm hover:shadow px-6 py-3 rounded-md text-sm sm:text-base font-medium min-h-11 flex items-center justify-center gap-2 transition-all ${uploading ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    {uploading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Submitting...
                      </>
                    ) : (
                      'Submit Report'
                    )}
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


