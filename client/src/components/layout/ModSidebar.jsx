// src/components/Sidebar.jsx
import React, { useState } from "react";
import { Activity, Users, FileText, Settings, LogOut, BoxIcon, BoxesIcon, Box, Home, ActivityIcon, ActivitySquare, RollerCoasterIcon, Accessibility, AccessibilityIcon, LucideAccessibility, LucideMonitorCheck, SaveOff, Settings2, Settings2Icon, SettingsIcon, LucideClipboardSignature, LucideClipboardList, LucideRotateCcwKey, ChevronDown } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom"; // Optional: better active link highlighting

export default function ModSidebar() {
  const [expandItems, setExpandItems] = useState(false);
  const location = useLocation();
  
  // Check if either lost or found item management is active
  const isItemsActive = location.pathname.includes("/moderator/LostItem") || location.pathname.includes("/moderator/FoundItem");
  return (
    <aside className="w-64 bg-white text-gray-800 flex flex-col fixed top-0 left-0 h-full shadow-2xl border-r border-gray-200">
      {/* Logo/Brand Section */}
      <div className="px-6 py-8 border-b border-gray-200">
        {/* Logo - replace src with your actual logo path */}
        <div className="flex flex-col items-center gap-3">
          <img 
            src="/path/to/your/logo.png" 
            alt="iFind Logo" 
            className="w-16 h-16 rounded-lg object-cover"
          />
          <div className="flex flex-col items-center">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">iFind</h1>
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Moderator Panel</span>
          </div>
        </div>
      </div>

      {/* Navigation Section */}
      <nav className="flex-1 space-y-2 px-6 overflow-y-auto">
        <NavLink
          to="/moderator/dashboard"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
              isActive ? "bg-red-700 text-white shadow-lg" : "text-gray-700 hover:bg-gray-100"
            }`
          }
        >
          <Home className="w-5 h-5" />
          <span>Dashboard</span>
        </NavLink>

        {/* Items Section - Collapsible */}
        <div>
          <button
            onClick={() => setExpandItems(!expandItems)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
              isItemsActive ? "bg-red-700 text-white shadow-lg" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Box className="w-5 h-5" />
            <span className="flex-1 text-left">Items</span>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${expandItems ? "rotate-180" : ""}`} />
          </button>

          {/* Subitems - Animated Expansion */}
          {expandItems && (
            <div className="space-y-1 mt-2 ml-3 pl-4 border-l-2 border-gray-300">
              <NavLink
                to="/moderator/LostItem/Management"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2 rounded-xl transition-all text-sm ${
                    isActive ? "bg-red-700 text-white font-semibold shadow-md" : "text-gray-600 hover:bg-gray-100"
                  }`
                }
              >
                <LucideClipboardList className="w-4 h-4" />
                <span>Lost Items</span>
              </NavLink>

              <NavLink
                to="/moderator/FoundItem/Management"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2 rounded-xl transition-all text-sm ${
                    isActive ? "bg-red-700 text-white font-semibold shadow-md" : "text-gray-600 hover:bg-gray-100"
                  }`
                }
              >
                <LucideClipboardSignature className="w-4 h-4" />
                <span>Found Items</span>
              </NavLink>
            </div>
          )}
        </div>

        <NavLink
          to="/moderator/item-verification"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
              isActive ? "bg-red-700 text-white shadow-lg" : "text-gray-700 hover:bg-gray-100"
            }`
          }
        >
          <LucideRotateCcwKey className="w-5 h-5" />
          <span>Request</span>
        </NavLink>

        <NavLink
          to="/moderator/reports-dashboard"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
              isActive ? "bg-red-700 text-white shadow-lg" : "text-gray-700 hover:bg-gray-100"
            }`
          }
        >
          <Settings2 className="w-5 h-5" />
          <span>Reports & Analytics</span>
        </NavLink>

        <NavLink
          to="/admin/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
              isActive ? "bg-red-700 text-white shadow-lg" : "text-gray-700 hover:bg-gray-100"
            }`
          }
        >
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </NavLink>
      </nav>

      {/* Logout Section */}
      <div className="px-6 py-6">
        <NavLink to={"/"}>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-100 transition-all font-medium">
            <LogOut className="w-5 h-5" />
            <span>Log out</span>
          </button>
        </NavLink>
      </div>
    </aside>
  );
}