// src/components/layout/AdminSidebar.jsx
import React, { useState } from "react";
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  LogOut, 
  Shield,
  FileText,
  BarChart3,
  UserCog,
  ChevronDown,
  Activity
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

export default function AdminSidebar() {
  const [expandUsers, setExpandUsers] = useState(false);
  const location = useLocation();
  
  // Check if any user management route is active
  const isUsersActive = location.pathname.includes("/admin/users");

  return (
    <aside className="w-64 bg-white text-gray-800 flex flex-col fixed top-0 left-0 h-full shadow-2xl border-r border-gray-200">
      {/* Logo/Brand Section */}
      <div className="px-6 py-8 border-b border-gray-200">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg">
            <Shield className="w-9 h-9 text-white" />
          </div>
          <div className="flex flex-col items-center">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">iFind</h1>
            <span className="text-xs text-orange-600 font-medium uppercase tracking-wider">Admin Panel</span>
          </div>
        </div>
      </div>

      {/* Navigation Section */}
      <nav className="flex-1 space-y-2 px-6 py-4 overflow-y-auto">
        <NavLink
          to="/admin/dashboard"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
              isActive ? "bg-orange-500 text-white shadow-lg" : "text-gray-700 hover:bg-gray-100"
            }`
          }
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Dashboard</span>
        </NavLink>

        {/* Users Section - Collapsible */}
        <div>
          <button
            onClick={() => setExpandUsers(!expandUsers)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
              isUsersActive ? "bg-orange-500 text-white shadow-lg" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="flex-1 text-left">User Management</span>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${expandUsers ? "rotate-180" : ""}`} />
          </button>

          {/* Subitems - Animated Expansion */}
          {expandUsers && (
            <div className="space-y-1 mt-2 ml-3 pl-4 border-l-2 border-gray-300">
              <NavLink
                to="/admin/users/all"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2 rounded-xl transition-all text-sm ${
                    isActive ? "bg-orange-500 text-white font-semibold shadow-md" : "text-gray-600 hover:bg-gray-100"
                  }`
                }
              >
                <Users className="w-4 h-4" />
                <span>All Users</span>
              </NavLink>

              <NavLink
                to="/admin/users/moderators"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2 rounded-xl transition-all text-sm ${
                    isActive ? "bg-orange-500 text-white font-semibold shadow-md" : "text-gray-600 hover:bg-gray-100"
                  }`
                }
              >
                <UserCog className="w-4 h-4" />
                <span>Moderators</span>
              </NavLink>

              <NavLink
                to="/admin/users/suspended"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2 rounded-xl transition-all text-sm ${
                    isActive ? "bg-orange-500 text-white font-semibold shadow-md" : "text-gray-600 hover:bg-gray-100"
                  }`
                }
              >
                <Shield className="w-4 h-4" />
                <span>Suspended</span>
              </NavLink>
            </div>
          )}
        </div>

        <NavLink
          to="/admin/reports"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
              isActive ? "bg-orange-500 text-white shadow-lg" : "text-gray-700 hover:bg-gray-100"
            }`
          }
        >
          <FileText className="w-5 h-5" />
          <span>Reports</span>
        </NavLink>

        <NavLink
          to="/admin/analytics"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
              isActive ? "bg-orange-500 text-white shadow-lg" : "text-gray-700 hover:bg-gray-100"
            }`
          }
        >
          <BarChart3 className="w-5 h-5" />
          <span>Analytics</span>
        </NavLink>

        <NavLink
          to="/admin/activity-logs"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
              isActive ? "bg-orange-500 text-white shadow-lg" : "text-gray-700 hover:bg-gray-100"
            }`
          }
        >
          <Activity className="w-5 h-5" />
          <span>Activity Logs</span>
        </NavLink>

        <NavLink
          to="/admin/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
              isActive ? "bg-orange-500 text-white shadow-lg" : "text-gray-700 hover:bg-gray-100"
            }`
          }
        >
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </NavLink>
      </nav>

      {/* Logout Section */}
      <div className="px-6 py-6 border-t border-gray-200">
        <NavLink to="/">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all font-medium">
            <LogOut className="w-5 h-5" />
            <span>Log out</span>
          </button>
        </NavLink>
      </div>
    </aside>
  );
}
