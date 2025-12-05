import React, { useState, useEffect } from 'react';
import {
  ShieldCheckIcon,
  LockClosedIcon,
  ServerIcon,
  DocumentDuplicateIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  EyeIcon,
  KeyIcon,
} from '@heroicons/react/24/outline';
import AdminSidebar from '../layout/AdminSidebar';
import { success as swalSuccess } from '../../utils/swal';

const Security = () => {
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

  const [backupHistory, setBackupHistory] = useState([
    {
      id: 1,
      date: new Date(Date.now() - 3600000).toISOString(),
      size: '2.4 GB',
      status: 'success',
      duration: '5m 23s',
    },
    {
      id: 2,
      date: new Date(Date.now() - 90000000).toISOString(),
      size: '2.3 GB',
      status: 'success',
      duration: '5m 18s',
    },
    {
      id: 3,
      date: new Date(Date.now() - 176400000).toISOString(),
      size: '2.3 GB',
      status: 'success',
      duration: '5m 15s',
    },
  ]);

  const [processing, setProcessing] = useState(false);

  const handleManualBackup = () => {
    setProcessing(true);
    // Simulate backup process
    setTimeout(() => {
      const newBackup = {
        id: backupHistory.length + 1,
        date: new Date().toISOString(),
        size: '2.4 GB',
        status: 'success',
        duration: '5m 20s',
      };
      setBackupHistory([newBackup, ...backupHistory]);
      setSecurityStatus(prev => ({
        ...prev,
        backup: {
          ...prev.backup,
          lastBackup: new Date().toISOString(),
        },
      }));
      setProcessing(false);
      swalSuccess('Backup completed', 'Backup completed successfully!');
    }, 3000);
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

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 ml-64 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Security & Compliance</h1>
            <p className="text-gray-600">Monitor encryption, logging, and backup systems</p>
          </div>

          {/* Security Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Encryption Status */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <LockClosedIcon className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-600">Data Encryption</h3>
                    <p className="text-2xl font-bold text-gray-900">Active</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Storage</span>
                  <span className={`flex items-center gap-1 ${
                    securityStatus.encryption.storage ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <CheckCircleIcon className="w-4 h-4" />
                    {securityStatus.encryption.storage ? 'Encrypted' : 'Not Encrypted'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Transmission</span>
                  <span className={`flex items-center gap-1 ${
                    securityStatus.encryption.transmission ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <CheckCircleIcon className="w-4 h-4" />
                    {securityStatus.encryption.transmission ? 'SSL/TLS' : 'Not Encrypted'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Algorithm</span>
                  <span className="text-gray-900 font-medium">{securityStatus.encryption.algorithm}</span>
                </div>
              </div>
            </div>

            {/* Monitoring Status */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <EyeIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-600">System Monitoring</h3>
                    <p className="text-2xl font-bold text-gray-900">Active</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Logs Collected</span>
                  <span className="text-gray-900 font-medium">
                    {securityStatus.monitoring.logsCollected.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Active Users</span>
                  <span className="text-gray-900 font-medium">{securityStatus.monitoring.activeUsers}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Last Activity</span>
                  <span className="text-gray-900 font-medium">
                    {getTimeAgo(securityStatus.monitoring.lastLogTime)}
                  </span>
                </div>
              </div>
            </div>

            {/* Backup Status */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <DocumentDuplicateIcon className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-600">Backup System</h3>
                    <p className="text-2xl font-bold text-gray-900">Enabled</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Last Backup</span>
                  <span className="text-gray-900 font-medium">
                    {getTimeAgo(securityStatus.backup.lastBackup)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Backup Size</span>
                  <span className="text-gray-900 font-medium">{securityStatus.backup.backupSize}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Retention</span>
                  <span className="text-gray-900 font-medium">{securityStatus.backup.retention}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Encryption Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <KeyIcon className="w-6 h-6 text-orange-600" />
              Encryption Configuration
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Storage Encryption</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircleIcon className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Database: AES-256 encryption at rest</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircleIcon className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>File Storage: End-to-end encryption for uploads</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircleIcon className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>User Passwords: Bcrypt hashing with salt rounds</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircleIcon className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Session Tokens: Encrypted with secure keys</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Transmission Security</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircleIcon className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>HTTPS/TLS 1.3 for all connections</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircleIcon className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>API Communication: Encrypted payloads</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircleIcon className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Certificate: Valid SSL certificate installed</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircleIcon className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>CORS Policy: Configured for secure origins</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Monitoring & Logging */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <EyeIcon className="w-6 h-6 text-orange-600" />
                System Monitoring & Logging
              </h2>
              <a
                href="/admin/activity-logs"
                className="text-sm text-orange-600 hover:text-orange-700 font-medium"
              >
                View All Logs →
              </a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheckIcon className="w-5 h-5 text-blue-600" />
                  <h3 className="text-sm font-semibold text-blue-900">Activity Tracking</h3>
                </div>
                <p className="text-xs text-blue-700">
                  All user actions, admin operations, and system events are logged with timestamps and user information
                </p>
              </div>
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <ExclamationTriangleIcon className="w-5 h-5 text-green-600" />
                  <h3 className="text-sm font-semibold text-green-900">Security Alerts</h3>
                </div>
                <p className="text-xs text-green-700">
                  Real-time monitoring for suspicious activities, failed login attempts, and unauthorized access
                </p>
              </div>
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <ServerIcon className="w-5 h-5 text-purple-600" />
                  <h3 className="text-sm font-semibold text-purple-900">Performance Metrics</h3>
                </div>
                <p className="text-xs text-purple-700">
                  System health monitoring including response times, error rates, and resource usage
                </p>
              </div>
            </div>
          </div>

          {/* Backup & Recovery */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <DocumentDuplicateIcon className="w-6 h-6 text-orange-600" />
                Backup & Recovery
              </h2>
              <button
                onClick={handleManualBackup}
                disabled={processing}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowPathIcon className={`w-5 h-5 ${processing ? 'animate-spin' : ''}`} />
                {processing ? 'Creating Backup...' : 'Create Backup Now'}
              </button>
            </div>

            {/* Backup Schedule Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <ClockIcon className="w-5 h-5 text-gray-600" />
                  <h3 className="text-sm font-semibold text-gray-900">Backup Schedule</h3>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>Automatic backups run daily at 2:00 AM</p>
                  <p>Next scheduled: {formatDate(securityStatus.backup.nextScheduled)}</p>
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheckIcon className="w-5 h-5 text-gray-600" />
                  <h3 className="text-sm font-semibold text-gray-900">Recovery Options</h3>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>Point-in-time recovery available</p>
                  <p>Retention period: {securityStatus.backup.retention}</p>
                </div>
              </div>
            </div>

            {/* Backup History */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Recent Backups</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date & Time</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Size</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Duration</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Security;
