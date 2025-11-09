// src/components/Sidebar.jsx
import React from "react";
import { Activity, Users, FileText, Settings, LogOut, BoxIcon, BoxesIcon, Box, Home, ActivityIcon, ActivitySquare, RollerCoasterIcon, Accessibility, AccessibilityIcon, LucideAccessibility, LucideMonitorCheck, SaveOff, Settings2, Settings2Icon, SettingsIcon, LucideClipboardSignature, LucideClipboardList } from "lucide-react";
import { NavLink } from "react-router-dom"; // Optional: better active link highlighting

export default function Sidebar() {
  return (
    <aside className="w-64 bg-[#7a0c0c] text-white flex flex-col p-6 fixed top-0 left-0 h-full shadow-lg">
        <h1 className="text-2xl font-bold text-center">iFind </h1>
        <h1 className="text-2xl font-bold text-center mb-10"> Moderator Panel</h1>

      <nav className="flex-1 space-y-2">
        <NavLink
          to="/moderator/dashboard"
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
          to="/moderator/lost-items"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2 rounded-lg transition ${
              isActive ? "bg-[#8c1c1c]" : "hover:bg-[#8c1c1c]"
            }`
          }
        >
          <LucideClipboardList className="w-5 h-5" />
          Lost Items Management
        </NavLink>

        <NavLink
          to="/moderator/found-items"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2 rounded-lg transition ${
              isActive ? "bg-[#8c1c1c]" : "hover:bg-[#8c1c1c]"
            }`
          }
        >
          <LucideClipboardSignature className="w-5 h-5" />
          Found Items Management
        </NavLink>

        <NavLink
          to="/moderator/item-verification"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2 rounded-lg transition ${
              isActive ? "bg-[#8c1c1c]" : "hover:bg-[#8c1c1c]"
            }`
          }
        >
          <Activity className="w-5 h-5" />
          Item Verification
        </NavLink>

        <NavLink
          to="/moderator/reports-dashboard"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2 rounded-lg transition ${
              isActive ? "bg-[#8c1c1c]" : "hover:bg-[#8c1c1c]"
            }`
          }
        >
          <Settings2 className="w-5 h-5" />
          Reports and Analytics
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
