import React, { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  UserPlusIcon,
  ShieldCheckIcon,
  XMarkIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { API_ENDPOINTS } from '../../utils/constants';
import AdminSidebar from '../layout/AdminSidebar';

const Permission = () => {
  const [users, setUsers] = useState([]);
  const [moderators, setModerators] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedModerator, setSelectedModerator] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [adminId, setAdminId] = useState(null);
  const [viewRole, setViewRole] = useState('moderator');
  const [assignRole, setAssignRole] = useState('moderator');

  useEffect(() => {
    fetchUsers();
    // Get admin ID from localStorage or session
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setAdminId(user._id || user.id);
    }
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.USERS);
      const data = await response.json();
      if (data.data && Array.isArray(data.data)) {
        setUsers(data.data);
        setModerators(data.data.filter((user) => user.role === 'moderator'));
        setAdmins(data.data.filter((user) => user.role === 'admin'));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredModerators = moderators.filter(
    (mod) =>
      mod.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mod.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAdmins = admins.filter(
    (admin) =>
      admin.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const regularUsers = users.filter(
    (user) => user.role !== 'moderator' && user.role !== 'admin'
  );

  const nonAdminUsers = users.filter(
    (user) => user.role !== 'admin'
  );

  const filteredRegularUsers = regularUsers.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredNonAdminUsers = nonAdminUsers.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleUserSelection = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleAssignRole = async () => {
    if (selectedUsers.length === 0) {
      alert('Please select at least one user to assign role');
      return;
    }

    const roleName = assignRole.charAt(0).toUpperCase() + assignRole.slice(1);
    const confirmMessage = selectedUsers.length === 1
      ? `Are you sure you want to assign this user as ${roleName}?${assignRole === 'admin' ? ' This will grant full system access.' : ''}`
      : `Are you sure you want to assign ${selectedUsers.length} users as ${roleName}?${assignRole === 'admin' ? ' This will grant full system access.' : ''}`;

    if (!window.confirm(confirmMessage)) return;

    setProcessing(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const userId of selectedUsers) {
        try {
          const requestBody = { role: assignRole };
          if (adminId) {
            requestBody.adminId = adminId;
          }

          const response = await fetch(API_ENDPOINTS.USER_BY_ID(userId), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
          });

          if (response.ok) {
            successCount++;
          } else {
            const errorData = await response.json();
            console.error(`Failed to assign role to user ${userId}:`, errorData);
            failCount++;
          }
        } catch (error) {
          console.error(`Error assigning role to user ${userId}:`, error);
          failCount++;
        }
      }

      if (successCount > 0) {
        alert(
          `Successfully assigned ${successCount} user(s) as ${roleName}.${
            failCount > 0 ? ` Failed to assign ${failCount} user(s).` : ''
          }\n\nThe action has been logged.`
        );
        setShowAddModal(false);
        setSelectedUsers([]);
        setAssignRole('moderator');
        fetchUsers();
      } else {
        alert('Failed to assign roles. Please try again.');
      }
    } catch (error) {
      console.error('Error in bulk role assignment:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleRevokeModerator = async () => {
    if (!selectedModerator) return;

    setProcessing(true);
    try {
      const requestBody = { role: 'user' };
      if (adminId) {
        requestBody.adminId = adminId;
      }

      const response = await fetch(API_ENDPOINTS.USER_BY_ID(selectedModerator._id || selectedModerator.id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        alert(
          `Successfully revoked moderator privileges from ${selectedModerator.name || selectedModerator.email}.\n\nThe action has been logged.`
        );
        setShowRevokeModal(false);
        setSelectedModerator(null);
        fetchUsers();
      } else {
        const data = await response.json();
        console.error('Failed to revoke moderator:', data);
        alert(data.message || 'Failed to revoke moderator privileges');
      }
    } catch (error) {
      console.error('Error revoking moderator:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 ml-64 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Role Management</h1>
              <p className="text-gray-600">Manage user roles and permissions</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition-colors"
            >
              <UserPlusIcon className="w-5 h-5" />
              Assign Role
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <ShieldCheckIcon className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Admins</p>
                  <p className="text-2xl font-bold text-gray-900">{admins.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <ShieldCheckIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Moderators</p>
                  <p className="text-2xl font-bold text-gray-900">{moderators.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <ShieldCheckIcon className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Staff</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {[...moderators, ...admins].filter((m) => (m.accountStatus || 'active') === 'active').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <ShieldCheckIcon className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Regular Users</p>
                  <p className="text-2xl font-bold text-gray-900">{regularUsers.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <select
                value={viewRole}
                onChange={(e) => setViewRole(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="admin">Admins</option>
                <option value="moderator">Moderators</option>
              </select>
            </div>
          </div>

          {/* Admins Grid */}
          {viewRole === 'admin' && (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Administrators</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {loading ? (
                  <div className="col-span-full text-center py-8">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-500 border-r-transparent"></div>
                  </div>
                ) : filteredAdmins.length === 0 ? (
                  <div className="col-span-full text-center py-8 text-gray-500">No administrators found</div>
                ) : (
                  filteredAdmins.map((admin) => (
                    <div
                      key={admin._id || admin.id}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-4 mb-4">
                        {admin.profilePicture ? (
                          <img
                            src={admin.profilePicture}
                            alt={admin.name || 'Admin'}
                            className="h-16 w-16 rounded-full object-cover border-2 border-purple-200 flex-shrink-0"
                          />
                        ) : (
                          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                            {(admin.name?.[0] || admin.email?.[0] || 'A').toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {admin.name || 'No name'}
                          </h3>
                          <p className="text-sm text-gray-600 truncate">{admin.email}</p>
                          <div className="mt-3 flex items-center gap-2">
                            <span
                              className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${
                                (admin.accountStatus || 'active') === 'active'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {(admin.accountStatus || 'active').charAt(0).toUpperCase() +
                                (admin.accountStatus || 'active').slice(1)}
                            </span>
                            <span className="inline-flex px-2.5 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                              Admin
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">Joined {formatDate(admin.createdAt)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedModerator(admin);
                          setShowRevokeModal(true);
                        }}
                        className="w-full px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors font-medium text-sm"
                      >
                        Revoke Admin Role
                      </button>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {/* Moderators Grid */}
          {viewRole === 'moderator' && (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Moderators</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                  <div className="col-span-full text-center py-8">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-500 border-r-transparent"></div>
                  </div>
                ) : filteredModerators.length === 0 ? (
                  <div className="col-span-full text-center py-8 text-gray-500">No moderators found</div>
                ) : (
                  filteredModerators.map((moderator) => (
                <div
                  key={moderator._id || moderator.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4 mb-4">
                    {moderator.profilePicture ? (
                      <img
                        src={moderator.profilePicture}
                        alt={moderator.name || 'Moderator'}
                        className="h-16 w-16 rounded-full object-cover border-2 border-blue-200 flex-shrink-0"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                        {(moderator.name?.[0] || moderator.email?.[0] || 'M').toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {moderator.name || 'No name'}
                      </h3>
                      <p className="text-sm text-gray-600 truncate">{moderator.email}</p>
                      <div className="mt-3 flex items-center gap-2">
                        <span
                          className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${
                            (moderator.accountStatus || 'active') === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {(moderator.accountStatus || 'active').charAt(0).toUpperCase() +
                            (moderator.accountStatus || 'active').slice(1)}
                        </span>
                        <span className="inline-flex px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          Moderator
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Joined {formatDate(moderator.createdAt)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedModerator(moderator);
                      setShowRevokeModal(true);
                    }}
                    className="w-full px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors font-medium text-sm"
                  >
                    Revoke Moderator Role
                  </button>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Assign Role Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Assign Role</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Select users and assign them a role
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setSelectedUsers([]);
                    setAssignRole('moderator');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              
              {/* Role Selection */}
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => setAssignRole('moderator')}
                  className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                    assignRole === 'moderator'
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <ShieldCheckIcon className="w-5 h-5 inline-block mr-2" />
                  Moderator
                </button>
                <button
                  onClick={() => setAssignRole('admin')}
                  className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                    assignRole === 'admin'
                      ? 'bg-purple-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <ShieldCheckIcon className="w-5 h-5 inline-block mr-2" />
                  Admin
                </button>
              </div>

              {selectedUsers.length > 0 && (
                <div className={`mt-4 px-4 py-2 rounded-lg border ${
                  assignRole === 'admin' 
                    ? 'bg-purple-50 border-purple-200' 
                    : 'bg-blue-50 border-blue-200'
                }`}>
                  <p className={`text-sm font-medium ${
                    assignRole === 'admin' ? 'text-purple-800' : 'text-blue-800'
                  }`}>
                    {selectedUsers.length} user(s) selected for {assignRole} role
                  </p>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Search */}
              <div className="mb-4">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* User List */}
              {(assignRole === 'moderator' ? filteredRegularUsers : filteredNonAdminUsers).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No users available to assign
                </div>
              ) : (
                <div className="space-y-3">
                  {(assignRole === 'moderator' ? filteredRegularUsers : filteredNonAdminUsers).map((user) => (
                    <div
                      key={user._id || user.id}
                      onClick={() => toggleUserSelection(user._id || user.id)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedUsers.includes(user._id || user.id)
                          ? assignRole === 'admin'
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                          {selectedUsers.includes(user._id || user.id) ? (
                            <div className={`w-6 h-6 rounded flex items-center justify-center ${
                              assignRole === 'admin' ? 'bg-purple-500' : 'bg-blue-500'
                            }`}>
                              <CheckIcon className="w-4 h-4 text-white" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 border-2 border-gray-300 rounded"></div>
                          )}
                        </div>
                        {user.profilePicture ? (
                          <img
                            src={user.profilePicture}
                            alt={user.name || 'User'}
                            className="h-12 w-12 rounded-full object-cover border-2 border-gray-200"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white font-bold">
                            {(user.name?.[0] || user.email?.[0] || 'U').toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-gray-900 truncate">
                            {user.name || 'No name'}
                          </h3>
                          <p className="text-sm text-gray-600 truncate">{user.email}</p>
                        </div>
                        <div>
                          <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${
                            user.role === 'moderator' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedUsers([]);
                  setAssignRole('moderator');
                }}
                disabled={processing}
                className="px-6 py-2.5 rounded-lg text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignRole}
                disabled={processing || selectedUsers.length === 0}
                className={`px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                  assignRole === 'admin'
                    ? 'bg-purple-500 hover:bg-purple-600'
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                {processing
                  ? 'Assigning...'
                  : `Assign ${selectedUsers.length > 0 ? `(${selectedUsers.length})` : ''} as ${assignRole.charAt(0).toUpperCase() + assignRole.slice(1)}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Role Modal */}
      {showRevokeModal && selectedModerator && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                Revoke {selectedModerator.role === 'admin' ? 'Admin' : 'Moderator'} Role
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                This action will remove {selectedModerator.role === 'admin' ? 'administrator' : 'moderator'} privileges
              </p>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-4 p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
                {selectedModerator.profilePicture ? (
                  <img
                    src={selectedModerator.profilePicture}
                    alt={selectedModerator.name || 'User'}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className={`h-12 w-12 rounded-full bg-gradient-to-br ${
                    selectedModerator.role === 'admin' 
                      ? 'from-purple-400 to-purple-600' 
                      : 'from-blue-400 to-blue-600'
                  } flex items-center justify-center text-white font-bold`}>
                    {(selectedModerator.name?.[0] || selectedModerator.email?.[0] || 'U').toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 truncate">
                    {selectedModerator.name || 'No name'}
                  </h3>
                  <p className="text-sm text-gray-600 truncate">{selectedModerator.email}</p>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Warning:</strong> This user will:
                </p>
                <ul className="list-disc list-inside text-sm text-yellow-800 mt-2 space-y-1">
                  {selectedModerator.role === 'admin' ? (
                    <>
                      <li>Lose all administrative privileges</li>
                      <li>No longer access admin panel</li>
                      <li>Unable to manage users or system settings</li>
                      <li>Be reverted to regular user status</li>
                    </>
                  ) : (
                    <>
                      <li>Lose access to moderator functionalities</li>
                      <li>No longer be able to review or verify items</li>
                      <li>Receive a notification about this change</li>
                      <li>Be reverted to regular user status</li>
                    </>
                  )}
                </ul>
              </div>
            </div>

            <div className="flex gap-3 justify-end p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowRevokeModal(false);
                  setSelectedModerator(null);
                }}
                disabled={processing}
                className="px-6 py-2.5 rounded-lg text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRevokeModerator}
                disabled={processing}
                className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? 'Revoking...' : `Revoke ${selectedModerator.role === 'admin' ? 'Admin' : 'Moderator'} Role`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Permission;
