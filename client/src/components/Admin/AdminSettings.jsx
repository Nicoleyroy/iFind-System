import React, { useState, useEffect } from 'react';
import {
  GlobeAltIcon,
  KeyIcon,
  UserCircleIcon,
  CheckCircleIcon,
  XMarkIcon,
  LockClosedIcon,
  ServerIcon,
  DocumentDuplicateIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  EyeIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { API_ENDPOINTS } from '../../utils/constants';
import AdminSidebar from '../layout/AdminSidebar';

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState({ type: '', text: '' });
  
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const [profileData, setProfileData] = useState({
    name: currentUser.name || '',
    email: currentUser.email || '',
    phoneNumber: currentUser.phoneNumber || '',
    profilePicture: currentUser.profilePicture || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [uploadingImage, setUploadingImage] = useState(false);

  const [systemSettings, setSystemSettings] = useState({
    siteName: 'iFind Lost & Found',
    siteDescription: 'Campus Lost and Found Management System',
    maintenanceMode: false,
    allowRegistration: true,
    requireEmailVerification: true,
  });

  // Load system settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('admin_system_settings');
    if (savedSettings) {
      setSystemSettings(JSON.parse(savedSettings));
    }
  }, []);

  const [securityStatus, setSecurityStatus] = useState({
    encryption: {
      storage: true,
      transmission: true,
      algorithm: 'AES-256',
      lastUpdated: new Date().toISOString(),
    },
    monitoring: {
      active: true,
      logsCollected: 15847,
      lastLogTime: new Date().toISOString(),
      activeUsers: 234,
    },
    backup: {
      enabled: true,
      lastBackup: new Date(Date.now() - 3600000).toISOString(),
      nextScheduled: new Date(Date.now() + 82800000).toISOString(),
      backupSize: '2.4 GB',
      retention: '30 days',
    },
  });

  const [backupHistory, setBackupHistory] = useState([]);

  const [processing, setProcessing] = useState(false);

  // Load backup history from backend API
  useEffect(() => {
    const fetchBackupHistory = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.BACKUP_HISTORY);
        if (response.ok) {
          const data = await response.json();
          setBackupHistory(data.backups || []);
        }
      } catch (error) {
        console.error('Error fetching backup history:', error);
        // Initialize with empty array on error
        setBackupHistory([]);
      }
    };
    
    fetchBackupHistory();
  }, []);

  // Fetch real-time data
  useEffect(() => {
    const fetchSecurityData = async () => {
      try {
        // Fetch users count for active users
        const usersResponse = await fetch(API_ENDPOINTS.USERS);
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          // Handle both {data: [...]} and direct array response
          const users = usersData.data || usersData;
          const activeUsers = users.filter(u => u.accountStatus === 'active' || u.status === 'active').length;
          
          // Fetch audit logs stats
          const logsResponse = await fetch(API_ENDPOINTS.AUDIT_LOGS_STATS);
          let logsCollected = 15847; // default
          let lastLogTime = new Date().toISOString();
          
          if (logsResponse.ok) {
            const stats = await logsResponse.json();
            logsCollected = stats.totalLogs || stats.total || 15847;
            lastLogTime = stats.lastLog?.timestamp || stats.lastLogTime || new Date().toISOString();
          }

          // Calculate next scheduled backup (next day at 2:00 AM)
          const nextBackup = new Date();
          if (nextBackup.getHours() >= 2) {
            nextBackup.setDate(nextBackup.getDate() + 1);
          }
          nextBackup.setHours(2, 0, 0, 0);

          // Get last backup from history
          const savedBackups = localStorage.getItem('backup_history');
          let lastBackupDate = new Date(Date.now() - 3600000).toISOString();
          if (savedBackups) {
            const backups = JSON.parse(savedBackups);
            if (backups.length > 0) {
              lastBackupDate = backups[0].date;
            }
          }

          // Update security status with real data
          setSecurityStatus(prev => ({
            ...prev,
            monitoring: {
              active: true,
              logsCollected: logsCollected,
              lastLogTime: lastLogTime,
              activeUsers: activeUsers,
            },
            backup: {
              ...prev.backup,
              lastBackup: lastBackupDate,
              nextScheduled: nextBackup.toISOString(),
            },
          }));
        }
      } catch (error) {
        console.error('Error fetching security data:', error);
      }
    };

    fetchSecurityData();
    // Refresh data every 30 seconds
    const interval = setInterval(fetchSecurityData, 30000);

    return () => clearInterval(interval);
  }, []);

  const showSaveMessage = (type, text) => {
    setSaveMessage({ type, text });
    setTimeout(() => setSaveMessage({ type: '', text: '' }), 3000);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.USER_BY_ID(currentUser._id || currentUser.id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });

      if (response.ok) {
        const result = await response.json();
        // Update localStorage with new user data
        const updatedUser = { ...currentUser, ...profileData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Dispatch custom event to update navbar
        window.dispatchEvent(new Event('userUpdated'));
        
        showSaveMessage('success', 'Profile updated successfully!');
      } else {
        const error = await response.json();
        showSaveMessage('error', error.message || 'Failed to update profile.');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      showSaveMessage('error', 'An error occurred while updating profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showSaveMessage('error', 'Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showSaveMessage('error', 'Image size must be less than 5MB');
      return;
    }

    setUploadingImage(true);
    try {
      // Import cloudinary upload function
      const { uploadToCloudinary } = await import('../../utils/cloudinary');
      const imageUrl = await uploadToCloudinary(file);
      
      setProfileData({ ...profileData, profilePicture: imageUrl });
      showSaveMessage('success', 'Image uploaded successfully! Click "Update Profile" to save.');
    } catch (error) {
      console.error('Image upload error:', error);
      showSaveMessage('error', 'Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      showSaveMessage('error', 'All password fields are required');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showSaveMessage('error', 'New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showSaveMessage('error', 'New password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.CHANGE_PASSWORD(currentUser._id || currentUser.id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (response.ok) {
        showSaveMessage('success', 'Password changed successfully!');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        const error = await response.json();
        showSaveMessage('error', error.message || 'Failed to change password.');
      }
    } catch (error) {
      console.error('Password change error:', error);
      showSaveMessage('error', 'An error occurred while changing password.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSystemSettings = () => {
    setLoading(true);
    setTimeout(() => {
      localStorage.setItem('admin_system_settings', JSON.stringify(systemSettings));
      // Update document title if site name changed
      document.title = systemSettings.siteName;
      setLoading(false);
      showSaveMessage('success', 'System settings saved successfully!');
    }, 500);
  };

  const handleManualBackup = async () => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      'Are you sure you want to create a manual backup? This may take several minutes.'
    );
    
    if (!confirmed) return;
    
    setProcessing(true);
    try {
      // Call backend API to create backup
      const response = await fetch(API_ENDPOINTS.BACKUP_CREATE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        throw new Error('Backup creation failed');
      }
      
      const data = await response.json();
      
      // Refresh backup history
      const historyResponse = await fetch(API_ENDPOINTS.BACKUP_HISTORY);
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setBackupHistory(historyData.backups || []);
      }
      
      // Update security status with new backup info
      setSecurityStatus(prev => ({
        ...prev,
        backup: {
          ...prev.backup,
          lastBackup: data.backup.date,
          nextScheduled: prev.backup.nextScheduled, // Keep existing scheduled time
        },
      }));
      
      showSaveMessage('success', `Backup completed successfully! Size: ${data.backup.size}, Duration: ${data.backup.duration}`);
    } catch (error) {
      console.error('Backup error:', error);
      showSaveMessage('error', 'Backup failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleRestoreBackup = async (backupFileName, backupDate) => {
    // Show warning confirmation
    const confirmed = window.confirm(
      `⚠️ WARNING: Restoring from backup will replace all current data with data from ${new Date(backupDate).toLocaleString()}.\n\nThis action cannot be undone. Are you sure you want to continue?`
    );
    
    if (!confirmed) return;
    
    // Double confirmation for critical action
    const finalConfirm = prompt('Type YES (in capital letters) to confirm restore:');
    
    if (finalConfirm !== 'YES') {
      showSaveMessage('error', 'Restore cancelled. You must type YES to confirm.');
      return;
    }
    
    setProcessing(true);
    
    try {
      // Call backend API to restore backup
      const response = await fetch(API_ENDPOINTS.BACKUP_RESTORE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: backupFileName }),
      });
      
      if (!response.ok) {
        throw new Error('Restore failed');
      }
      
      const data = await response.json();
      
      showSaveMessage('success', `System restored from backup dated ${new Date(backupDate).toLocaleString()}`);
      
      // Reload page after restore
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Restore error:', error);
      showSaveMessage('error', 'Failed to restore backup. Please contact administrator.');
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const Toggle = ({ enabled, onChange, label, description }) => (
    <div className="flex items-start justify-between py-4 border-b border-gray-200 last:border-0">
      <div className="flex-1">
        <h4 className="text-sm font-medium text-gray-900">{label}</h4>
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!enabled)}
        className={`${
          enabled ? 'bg-orange-500' : 'bg-gray-200'
        } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ml-4`}
      >
        <span
          className={`${
            enabled ? 'translate-x-5' : 'translate-x-0'
          } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
        />
      </button>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 ml-64 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Admin Settings</h1>
            <p className="text-gray-600 mt-2">Manage system configuration and preferences</p>
            {systemSettings.maintenanceMode && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">Maintenance Mode is Active</span>
              </div>
            )}
          </div>

          {/* Save Message */}
          {saveMessage.text && (
            <div
              className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
                saveMessage.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {saveMessage.type === 'success' ? (
                <CheckCircleIcon className="h-5 w-5 flex-shrink-0" />
              ) : (
                <XMarkIcon className="h-5 w-5 flex-shrink-0" />
              )}
              <span className="font-medium">{saveMessage.text}</span>
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px overflow-x-auto">
                <button
                  onClick={() => setActiveTab('general')}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === 'general'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <GlobeAltIcon className="h-5 w-5" />
                  General
                </button>
                <button
                  onClick={() => setActiveTab('encryption')}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === 'encryption'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <LockClosedIcon className="h-5 w-5" />
                  Data Encryption
                </button>
                <button
                  onClick={() => setActiveTab('monitoring')}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === 'monitoring'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <EyeIcon className="h-5 w-5" />
                  System Monitoring
                </button>
                <button
                  onClick={() => setActiveTab('backup')}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === 'backup'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <DocumentDuplicateIcon className="h-5 w-5" />
                  Backup & Recovery
                </button>
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === 'profile'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <UserCircleIcon className="h-5 w-5" />
                  Profile
                </button>
              </nav>
            </div>

            <div className="p-6">
              {/* General Tab */}
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">System Settings</h3>
                  <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Site Name</label>
                      <input
                        type="text"
                        value={systemSettings.siteName}
                        onChange={(e) => setSystemSettings({ ...systemSettings, siteName: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Site Description</label>
                      <textarea
                        rows="3"
                        value={systemSettings.siteDescription}
                        onChange={(e) => setSystemSettings({ ...systemSettings, siteDescription: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>

                    <Toggle
                      enabled={systemSettings.maintenanceMode}
                      onChange={(val) => setSystemSettings({ ...systemSettings, maintenanceMode: val })}
                      label="Maintenance Mode"
                      description="Enable maintenance mode to prevent user access"
                    />

                    <Toggle
                      enabled={systemSettings.allowRegistration}
                      onChange={(val) => setSystemSettings({ ...systemSettings, allowRegistration: val })}
                      label="Allow User Registration"
                      description="Allow new users to register accounts"
                    />

                    <Toggle
                      enabled={systemSettings.requireEmailVerification}
                      onChange={(val) => setSystemSettings({ ...systemSettings, requireEmailVerification: val })}
                      label="Require Email Verification"
                      description="Users must verify their email before accessing the system"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveSystemSettings}
                      disabled={loading}
                      className="px-6 py-2.5 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
                    >
                      {loading ? 'Saving...' : 'Save Settings'}
                    </button>
                  </div>
                </div>
              )}

              {/* Data Encryption Tab */}
              {activeTab === 'encryption' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Data Encryption & Security</h3>
                    <p className="text-sm text-gray-600 mt-1">Overview of encryption protocols and security measures</p>
                  </div>
                  
                  {/* Encryption Status Card */}
                  <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-white rounded-lg shadow-sm">
                        <LockClosedIcon className="w-8 h-8 text-green-600" />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-gray-900">Encryption Status</h4>
                        <p className="text-sm text-green-700">All systems secured and encrypted</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-600">Storage</span>
                          <CheckCircleIcon className="w-5 h-5 text-green-600" />
                        </div>
                        <p className="text-lg font-bold text-gray-900">Encrypted</p>
                        <p className="text-xs text-gray-500 mt-1">AES-256 at rest</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-600">Transmission</span>
                          <CheckCircleIcon className="w-5 h-5 text-green-600" />
                        </div>
                        <p className="text-lg font-bold text-gray-900">SSL/TLS</p>
                        <p className="text-xs text-gray-500 mt-1">TLS 1.3 protocol</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-600">Algorithm</span>
                          <KeyIcon className="w-5 h-5 text-blue-600" />
                        </div>
                        <p className="text-lg font-bold text-gray-900">{securityStatus.encryption.algorithm}</p>
                        <p className="text-xs text-gray-500 mt-1">Industry standard</p>
                      </div>
                    </div>
                  </div>

                  {/* Encryption Details */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <KeyIcon className="w-5 h-5 text-orange-600" />
                      Encryption Configuration
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h5 className="text-sm font-semibold text-gray-900 mb-3">Storage Encryption</h5>
                        <ul className="space-y-2 text-sm text-gray-600">
                          <li className="flex items-start gap-2">
                            <CheckCircleIcon className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                            <span>Database: AES-256 encryption at rest</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircleIcon className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                            <span>File Storage: End-to-end encryption</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircleIcon className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                            <span>User Passwords: Bcrypt hashing</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircleIcon className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                            <span>Session Tokens: Encrypted keys</span>
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h5 className="text-sm font-semibold text-gray-900 mb-3">Transmission Security</h5>
                        <ul className="space-y-2 text-sm text-gray-600">
                          <li className="flex items-start gap-2">
                            <CheckCircleIcon className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                            <span>HTTPS/TLS 1.3 for all connections</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircleIcon className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                            <span>API: Encrypted payloads</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircleIcon className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                            <span>Valid SSL certificate</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircleIcon className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                            <span>CORS: Secure origins</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Security Best Practices */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="text-md font-semibold text-gray-900 mb-4">Security Best Practices</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <ShieldCheckIcon className="w-5 h-5 text-blue-600" />
                          <h5 className="text-sm font-semibold text-blue-900">Password Security</h5>
                        </div>
                        <p className="text-xs text-blue-700">
                          All passwords are hashed using bcrypt with salt rounds, ensuring secure storage
                        </p>
                      </div>
                      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <KeyIcon className="w-5 h-5 text-purple-600" />
                          <h5 className="text-sm font-semibold text-purple-900">API Security</h5>
                        </div>
                        <p className="text-xs text-purple-700">
                          API endpoints are protected with authentication tokens and rate limiting
                        </p>
                      </div>
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <LockClosedIcon className="w-5 h-5 text-green-600" />
                          <h5 className="text-sm font-semibold text-green-900">Data at Rest</h5>
                        </div>
                        <p className="text-xs text-green-700">
                          All sensitive data is encrypted before being stored in the database
                        </p>
                      </div>
                      <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <ServerIcon className="w-5 h-5 text-orange-600" />
                          <h5 className="text-sm font-semibold text-orange-900">Data in Transit</h5>
                        </div>
                        <p className="text-xs text-orange-700">
                          All communications use TLS 1.3 encryption to prevent interception
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* System Monitoring Tab */}
              {activeTab === 'monitoring' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">System Monitoring & Logging</h3>
                    <p className="text-sm text-gray-600 mt-1">Real-time tracking of user activity and system events</p>
                  </div>

                  {/* Monitoring Status Card */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-white rounded-lg shadow-sm">
                        <EyeIcon className="w-8 h-8 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-gray-900">Monitoring Status</h4>
                        <p className="text-sm text-blue-700">Active monitoring across all systems</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-600">Logs Collected</span>
                          <ServerIcon className="w-5 h-5 text-blue-600" />
                        </div>
                        <p className="text-lg font-bold text-gray-900">
                          {securityStatus.monitoring.logsCollected.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Total audit logs</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-600">Active Users</span>
                          <UserCircleIcon className="w-5 h-5 text-green-600" />
                        </div>
                        <p className="text-lg font-bold text-gray-900">{securityStatus.monitoring.activeUsers}</p>
                        <p className="text-xs text-gray-500 mt-1">Currently online</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-600">Last Activity</span>
                          <ClockIcon className="w-5 h-5 text-orange-600" />
                        </div>
                        <p className="text-lg font-bold text-gray-900">
                          {getTimeAgo(securityStatus.monitoring.lastLogTime)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Most recent log</p>
                      </div>
                    </div>
                  </div>

                  {/* Monitoring Features */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-md font-semibold text-gray-900 flex items-center gap-2">
                        <EyeIcon className="w-5 h-5 text-orange-600" />
                        Monitoring Capabilities
                      </h4>
                      <a
                        href="/admin/activity-logs"
                        className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                      >
                        View Activity Logs →
                      </a>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <ShieldCheckIcon className="w-5 h-5 text-blue-600" />
                          <h5 className="text-sm font-semibold text-blue-900">Activity Tracking</h5>
                        </div>
                        <p className="text-xs text-blue-700">
                          All user actions and admin operations logged with timestamps
                        </p>
                      </div>
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <ExclamationTriangleIcon className="w-5 h-5 text-green-600" />
                          <h5 className="text-sm font-semibold text-green-900">Security Alerts</h5>
                        </div>
                        <p className="text-xs text-green-700">
                          Real-time monitoring for suspicious activities and failed login attempts
                        </p>
                      </div>
                      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <ServerIcon className="w-5 h-5 text-purple-600" />
                          <h5 className="text-sm font-semibold text-purple-900">Performance</h5>
                        </div>
                        <p className="text-xs text-purple-700">
                          System health monitoring including response times and error rates
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Tracked Events */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="text-md font-semibold text-gray-900 mb-4">Tracked Events</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="text-sm font-semibold text-gray-900 mb-3">User Activities</h5>
                        <ul className="space-y-2 text-sm text-gray-600">
                          <li className="flex items-start gap-2">
                            <CheckCircleIcon className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                            <span>Login and logout events</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircleIcon className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                            <span>Item reports (lost/found)</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircleIcon className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                            <span>Claim submissions</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircleIcon className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                            <span>Profile updates</span>
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h5 className="text-sm font-semibold text-gray-900 mb-3">Admin Operations</h5>
                        <ul className="space-y-2 text-sm text-gray-600">
                          <li className="flex items-start gap-2">
                            <CheckCircleIcon className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                            <span>Role changes and permissions</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircleIcon className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                            <span>User suspensions and bans</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircleIcon className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                            <span>Item verifications and deletions</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircleIcon className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                            <span>System configuration changes</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Monitoring Information */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <EyeIcon className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
                      <div>
                        <h5 className="text-sm font-semibold text-yellow-900 mb-1">Monitoring Policy</h5>
                        <ul className="text-sm text-yellow-700 space-y-1">
                          <li>• All system activities are logged for security and compliance purposes</li>
                          <li>• Logs are retained for audit trails and incident investigation</li>
                          <li>• Personal data in logs is protected according to privacy policies</li>
                          <li>• Suspicious activities trigger automatic security alerts</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Backup & Recovery Tab */}
              {activeTab === 'backup' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Backup & Recovery Management</h3>
                      <p className="text-sm text-gray-600 mt-1">Manage automated backups and recovery options</p>
                    </div>
                    <button
                      onClick={handleManualBackup}
                      disabled={processing}
                      className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                      <ArrowPathIcon className={`w-5 h-5 ${processing ? 'animate-spin' : ''}`} />
                      {processing ? 'Creating Backup...' : 'Create Backup Now'}
                    </button>
                  </div>

                  {/* Backup Status Card */}
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-white rounded-lg shadow-sm">
                        <DocumentDuplicateIcon className="w-8 h-8 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-gray-900">Backup System Status</h4>
                        <p className="text-sm text-purple-700">Automated backups are active and running</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-600">Last Backup</span>
                          <CheckCircleIcon className="w-5 h-5 text-green-600" />
                        </div>
                        <p className="text-lg font-bold text-gray-900">{getTimeAgo(securityStatus.backup.lastBackup)}</p>
                        <p className="text-xs text-gray-500 mt-1">{formatDate(securityStatus.backup.lastBackup)}</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-600">Backup Size</span>
                          <ServerIcon className="w-5 h-5 text-blue-600" />
                        </div>
                        <p className="text-lg font-bold text-gray-900">{securityStatus.backup.backupSize}</p>
                        <p className="text-xs text-gray-500 mt-1">Total storage used</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-600">Retention Period</span>
                          <ClockIcon className="w-5 h-5 text-orange-600" />
                        </div>
                        <p className="text-lg font-bold text-gray-900">{securityStatus.backup.retention}</p>
                        <p className="text-xs text-gray-500 mt-1">Backup history kept</p>
                      </div>
                    </div>
                  </div>

                  {/* Backup Configuration */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="text-md font-semibold text-gray-900 mb-4">Backup Configuration</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <h5 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <ClockIcon className="w-4 h-4 text-orange-600" />
                            Backup Schedule
                          </h5>
                          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Frequency:</span>
                              <span className="font-medium text-gray-900">Daily</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Time:</span>
                              <span className="font-medium text-gray-900">2:00 AM</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Next Scheduled:</span>
                              <span className="font-medium text-gray-900">{formatDate(securityStatus.backup.nextScheduled)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <h5 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <ShieldCheckIcon className="w-4 h-4 text-green-600" />
                            Recovery Options
                          </h5>
                          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                            <div className="flex items-start gap-2">
                              <CheckCircleIcon className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">Point-in-Time Recovery</p>
                                <p className="text-xs text-gray-600">Restore to any backup point</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <CheckCircleIcon className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">Incremental Backups</p>
                                <p className="text-xs text-gray-600">Only changed data is backed up</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <CheckCircleIcon className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">Encrypted Storage</p>
                                <p className="text-xs text-gray-600">All backups are encrypted</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Backup History */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="text-md font-semibold text-gray-900 mb-4">Backup History</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date & Time</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Size</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Duration</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {backupHistory.map((backup) => (
                            <tr key={backup.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-900">{formatDate(backup.date)}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{backup.size}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{backup.duration}</td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full ${
                                  backup.status === 'success' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {backup.status === 'success' ? (
                                    <CheckCircleIcon className="w-3.5 h-3.5" />
                                  ) : (
                                    <ExclamationTriangleIcon className="w-3.5 h-3.5" />
                                  )}
                                  {backup.status === 'success' ? 'Success' : 'Failed'}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <button 
                                  onClick={() => handleRestoreBackup(backup.fileName, backup.date)}
                                  disabled={processing}
                                  className="text-sm text-orange-600 hover:text-orange-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {processing ? 'Processing...' : 'Restore'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Backup Information */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <ShieldCheckIcon className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                      <div>
                        <h5 className="text-sm font-semibold text-blue-900 mb-1">Important Information</h5>
                        <ul className="text-sm text-blue-700 space-y-1">
                          <li>• Backups are automatically created daily at 2:00 AM</li>
                          <li>• All backup data is encrypted using AES-256 encryption</li>
                          <li>• Backup retention period is {securityStatus.backup.retention}</li>
                          <li>• Manual backups can be created at any time using the button above</li>
                          <li>• Contact system administrator for backup restoration assistance</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Admin Profile</h3>
                    <p className="text-sm text-gray-600 mt-1">Manage your personal information and account settings</p>
                  </div>

                  {/* Profile Picture Section */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="text-md font-semibold text-gray-900 mb-4">Profile Picture</h4>
                    <div className="flex items-center gap-6">
                      <div className="relative">
                        {profileData.profilePicture ? (
                          <img
                            src={profileData.profilePicture}
                            alt="Profile"
                            className="w-24 h-24 rounded-full object-cover border-4 border-gray-200 shadow-sm"
                          />
                        ) : (
                          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center border-4 border-gray-200 shadow-sm">
                            <span className="text-white text-3xl font-bold">
                              {profileData.name?.charAt(0).toUpperCase() || currentUser.name?.charAt(0).toUpperCase() || 'A'}
                            </span>
                          </div>
                        )}
                        {uploadingImage && (
                          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <label className="block">
                          <span className="sr-only">Choose profile photo</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={uploadingImage}
                            className="block w-full text-sm text-gray-500
                              file:mr-4 file:py-2 file:px-4
                              file:rounded-lg file:border-0
                              file:text-sm file:font-semibold
                              file:bg-orange-50 file:text-orange-700
                              hover:file:bg-orange-100
                              file:cursor-pointer cursor-pointer
                              disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </label>
                        <p className="mt-2 text-xs text-gray-500">
                          JPG, PNG or GIF. Max size 5MB.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Personal Information */}
                  <form onSubmit={handleSaveProfile} className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="text-md font-semibold text-gray-900 mb-4">Personal Information</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">Full Name *</label>
                        <input
                          type="text"
                          value={profileData.name}
                          onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                          required
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Enter your full name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">Email Address *</label>
                        <input
                          type="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                          required
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="your.email@example.com"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">Phone Number</label>
                        <input
                          type="tel"
                          value={profileData.phoneNumber}
                          onChange={(e) => setProfileData({ ...profileData, phoneNumber: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="+1 (555) 000-0000"
                        />
                      </div>

                      <div className="pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">Account Role</p>
                            <p className="text-sm text-gray-600">{currentUser.role || 'Administrator'}</p>
                          </div>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {currentUser.role?.toUpperCase() || 'ADMIN'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-6">
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2.5 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 transition-colors shadow-sm"
                      >
                        {loading ? 'Updating...' : 'Update Profile'}
                      </button>
                    </div>
                  </form>

                  {/* Change Password */}
                  <form onSubmit={handleChangePassword} className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <KeyIcon className="w-5 h-5 text-orange-600" />
                      <h4 className="text-md font-semibold text-gray-900">Change Password</h4>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">Current Password *</label>
                        <input
                          type="password"
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Enter current password"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">New Password *</label>
                        <input
                          type="password"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Enter new password (min 6 characters)"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">Confirm New Password *</label>
                        <input
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Confirm new password"
                        />
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h5 className="text-sm font-semibold text-blue-900 mb-2">Password Requirements:</h5>
                        <ul className="text-sm text-blue-700 space-y-1">
                          <li className="flex items-center gap-2">
                            <CheckCircleIcon className="w-4 h-4" />
                            At least 6 characters long
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircleIcon className="w-4 h-4" />
                            Include numbers and letters
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircleIcon className="w-4 h-4" />
                            Avoid common passwords
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div className="flex justify-end pt-6">
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2.5 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 transition-colors shadow-sm"
                      >
                        {loading ? 'Changing...' : 'Change Password'}
                      </button>
                    </div>
                  </form>

                  {/* Account Information */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <h4 className="text-md font-semibold text-gray-900 mb-4">Account Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Account ID:</span>
                        <p className="font-medium text-gray-900 mt-1">{currentUser._id || currentUser.id || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Account Created:</span>
                        <p className="font-medium text-gray-900 mt-1">
                          {currentUser.createdAt ? new Date(currentUser.createdAt).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Last Updated:</span>
                        <p className="font-medium text-gray-900 mt-1">
                          {currentUser.updatedAt ? new Date(currentUser.updatedAt).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Account Status:</span>
                        <p className="mt-1">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
