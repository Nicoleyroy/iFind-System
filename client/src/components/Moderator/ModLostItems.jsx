import React from "react";
import {
  Home,
  Box,
  Search,
  Users,
  FileText,
  Settings,
  LogOut,
  Bell,
  Eye,
} from "lucide-react";

const LostItems = () => {
  return (
    <div className="flex bg-gray-100 text-gray-800 min-h-screen">
      {/* ✅ Fixed Sidebar */}
      <aside className="w-64 bg-[#7a0c0c] text-white flex flex-col p-5 fixed top-0 left-0 h-full">
        <h1 className="text-2xl font-bold text-center mb-10 leading-tight">
          Lost & Found <br /> Admin
        </h1>

        <nav className="flex-1 space-y-3">
          <a
            href="/admin/dashboard"
            className="flex items-center gap-3 hover:bg-[#8c1c1c] px-3 py-2 rounded-lg transition"
          >
            <Home className="w-5 h-5" />
            <span>Dashboard</span>
          </a>
          <a
            href="/admin/found-items"
            className="flex items-center gap-3 hover:bg-[#8c1c1c] px-3 py-2 rounded-lg transition"
          >
            <Box className="w-5 h-5" />
            <span>Found Items</span>
          </a>
          <a
            href="/admin/lost-items"
            className="flex items-center gap-3 bg-[#8c1c1c] px-3 py-2 rounded-lg transition"
          >
            <Search className="w-5 h-5" />
            <span>Lost Items</span>
          </a>
          <a
            href="/admin/users"
            className="flex items-center gap-3 hover:bg-[#8c1c1c] px-3 py-2 rounded-lg transition"
          >
            <Users className="w-5 h-5" />
            <span>Users</span>
          </a>
          <a
            href="/admin/reports"
            className="flex items-center gap-3 hover:bg-[#8c1c1c] px-3 py-2 rounded-lg transition"
          >
            <FileText className="w-5 h-5" />
            <span>Reports</span>
          </a>
          <a
            href="/admin/settings"
            className="flex items-center gap-3 hover:bg-[#8c1c1c] px-3 py-2 rounded-lg transition"
          >
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </a>
        </nav>

        <button className="mt-auto flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#8c1c1c] transition">
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </aside>

      {/* ✅ Main Content */}
      <main className="flex-1 ml-64 p-8 overflow-y-auto max-h-screen">
        {/* Top Bar */}
        <div className="flex justify-between items-center mb-8 sticky top-0 bg-gray-100 z-10 pb-2">
          <h2 className="text-3xl font-semibold text-gray-800">Lost Items</h2>

          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search lost items..."
                className="border border-gray-300 rounded-lg px-3 py-2 w-60 focus:outline-none focus:ring-2 focus:ring-[#7a0c0c]"
              />
              <Search className="absolute right-3 top-2.5 w-5 h-5 text-gray-500" />
            </div>
            <Bell className="text-gray-600 w-6 h-6 cursor-pointer" />
            <div className="w-10 h-10 rounded-full bg-gray-300"></div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-white p-5 rounded-xl shadow-sm mb-6 flex flex-wrap items-center gap-4">
          <select className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7a0c0c]">
            <option>All Categories</option>
            <option>Electronics</option>
            <option>Clothing</option>
            <option>Accessories</option>
            <option>Documents</option>
          </select>

          <select className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7a0c0c]">
            <option>All Status</option>
            <option>Pending</option>
            <option>Verified</option>
            <option>Claimed</option>
          </select>

          <button className="bg-[#7a0c0c] text-white px-4 py-2 rounded-lg hover:bg-[#8c1c1c] transition">
            Filter
          </button>
        </div>

        {/* Lost Items Table */}
        <div className="bg-white rounded-xl shadow-md p-6 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                <th className="p-3">Item Name</th>
                <th className="p-3">Category</th>
                <th className="p-3">Location Lost</th>
                <th className="p-3">Date Reported</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* Placeholder for now */}
              <tr className="border-b hover:bg-gray-50 transition text-sm text-gray-600 text-center">
                <td colSpan="6" className="py-6 italic">
                  No lost items reported yet.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default LostItems;
