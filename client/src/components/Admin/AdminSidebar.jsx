// src/components/Sidebar.jsx
import React from "react";
import { Activity, Users, FileText, Settings, LogOut, BoxIcon, BoxesIcon, Box, Home, ActivityIcon, ActivitySquare, RollerCoasterIcon, Accessibility, AccessibilityIcon, LucideAccessibility, LucideMonitorCheck, SaveOff, Settings2, Settings2Icon, SettingsIcon } from "lucide-react";
import { NavLink } from "react-router-dom"; // Optional: better active link highlighting

export default function Sidebar() {
  return (
    <aside className="w-64 bg-[#7a0c0c] text-white flex flex-col p-6 fixed top-0 left-0 h-full shadow-lg">
      <h1 className="text-2xl font-bold text-center mb-10">Admin Panel</h1>

      <nav className="flex-1 space-y-2">
        <NavLink
          to="/admin/dashboard"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition ${
              isActive ? "bg-[#8c1c1c]" : "hover:bg-[#8c1c1c]"
            }`
          }
        >
          <Home className="w-5 h-5" />
          Dashboard
        </NavLink>

        <NavLink
          to="/admin/users"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2 rounded-lg transition ${
              isActive ? "bg-[#8c1c1c]" : "hover:bg-[#8c1c1c]"
            }`
          }
        >
          <Users className="w-5 h-5" />
          Manage Users
        </NavLink>

        <NavLink
          to="/admin/permission"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2 rounded-lg transition ${
              isActive ? "bg-[#8c1c1c]" : "hover:bg-[#8c1c1c]"
            }`
          }
        >
          <LucideMonitorCheck className="w-5 h-5" />
          Roles/Permissions
        </NavLink>

        <NavLink
          to="/admin/reports"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2 rounded-lg transition ${
              isActive ? "bg-[#8c1c1c]" : "hover:bg-[#8c1c1c]"
            }`
          }
        >
          <Activity className="w-5 h-5" />
          Reports
        </NavLink>

        <NavLink
          to="/admin/security"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2 rounded-lg transition ${
              isActive ? "bg-[#8c1c1c]" : "hover:bg-[#8c1c1c]"
            }`
          }
        >
          <Settings2 className="w-5 h-5" />
          Authentication & Security
        </NavLink>

        <NavLink
          to="/admin/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2 rounded-lg transition ${
              isActive ? "bg-[#8c1c1c]" : "hover:bg-[#8c1c1c]"
            }`
          }
        >
          <Settings className="w-5 h-5" />
          Settings
        </NavLink>
      </nav>

        <NavLink
            to={"/"}>
           <button className="mt-auto flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-[#8c1c1c] transition">
           <LogOut className="w-5 h-5" />
           Logout
         </button>
        </NavLink>
    </aside>
  );
}
