import React, { useState, useEffect } from 'react';
import {
  BellIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  KeyIcon,
  UserCircleIcon,
  CheckCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { API_ENDPOINTS } from '../../utils/constants';
import AdminSidebar from '../layout/AdminSidebar';

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState({ type: '', text: '' });
  
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const [profileData, setProfileData] = useState({
    firstName: currentUser.firstName || '',
    lastName: currentUser.lastName || '',
    email: currentUser.email || '',
  });

  const [systemSettings, setSystemSettings] = useState({
    siteName: 'iFind Lost & Found',
    siteDescription: 'Campus Lost and Found Management System',
    maintenanceMode: false,
    allowRegistration: true,
    requireEmailVerification: true,
  });

  const [securitySettings, setSecuritySettings] = useState({
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    requireStrongPassword: true,
    enableTwoFactor: false,
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    newUserAlerts: true,
    itemReportAlerts: true,
    claimRequestAlerts: true,
  });

  const showSaveMessage = (type, text) => {
    setSaveMessage({ type, text });
    setTimeout(() => setSaveMessage({ type: '', text: '' }), 3000);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.USER_BY_ID(currentUser.id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });

      if (response.ok) {
        const updatedUser = { ...currentUser, ...profileData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        showSaveMessage('success', 'Profile updated successfully!');
      } else {
        showSaveMessage('error', 'Failed to update profile.');
      }
    } catch (error) {
      showSaveMessage('error', 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSystemSettings = () => {
    setLoading(true);
    setTimeout(() => {
      localStorage.setItem('admin_system_settings', JSON.stringify(systemSettings));
      setLoading(false);
      showSaveMessage('success', 'System settings saved successfully!');
    }, 500);
  };

  const handleSaveSecuritySettings = () => {
    setLoading(true);
    setTimeout(() => {
      localStorage.setItem('admin_security_settings', JSON.stringify(securitySettings));
      setLoading(false);
      showSaveMessage('success', 'Security settings saved successfully!');
    }, 500);
  };

  const handleSaveNotificationSettings = () => {
    setLoading(true);
    setTimeout(() => {
      localStorage.setItem('admin_notification_settings', JSON.stringify(notificationSettings));
      setLoading(false);
      showSaveMessage('success', 'Notification settings saved successfully!');
    }, 500);
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
                  onClick={() => setActiveTab('security')}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === 'security'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <ShieldCheckIcon className="h-5 w-5" />
                  Security
                </button>
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === 'notifications'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <BellIcon className="h-5 w-5" />
                  Notifications
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

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Security Settings</h3>
                  <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Session Timeout (minutes)</label>
                      <select
                        value={securitySettings.sessionTimeout}
                        onChange={(e) => setSecuritySettings({ ...securitySettings, sessionTimeout: parseInt(e.target.value) })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        <option value="15">15 minutes</option>
                        <option value="30">30 minutes</option>
                        <option value="60">1 hour</option>
                        <option value="120">2 hours</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Max Login Attempts</label>
                      <input
                        type="number"
                        value={securitySettings.maxLoginAttempts}
                        onChange={(e) => setSecuritySettings({ ...securitySettings, maxLoginAttempts: parseInt(e.target.value) })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Password Minimum Length</label>
                      <input
                        type="number"
                        value={securitySettings.passwordMinLength}
                        onChange={(e) => setSecuritySettings({ ...securitySettings, passwordMinLength: parseInt(e.target.value) })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>

                    <Toggle
                      enabled={securitySettings.requireStrongPassword}
                      onChange={(val) => setSecuritySettings({ ...securitySettings, requireStrongPassword: val })}
                      label="Require Strong Passwords"
                      description="Passwords must contain uppercase, lowercase, numbers, and special characters"
                    />

                    <Toggle
                      enabled={securitySettings.enableTwoFactor}
                      onChange={(val) => setSecuritySettings({ ...securitySettings, enableTwoFactor: val })}
                      label="Enable Two-Factor Authentication"
                      description="Require 2FA for admin accounts"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveSecuritySettings}
                      disabled={loading}
                      className="px-6 py-2.5 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
                    >
                      {loading ? 'Saving...' : 'Save Security Settings'}
                    </button>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Notification Settings</h3>
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <Toggle
                      enabled={notificationSettings.emailNotifications}
                      onChange={(val) => setNotificationSettings({ ...notificationSettings, emailNotifications: val })}
                      label="Email Notifications"
                      description="Receive notifications via email"
                    />
                    <Toggle
                      enabled={notificationSettings.newUserAlerts}
                      onChange={(val) => setNotificationSettings({ ...notificationSettings, newUserAlerts: val })}
                      label="New User Alerts"
                      description="Get notified when new users register"
                    />
                    <Toggle
                      enabled={notificationSettings.itemReportAlerts}
                      onChange={(val) => setNotificationSettings({ ...notificationSettings, itemReportAlerts: val })}
                      label="Item Report Alerts"
                      description="Get notified when items are reported"
                    />
                    <Toggle
                      enabled={notificationSettings.claimRequestAlerts}
                      onChange={(val) => setNotificationSettings({ ...notificationSettings, claimRequestAlerts: val })}
                      label="Claim Request Alerts"
                      description="Get notified about claim requests"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveNotificationSettings}
                      disabled={loading}
                      className="px-6 py-2.5 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
                    >
                      {loading ? 'Saving...' : 'Save Notification Settings'}
                    </button>
                  </div>
                </div>
              )}

              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Admin Profile</h3>
                  <form onSubmit={handleSaveProfile} className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">First Name</label>
                        <input
                          type="text"
                          value={profileData.firstName}
                          onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">Last Name</label>
                        <input
                          type="text"
                          value={profileData.lastName}
                          onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Email Address</label>
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2.5 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
                      >
                        {loading ? 'Updating...' : 'Update Profile'}
                      </button>
                    </div>
                  </form>
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
