// ModeratorSettings.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ModSidebar from '../layout/ModSidebar';
import { API_ENDPOINTS } from '../../utils/constants';
import { uploadToCloudinary } from '../../utils/cloudinary';

// --- Password Change Form ---
function PasswordChangeForm({ userId, isGoogleAccount, onSuccess, onError }) {
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  // Handle input changes
  const handleChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    setLocalError('');
  };

  // Handle password form submit
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
          currentPassword: passwordData.currentPassword || null,
          newPassword: passwordData.newPassword,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to change password');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      onSuccess('Password changed successfully!');
    } catch (err) {
      setLocalError(err.message || 'Failed to change password');
      onError(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-label="Change Password">
      {localError && (
        <div className="p-3 bg-orange-50 text-orange-700 text-sm rounded-md" role="alert">{localError}</div>
      )}
      <div>
        <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
          Current Password {isGoogleAccount && <span className="text-xs text-gray-500 font-normal">(optional if you don't have one)</span>}
        </label>
        <input
          id="currentPassword"
          type="password"
          name="currentPassword"
          value={passwordData.currentPassword}
          onChange={handleChange}
          required={!isGoogleAccount}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
          placeholder={isGoogleAccount ? 'Enter your current password (leave empty if you don\'t have one)' : 'Enter your current password'}
        />
      </div>
      <div>
        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
        <input
          id="newPassword"
          type="password"
          name="newPassword"
          value={passwordData.newPassword}
          onChange={handleChange}
          required
          minLength={6}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
          placeholder="Enter your new password (min. 6 characters)"
        />
      </div>
      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
        <input
          id="confirmPassword"
          type="password"
          name="confirmPassword"
          value={passwordData.confirmPassword}
          onChange={handleChange}
          required
          minLength={6}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
          placeholder="Confirm your new password"
        />
      </div>
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={loading}
          className={`bg-orange-500 text-white hover:bg-orange-600 active:bg-orange-700 shadow-sm hover:shadow px-6 py-2 rounded-md text-sm font-medium transition-colors ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          {loading ? 'Changing...' : 'Change Password'}
        </button>
      </div>
    </form>
  );
}

// --- Main Moderator Settings ---
function ModeratorSettings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', phoneNumber: '' });
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeSection, setActiveSection] = useState('profile');
  const [driveStatus, setDriveStatus] = useState({ connected: false });

  // Load user data from localStorage
  useEffect(() => {
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

  // Get initials for avatar
  const getInitials = (name) => {
    if (!name) return 'M';
    const parts = name.trim().split(' ');
    return parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();
  };

  // Handle profile picture change
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePictureFile(file);
      setProfilePicture(URL.createObjectURL(file));
    }
  };

  // Handle profile update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    setUploading(true);
    try {
      const userId = user?._id || user?.id;
      if (!user || !userId) throw new Error('User not found. Please log in again.');
      let profilePictureUrl = profilePicture;
      if (profilePictureFile) {
        try {
          profilePictureUrl = await uploadToCloudinary(profilePictureFile);
        } catch (uploadErr) {
          throw new Error(`Failed to upload profile picture: ${uploadErr.message}`);
        }
      }
      const payload = { name: formData.name, phoneNumber: formData.phoneNumber, profilePicture: profilePictureUrl };
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

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Handle input changes
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Google Drive helpers
  const fetchDriveStatus = async () => {
    try {
      const res = await fetch('/api/backup/drive/status');
      const json = await res.json();
      setDriveStatus(json);
    } catch (e) {
      console.warn('Failed to fetch drive status', e);
    }
  };

  useEffect(() => {
    fetchDriveStatus();
  }, []);

  const handleConnectDrive = () => {
    // Open OAuth flow in new window/tab
    window.open('/api/backup/drive/connect', '_blank', 'noopener,noreferrer');
  };

  const handleUploadToDrive = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      // Create a backup first - use direct server URL to bypass Vite proxy timeout
      const createRes = await fetch('http://localhost:4000/api/backup/create', { 
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      
      // Check if response is actually JSON
      const contentType = createRes.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await createRes.text();
        console.error('Non-JSON response:', text);
        throw new Error('Server returned an invalid response. Please check server logs.');
      }
      
      const createJson = await createRes.json();
      if (!createRes.ok) throw new Error(createJson.message || 'Failed to create backup');
      const fileName = createJson.backup.fileName;

      // Upload to Drive - use direct server URL to bypass Vite proxy timeout
      const uploadRes = await fetch('http://localhost:4000/api/backup/drive/upload', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName }),
      });
      
      // Get the response text first to see what we're dealing with
      const uploadText = await uploadRes.text();
      console.log('Upload response text:', uploadText);
      console.log('Upload response status:', uploadRes.status);
      console.log('Upload response content-type:', uploadRes.headers.get('content-type'));
      
      // Try to parse as JSON
      let uploadJson;
      try {
        uploadJson = JSON.parse(uploadText);
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        throw new Error('Server returned an invalid response: ' + uploadText);
      }
      
      if (!uploadRes.ok) throw new Error(uploadJson.message || uploadJson.error || 'Failed to upload to Drive');

      setSuccess('Backup uploaded to Google Drive successfully');
      setTimeout(() => setSuccess(''), 4000);
      fetchDriveStatus();
    } catch (err) {
      console.error('Drive upload error:', err);
      setError(err.message || 'Drive upload failed');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <ModSidebar />
      <main className="flex-1 md:ml-64 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h1 className="text-gray-900 text-3xl font-semibold">Moderator Settings</h1>
            <p className="text-gray-600 text-sm mt-1">Manage your moderator profile and account settings</p>
          </div>
          {/* Success/Error Messages */}
          {success && (
            <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded-md" role="alert">{success}</div>
          )}
          {error && (
            <div className="mb-4 p-3 bg-orange-50 text-orange-700 text-sm rounded-md" role="alert">{error}</div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="mb-4">
                  <h2 className="text-gray-900 text-xl font-semibold mb-1">Settings</h2>
                  <p className="text-gray-600 text-xs">Manage your account preferences</p>
                </div>
                <nav className="space-y-1" aria-label="Settings Navigation">
                  <button
                    onClick={() => setActiveSection('profile')}
                    className={`w-full text-left px-4 py-3 rounded-md text-sm font-medium transition-colors ${activeSection === 'profile' ? 'bg-orange-500 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                    aria-current={activeSection === 'profile' ? 'page' : undefined}
                  >
                    Profile
                  </button>
                  <button
                    onClick={() => setActiveSection('account')}
                    className={`w-full text-left px-4 py-3 rounded-md text-sm font-medium transition-colors ${activeSection === 'account' ? 'bg-orange-500 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                    aria-current={activeSection === 'account' ? 'page' : undefined}
                  >
                    Account
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Logout
                  </button>
                </nav>
              </div>
            </div>
            {/* Main Content */}
            <div className="lg:col-span-3">
              {activeSection === 'profile' && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <h2 className="text-gray-900 text-2xl font-semibold mb-6">Profile Settings</h2>
                  <form onSubmit={handleProfileUpdate} className="space-y-6" aria-label="Profile Settings">
                    {/* Profile Picture */}
                    <div className="flex items-center gap-6">
                      <div className="relative">
                        {profilePicture ? (
                          <img src={profilePicture} alt="Profile" className="w-24 h-24 rounded-full object-cover border-2 border-orange-500" />
                        ) : (
                          <div className="w-24 h-24 rounded-full bg-orange-500 flex items-center justify-center text-white text-2xl font-semibold" aria-label="Avatar">
                            {getInitials(formData.name || user?.name)}
                          </div>
                        )}
                      </div>
                      <div>
                        <label htmlFor="profile-picture-upload" className="cursor-pointer">
                          <span className="inline-block bg-orange-500 text-white hover:bg-orange-600 active:bg-orange-700 shadow-sm hover:shadow px-4 py-2 rounded-md text-sm font-medium transition-colors">Change Photo</span>
                          <input id="profile-picture-upload" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                        </label>
                        <p className="text-xs text-gray-600 mt-2">JPG, PNG or GIF. Max size 5MB</p>
                      </div>
                    </div>
                    {/* Form Fields */}
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                        <input
                          id="name"
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="Enter your full name"
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                        <input
                          id="email"
                          type="email"
                          name="email"
                          value={formData.email}
                          readOnly
                          disabled
                          className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
                        />
                        <p className="text-xs text-gray-600 mt-1">Email cannot be changed</p>
                      </div>
                      <div>
                        <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                        <input
                          id="phoneNumber"
                          type="tel"
                          name="phoneNumber"
                          value={formData.phoneNumber}
                          onChange={handleInputChange}
                          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="Enter your phone number"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end pt-4 border-t border-gray-200">
                      <button
                        type="submit"
                        disabled={loading || uploading}
                        className={`bg-orange-500 text-white hover:bg-orange-600 active:bg-orange-700 shadow-sm hover:shadow px-6 py-2 rounded-md text-sm font-medium ${loading || uploading ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        {uploading ? 'Uploading...' : loading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
              {activeSection === 'account' && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <h2 className="text-gray-900 text-2xl font-semibold mb-6">Account Management</h2>
                  {/* Google Drive Backup Section */}
                  <div className="mb-6">
                    <h3 className="text-gray-900 text-lg font-semibold mb-3">Google Drive Backups</h3>
                    <p className="text-sm text-gray-600 mb-3">Connect your Google Drive to upload backups directly from the dashboard.</p>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleConnectDrive}
                        className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                      >
                        {driveStatus && driveStatus.connected ? 'Reconnect Google Drive' : 'Connect Google Drive'}
                      </button>
                      <button
                        type="button"
                        onClick={handleUploadToDrive}
                        disabled={!driveStatus || !driveStatus.connected || loading}
                        className={`px-4 py-2 rounded-md text-white ${(!driveStatus || !driveStatus.connected || loading) ? 'bg-gray-400 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600'}`}
                      >
                        {loading ? 'Uploading...' : 'Create & Upload Backup'}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Status: {driveStatus && driveStatus.connected ? 'Connected' : 'Not connected'}</p>
                  </div>
                  {/* Account Information */}
                  <div className="mb-8">
                    <h3 className="text-gray-900 text-lg font-semibold mb-4">Account Information</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between py-3 border-b border-gray-200">
                        <span className="text-gray-600 text-sm">Email Address</span>
                        <span className="text-gray-900 text-sm font-medium">{user?.email || 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between py-3 border-b border-gray-200">
                        <span className="text-gray-600 text-sm">Role</span>
                        <span className="text-gray-900 text-sm font-medium">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">Moderator</span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-3 border-b border-gray-200">
                        <span className="text-gray-600 text-sm">Account Type</span>
                        <span className="text-gray-900 text-sm font-medium">{user?.googleId ? 'Google Account' : 'Email Account'}</span>
                      </div>
                      {user?.createdAt && (
                        <div className="flex items-center justify-between py-3 border-b border-gray-200">
                          <span className="text-gray-600 text-sm">Member Since</span>
                          <span className="text-gray-900 text-sm font-medium">{new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Change Password Section */}
                  <div className="mb-8">
                    <h3 className="text-gray-900 text-lg font-semibold mb-4">Change Password</h3>
                    {user?.googleId && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                        <p className="text-blue-800 text-sm">Your account is linked to Google. If you have set a password, you can change it here. If you don't have a password yet, leave the current password field empty and set a new password.</p>
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
    </div>
  );
}

export default ModeratorSettings;
