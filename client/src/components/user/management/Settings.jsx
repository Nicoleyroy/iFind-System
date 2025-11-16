import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from "../../layout/navbar";
import { API_ENDPOINTS } from '../../../utils/constants';
import { uploadToCloudinary } from '../../../utils/cloudinary';

// Password Change Form Component
function PasswordChangeForm({ userId, isGoogleAccount, onSuccess, onError }) {
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
    setLocalError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setLoading(true);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setLocalError('New passwords do not match');
      setLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setLocalError('New password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(API_ENDPOINTS.CHANGE_PASSWORD(userId), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword || null, // Allow empty for Google accounts without password
          newPassword: passwordData.newPassword,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to change password');
      }

      // Reset form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      onSuccess('Password changed successfully!');
    } catch (err) {
      const errorMsg = err.message || 'Failed to change password';
      setLocalError(errorMsg);
      onError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {localError && (
        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md">
          {localError}
        </div>
      )}
      
      <div>
        <label className="block text-sm font-medium text-[#134252] mb-2">
          Current Password {isGoogleAccount && <span className="text-xs text-[#626C71] font-normal">(optional if you don't have one)</span>}
        </label>
        <input
          type="password"
          name="currentPassword"
          value={passwordData.currentPassword}
          onChange={handleChange}
          required={!isGoogleAccount}
          className="w-full rounded-md border border-[#5E5240]/20 bg-white px-3 py-2 text-sm text-[#134252] focus:outline-none focus:ring-2 focus:ring-[#21808D]"
          placeholder={isGoogleAccount ? "Enter your current password (leave empty if you don't have one)" : "Enter your current password"}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[#134252] mb-2">
          New Password
        </label>
        <input
          type="password"
          name="newPassword"
          value={passwordData.newPassword}
          onChange={handleChange}
          required
          minLength={6}
          className="w-full rounded-md border border-[#5E5240]/20 bg-white px-3 py-2 text-sm text-[#134252] focus:outline-none focus:ring-2 focus:ring-[#21808D]"
          placeholder="Enter your new password (min. 6 characters)"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[#134252] mb-2">
          Confirm New Password
        </label>
        <input
          type="password"
          name="confirmPassword"
          value={passwordData.confirmPassword}
          onChange={handleChange}
          required
          minLength={6}
          className="w-full rounded-md border border-[#5E5240]/20 bg-white px-3 py-2 text-sm text-[#134252] focus:outline-none focus:ring-2 focus:ring-[#21808D]"
          placeholder="Confirm your new password"
        />
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={loading}
          className={`bg-[#C0152F] text-white hover:bg-[#A01327] active:bg-[#8B1122] shadow-sm hover:shadow px-6 py-2 rounded-md text-sm font-medium transition-colors ${
            loading ? 'opacity-60 cursor-not-allowed' : ''
          }`}
        >
          {loading ? 'Changing...' : 'Change Password'}
        </button>
      </div>
    </form>
  );
}

function Settings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
  });
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeSection, setActiveSection] = useState('profile'); // 'profile', 'notifications', 'account'

  useEffect(() => {
    // Load user data from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
        setFormData({
          name: userData.name || '',
          email: userData.email || '',
          phoneNumber: userData.phoneNumber || '',
        });
        setProfilePicture(userData.profilePicture || null);
      } catch (e) {
        console.warn('Failed to parse user from localStorage', e);
      }
    }
  }, []);

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePictureFile(file);
      setProfilePicture(URL.createObjectURL(file));
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    setUploading(true);

    try {
      // Get user ID - check both _id and id fields
      const userId = user?._id || user?.id;

      if (!user || !userId) {
        console.error('User object:', user);
        throw new Error('User not found. Please log in again.');
      }

      let profilePictureUrl = profilePicture;

      // Upload new profile picture if a file was selected
      if (profilePictureFile) {
        try {
          profilePictureUrl = await uploadToCloudinary(profilePictureFile);
        } catch (uploadErr) {
          throw new Error(`Failed to upload profile picture: ${uploadErr.message}`);
        }
      }

      const payload = {
        name: formData.name,
        phoneNumber: formData.phoneNumber,
        profilePicture: profilePictureUrl,
      };

      const res = await fetch(API_ENDPOINTS.USER_BY_ID(userId), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json && json.message ? json.message : 'Failed to update profile');

      // Update localStorage with new user data
      const updatedUser = { ...user, ...json.data };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setProfilePicture(profilePictureUrl);
      setProfilePictureFile(null);

      // Dispatch custom event to update navbar
      window.dispatchEvent(new Event('userUpdated'));

      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(`Failed to update profile: ${err.message}`);
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#FCFCF9] px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-[#134252] text-3xl font-semibold">Profile</h1>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded-md">
              {success}
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Sidebar - Settings Navigation */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-[#5E5240]/10 p-6">
                <div className="mb-4">
                  <h2 className="text-[#134252] text-xl font-semibold mb-1">Settings</h2>
                  <p className="text-[#626C71] text-xs">Manage your account preferences and settings</p>
                </div>
                
                <nav className="space-y-1">
                  <button
                    onClick={() => setActiveSection('profile')}
                    className={`w-full text-left px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                      activeSection === 'profile'
                        ? 'bg-[#C0152F] text-white'
                        : 'text-[#626C71] hover:bg-gray-100'
                    }`}
                  >
                    Profile
                  </button>
                  <button
                    onClick={() => setActiveSection('notifications')}
                    className={`w-full text-left px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                      activeSection === 'notifications'
                        ? 'bg-[#C0152F] text-white'
                        : 'text-[#626C71] hover:bg-gray-100'
                    }`}
                  >
                    Notifications
                  </button>
                  <button
                    onClick={() => setActiveSection('account')}
                    className={`w-full text-left px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                      activeSection === 'account'
                        ? 'bg-[#C0152F] text-white'
                        : 'text-[#626C71] hover:bg-gray-100'
                    }`}
                  >
                    Account
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 rounded-md text-sm font-medium text-[#626C71] hover:bg-gray-100 transition-colors"
                  >
                    Logout
                  </button>
                </nav>
              </div>
            </div>

            {/* Right Main Content */}
            <div className="lg:col-span-3">
              {activeSection === 'profile' && (
                <div className="bg-white rounded-xl border border-[#5E5240]/10 p-6">
                  <h2 className="text-[#134252] text-2xl font-semibold mb-6">Profile Settings</h2>
                  
                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    {/* Profile Picture Section */}
                    <div className="flex items-center gap-6">
                      <div className="relative">
                        {profilePicture ? (
                          <img
                            src={profilePicture}
                            alt="Profile"
                            className="w-24 h-24 rounded-full object-cover border-2 border-[#C0152F]"
                          />
                        ) : (
                          <div className="w-24 h-24 rounded-full bg-[#C0152F] flex items-center justify-center text-white text-2xl font-semibold">
                            {getInitials(formData.name || user?.name)}
                          </div>
                        )}
                      </div>
                      <div>
                        <label htmlFor="profile-picture-upload" className="cursor-pointer">
                          <span className="inline-block bg-[#C0152F] text-white hover:bg-[#A01327] active:bg-[#8B1122] shadow-sm hover:shadow px-4 py-2 rounded-md text-sm font-medium transition-colors">
                            Change Photo
                          </span>
                          <input
                            id="profile-picture-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </label>
                        <p className="text-xs text-[#626C71] mt-2">JPG, PNG or GIF. Max size 5MB</p>
                      </div>
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-[#134252] mb-2">Full Name</label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          className="w-full rounded-md border border-[#5E5240]/20 bg-white px-3 py-2 text-sm text-[#134252] focus:outline-none focus:ring-2 focus:ring-[#21808D]"
                          placeholder="Enter your full name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[#134252] mb-2">Email Address</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          readOnly
                          disabled
                          className="w-full rounded-md border border-[#5E5240]/20 bg-gray-50 px-3 py-2 text-sm text-[#626C71] cursor-not-allowed"
                        />
                        <p className="text-xs text-[#626C71] mt-1">Email cannot be changed</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[#134252] mb-2">Phone Number</label>
                        <input
                          type="tel"
                          name="phoneNumber"
                          value={formData.phoneNumber}
                          onChange={handleInputChange}
                          className="w-full rounded-md border border-[#5E5240]/20 bg-white px-3 py-2 text-sm text-[#134252] focus:outline-none focus:ring-2 focus:ring-[#21808D]"
                          placeholder="Enter your phone number"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-[#5E5240]/10">
                      <button
                        type="submit"
                        disabled={loading || uploading}
                        className={`bg-[#C0152F] text-white hover:bg-[#A01327] active:bg-[#8B1122] shadow-sm hover:shadow px-6 py-2 rounded-md text-sm font-medium ${loading || uploading ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        {uploading ? 'Uploading...' : loading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {activeSection === 'notifications' && (
                <div className="bg-white rounded-xl border border-[#5E5240]/10 p-6">
                  <h2 className="text-[#134252] text-2xl font-semibold mb-6">Notification Settings</h2>
                  <p className="text-[#626C71] text-sm">Notification preferences coming soon...</p>
                </div>
              )}

              {activeSection === 'account' && (
                <div className="bg-white rounded-xl border border-[#5E5240]/10 p-6">
                  <h2 className="text-[#134252] text-2xl font-semibold mb-6">Account Management</h2>
                  
                  {/* Account Information */}
                  <div className="mb-8">
                    <h3 className="text-[#134252] text-lg font-semibold mb-4">Account Information</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between py-3 border-b border-[#5E5240]/10">
                        <span className="text-[#626C71] text-sm">Email Address</span>
                        <span className="text-[#134252] text-sm font-medium">{user?.email || 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between py-3 border-b border-[#5E5240]/10">
                        <span className="text-[#626C71] text-sm">Account Type</span>
                        <span className="text-[#134252] text-sm font-medium">
                          {user?.googleId ? 'Google Account' : 'Email Account'}
                        </span>
                      </div>
                      {user?.createdAt && (
                        <div className="flex items-center justify-between py-3 border-b border-[#5E5240]/10">
                          <span className="text-[#626C71] text-sm">Member Since</span>
                          <span className="text-[#134252] text-sm font-medium">
                            {new Date(user.createdAt).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Change Password Section */}
                  <div className="mb-8">
                    <h3 className="text-[#134252] text-lg font-semibold mb-4">Change Password</h3>
                    {user?.googleId && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                        <p className="text-blue-800 text-sm">
                          Your account is linked to Google. If you have set a password, you can change it here. If you don't have a password yet, leave the current password field empty and set a new password.
                        </p>
                      </div>
                    )}
                    <PasswordChangeForm 
                      userId={user?._id || user?.id}
                      isGoogleAccount={!!user?.googleId}
                      onSuccess={(msg) => {
                        setSuccess(msg || 'Password changed successfully!');
                        setTimeout(() => setSuccess(''), 3000);
                      }}
                      onError={(err) => {
                        setError(err);
                        setTimeout(() => setError(''), 5000);
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export default Settings;

