import React, { useState, useEffect, useCallback } from "react";
import {
  Bell,
  Trash2,
  Check,
  Ban,
  Search,
} from "lucide-react";
import Sidebar from "./AdminSidebar";

const PAGE_SIZE = 10;

function ConfirmDeleteModal({ visible, userName, onCancel, onConfirm }) {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 backdrop-blur-sm bg-black/20"></div>
      <div className="relative bg-white rounded-xl shadow-lg max-w-sm w-full p-6">
        <h3 className="text-lg font-semibold mb-4">Confirm Deletion</h3>
        <p className="mb-6 text-gray-700">Are you sure you want to delete user <b>{userName}</b>?</p>
        <div className="flex justify-end gap-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-rose-950 text-white hover:bg-rose-800 transition"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmStatusChangeModal({ visible, userName, currentStatus, onCancel, onConfirm }) {
  if (!visible) return null;
  const isDisabling = currentStatus === "Active";
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 backdrop-blur-sm bg-black/20"></div>
      <div className="relative bg-white rounded-xl shadow-lg max-w-sm w-full p-6">
        <h3 className="text-lg font-semibold mb-4">{isDisabling ? "Confirm Disable" : "Confirm Activate"}</h3>
        <p className="mb-6 text-gray-700">
          Are you sure you want to {isDisabling ? "disable" : "activate"} user <b>{userName}</b>?
        </p>
        <div className="flex justify-end gap-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-white transition ${
              isDisabling ? "bg-rose-950 hover:bg-rose-800" : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {isDisabling ? "Disable" : "Activate"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ManageUsers() {
  const API_URL = "http://localhost:4000";

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: "name", direction: "asc" });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [userToToggle, setUserToToggle] = useState(null);

  const roles = ["", "user", "moderator", "admin"];

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/users`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load users");
      const normalizedUsers = data.data.map((u) => ({
        ...u,
        role: u.role?.toLowerCase() || "user",
        status: u.status || "Active",
      }));
      setUsers(normalizedUsers);
      setError(null);
      setCurrentPage(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const sortedUsers = React.useMemo(() => {
    let sortableUsers = [...users];
    if (sortConfig.key) {
      sortableUsers.sort((a, b) => {
        const aVal = a[sortConfig.key]?.toString().toLowerCase() || "";
        const bVal = b[sortConfig.key]?.toString().toLowerCase() || "";
        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return sortableUsers;
  }, [users, sortConfig]);

  const filteredUsers = sortedUsers.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchesRole = roleFilter === "" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const pageCount = Math.ceil(filteredUsers.length / PAGE_SIZE);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleSort = (key) => {
    setSortConfig((current) => {
      if (current.key === key) {
        return { key, direction: current.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  const setLoadingForUser = (id) => setActionLoading(id);
  const clearLoading = () => setActionLoading(null);

  const updateRole = async (id, newRole) => {
    setLoadingForUser(id);
    try {
      const res = await fetch(`${API_URL}/users/${id}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error updating role");

      setUsers((prev) =>
        prev.map((user) => (user._id === id ? { ...user, role: newRole } : user))
      );
      setError(null);
    } catch (err) {
      alert("Error updating role: " + err.message);
    } finally {
      clearLoading();
    }
  };

  const openStatusModal = (user) => {
    setUserToToggle(user);
    setShowStatusModal(true);
  };

  const closeStatusModal = () => {
    setUserToToggle(null);
    setShowStatusModal(false);
  };

  const confirmToggleStatus = async () => {
    if (!userToToggle) return;
    setLoadingForUser(userToToggle._id);
    const newStatus = userToToggle.status === "Active" ? "Disabled" : "Active";
    try {
      const res = await fetch(`${API_URL}/users/${userToToggle._id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error updating status");

      setUsers((prev) =>
        prev.map((u) => (u._id === userToToggle._id ? { ...u, status: newStatus } : u))
      );
      setError(null);
    } catch (err) {
      alert("Error updating status: " + err.message);
    } finally {
      clearLoading();
      closeStatusModal();
    }
  };

  const openDeleteModal = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setUserToDelete(null);
    setShowDeleteModal(false);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    setLoadingForUser(userToDelete._id);
    try {
      const res = await fetch(`${API_URL}/users/${userToDelete._id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error deleting user");

      setUsers((prev) => prev.filter((u) => u._id !== userToDelete._id));
      setError(null);
    } catch (err) {
      alert("Error deleting user: " + err.message);
    } finally {
      clearLoading();
      closeDeleteModal();
    }
  };

  return (
    <div className="flex bg-gray-50 min-h-screen text-gray-800">
      <Sidebar />

      <main className="flex-1 ml-64 p-10">
        {/* Header */}
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Manage Users
          </h2>
          <div className="flex items-center gap-4">
            <Bell className="w-6 h-6 text-gray-600 cursor-pointer" />
            <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex justify-between items-center mb-6">
          {/* Search */}
          <div className="relative w-80">
            <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search users..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 bg-white shadow-sm focus:ring-2 focus:ring-red-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Role Filter */}
          <select
            className="px-3 py-2 rounded-lg border border-gray-300 bg-white shadow-sm focus:ring-2 focus:ring-red-300"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">All Roles</option>
            {["user", "moderator", "admin"].map((role) => (
              <option key={role} value={role}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Loading/Error */}
        {loading && <p>Loading users...</p>}
        {error && <p className="text-red-500 mb-2">{error}</p>}

        {/* Users Table */}
        <div className="bg-white shadow-lg rounded-2xl p-6 border border-gray-100">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {["name", "email", "role", "status"].map((col) => (
                    <th
                      key={col}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                      onClick={() => handleSort(col)}
                    >
                      {col.charAt(0).toUpperCase() + col.slice(1)}
                      {sortConfig.key === col && (
                        <span>{sortConfig.direction === "asc" ? " ▲" : " ▼"}</span>
                      )}
                    </th>
                  ))}
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedUsers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      No users found.
                    </td>
                  </tr>
                )}
                {paginatedUsers.map((user) => (
                  <tr
                    key={user._id}
                    className={`hover:bg-gray-50 ${
                      actionLoading === user._id ? "opacity-50" : ""
                    }`}
                  >
                    <td className="px-6 py-4">{user.name}</td>
                    <td className="px-6 py-4">{user.email}</td>
                    <td className="px-6 py-4">
                      {user.role === "user" ? (
                        <span className="px-3 py-1 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed select-none">
                          User
                        </span>
                      ) : (
                        <select
                          value={user.role}
                          disabled={actionLoading === user._id}
                          onChange={(e) => updateRole(user._id, e.target.value)}
                          className="px-3 py-1 rounded-lg border bg-gray-50 cursor-pointer shadow-sm"
                        >
                          {["moderator", "admin"].map((role) => (
                            <option key={role} value={role}>
                              {role.charAt(0).toUpperCase() + role.slice(1)}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          user.status === "Active"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-300 text-gray-700"
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <button
                        onClick={() => openStatusModal(user)}
                        disabled={actionLoading === user._id}
                        className="p-2 rounded-lg hover:bg-gray-100 transition"
                        title={user.status === "Active" ? "Disable user" : "Activate user"}
                      >
                        {user.status === "Active" ? (
                          <Ban className="w-5 h-5 text-gray-600" />
                        ) : (
                          <Check className="w-5 h-5 text-green-700" />
                        )}
                      </button>
                      <button
                        onClick={() => openDeleteModal(user)}
                        disabled={actionLoading === user._id}
                        className="p-2 rounded-lg hover:bg-red-100 transition"
                        title="Delete user"
                      >
                        <Trash2 className="w-5 h-5 text-red-600" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex justify-center gap-2 mt-4">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
            >
              Prev
            </button>
            {[...Array(pageCount)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1 border rounded ${
                  currentPage === i + 1 ? "bg-gray-300" : "hover:bg-gray-100"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, pageCount))}
              disabled={currentPage === pageCount}
              className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </main>

      <ConfirmDeleteModal
        visible={showDeleteModal}
        userName={userToDelete?.name}
        onCancel={closeDeleteModal}
        onConfirm={confirmDeleteUser}
      />

      <ConfirmStatusChangeModal
        visible={showStatusModal}
        userName={userToToggle?.name}
        currentStatus={userToToggle?.status}
        onCancel={closeStatusModal}
        onConfirm={confirmToggleStatus}
      />
    </div>
  );
}
