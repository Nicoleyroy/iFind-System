import React, { useState } from 'react';
import Navbar from "../Navbar";
import { uploadToCloudinary } from '../../utils/cloudinary';

function ReportItem() {
  const [itemName, setItemName] = useState("");
  const [location, setLocation] = useState("");
  const [dateInfo, setDateInfo] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    let imageUrl = '';
    setUploading(true);
    try {
      if (imageFile) {
        // upload to Cloudinary and get URL
        imageUrl = await uploadToCloudinary(imageFile);
      }

      const payload = {
        name: itemName,
        location,
        date: dateInfo,
        contactInfo,
        description,
        type: 'lost',
        imageUrl,
      };

      const res = await fetch('http://localhost:4000/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json && json.message ? json.message : 'Failed to submit');
      alert('Report submitted');
      setItemName("");
      setLocation("");
      setDateInfo("");
      setContactInfo("");
      setDescription("");
      setImageFile(null);
    } catch (err) {
      alert(`Failed to submit: ${err.message}`);
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
            <h1 className="text-[#134252] text-3xl font-semibold">Report Lost Item</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Image upload placeholder */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-[#5E5240]/10 p-4">
                <div className="aspect-[4/3] rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-3xl">
                  {imageFile ? (
                    <img
                      src={URL.createObjectURL(imageFile)}
                      alt="Proof of ownership"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <span>400 × 300</span>
                  )}
                </div>
                <label className="mt-4 block">
                  <span className="sr-only">Upload Proof of Ownership</span>
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  <div className="mt-4 w-full text-center bg-[#C0152F]/10 text-[#C0152F] hover:bg-[#C0152F]/20 transition rounded-md py-2 cursor-pointer">
                    Upload Proof of Ownership
                  </div>
                </label>
              </div>
            </div>

            {/* Right: Form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-[#5E5240]/10 p-4">
                <p className="text-sm font-semibold text-[#626C71] mb-4">Item Details</p>

                <div className="space-y-4">
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
                      placeholder="Last seen location..."
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full rounded-md border border-[#5E5240]/20 bg-white px-3 py-2 text-sm text-[#134252] focus:outline-none focus:ring-2 focus:ring-[#21808D]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#626C71] mb-1">Date info</label>
                    <input
                      type="date"
                      placeholder="Date lost..."
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
                      placeholder="Contact number, email, etc..."
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


