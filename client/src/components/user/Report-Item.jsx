import React, { useState } from 'react';
import Navbar from "../layout/navbar";
import { uploadToCloudinary } from '../../utils/cloudinary';
import { API_ENDPOINTS } from '../../utils/constants';

function ReportItem() {
  const [itemName, setItemName] = useState("");
  const [location, setLocation] = useState("");
  const [dateInfo, setDateInfo] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [description, setDescription] = useState("");
  const [itemType, setItemType] = useState("lost"); // 'lost' or 'found'
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    let imageUrl = '';
    setUploading(true);
    try {
      if (imageFile) {
        // upload to Cloudinary and get URL
        imageUrl = await uploadToCloudinary(imageFile);
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
        location,
        date: dateInfo,
        contactInfo,
        description,
        imageUrl,
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
      setLocation("");
      setDateInfo("");
      setContactInfo("");
      setDescription("");
      setItemType("lost");
      setImageFile(null);
    } catch (err) {
      setError(`Failed to submit: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    setImageFile(file ?? null);
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
                  {imageFile ? (
                    <img
                      src={URL.createObjectURL(imageFile)}
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
                  />
                  <div className="mt-4 w-full text-center bg-[#C0152F]/10 text-[#C0152F] hover:bg-[#C0152F]/20 transition rounded-md py-2 cursor-pointer">
                    Upload Photo
                  </div>
                </label>
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
                    className={`bg-[#C0152F] text-white hover:bg-[#A01327] active:bg-[#8B1122] shadow-sm hover:shadow px-4 py-2 rounded-md text-sm font-medium ${uploading ? 'opacity-60 cursor-not-allowed' : ''}`}
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


