import React, { useState } from "react";
import {
  User,
  ShieldCheck,
  Lock,
  Bell,
  Database,
  LogOut,
  Settings,
} from "lucide-react";
import Sidebar from "./AdminSidebar";

const AdminSettings = () => {
  // PROFILE STATES
  const [profile, setProfile] = useState({
    name: "Admin User",
    email: "admin@ifind.com",
  });

  // SECURITY STATES
  const [security, setSecurity] = useState({
    enable2FA: false,
    minPasswordLength: 8,
    requireNumbers: false,
    requireUppercase: false,
    requireSymbols: false,
  });

  // NOTIFICATION STATES
  const [notifications, setNotifications] = useState({
    lostReports: true,
    foundReports: true,
    emailAlerts: true,
  });

  const toggle = (section, key) => {
    if (section === "security") {
      setSecurity({ ...security, [key]: !security[key] });
    } else if (section === "notifications") {
      setNotifications({ ...notifications, [key]: !notifications[key] });
    }
  };

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar/>

      {/* MAIN CONTENT */}
      <main className="flex-1 ml-64 p-8">

        <h2 className="text-3xl font-bold mb-8">Settings</h2>

        <div className="space-y-8">

          {/* PROFILE SETTINGS */}
          <section className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex items-center gap-3 mb-4">
              <User className="w-6 h-6 text-[#7a0c0c]" />
              <h3 className="text-xl font-semibold">Profile Settings</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Name</label>
                <input type="text" value={profile.name} className="w-full mt-1 p-2 border rounded-lg" />
              </div>
              <div>
                <label className="text-sm text-gray-600">Email</label>
                <input type="email" value={profile.email} className="w-full mt-1 p-2 border rounded-lg" />
              </div>
            </div>

            <button className="mt-4 px-4 py-2 bg-[#7a0c0c] text-white rounded-lg">Save Changes</button>
          </section>

          {/* SECURITY SETTINGS */}
          <section className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex items-center gap-3 mb-4">
              <ShieldCheck className="w-6 h-6 text-[#7a0c0c]" />
              <h3 className="text-xl font-semibold">Security Settings</h3>
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={security.enable2FA} onChange={() => toggle("security", "enable2FA")} />
                Enable Two-Factor Authentication (2FA)
              </label>

              <div>
                <label className="text-sm text-gray-600">Minimum Password Length</label>
                <input type="number" value={security.minPasswordLength} className="w-20 p-2 border rounded-lg ml-3" />
              </div>

              <label className="flex items-center gap-3">
                <input type="checkbox" checked={security.requireNumbers} onChange={() => toggle("security", "requireNumbers")} />
                Require Numbers
              </label>

              <label className="flex items-center gap-3">
                <input type="checkbox" checked={security.requireUppercase} onChange={() => toggle("security", "requireUppercase")} />
                Require Uppercase Letters
              </label>

              <label className="flex items-center gap-3">
                <input type="checkbox" checked={security.requireSymbols} onChange={() => toggle("security", "requireSymbols")} />
                Require Special Symbols (! @ # $ %)
              </label>
            </div>

            <button className="mt-4 px-4 py-2 bg-[#7a0c0c] text-white rounded-lg">Save Security Settings</button>
          </section>

          {/* NOTIFICATION SETTINGS */}
          <section className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="w-6 h-6 text-[#7a0c0c]" />
              <h3 className="text-xl font-semibold">Notification Settings</h3>
            </div>

            <label className="flex items-center gap-3 mb-2">
              <input type="checkbox" checked={notifications.emailAlerts} onChange={() => toggle("notifications", "emailAlerts")} />
              Send Email Notifications
            </label>

            <label className="flex items-center gap-3 mb-2">
              <input type="checkbox" checked={notifications.lostReports} onChange={() => toggle("notifications", "lostReports")} />
              Notify on New Lost Item Report
            </label>

            <label className="flex items-center gap-3 mb-2">
              <input type="checkbox" checked={notifications.foundReports} onChange={() => toggle("notifications", "foundReports")} />
              Notify on New Found Item Report
            </label>

            <button className="mt-4 px-4 py-2 bg-[#7a0c0c] text-white rounded-lg">Save Notification Settings</button>
          </section>

          {/* DATABASE SETTINGS */}
          <section className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-6 h-6 text-[#7a0c0c]" />
              <h3 className="text-xl font-semibold">Database Settings</h3>
            </div>

            <div className="mb-4">
              <p className="text-gray-700">Create a full backup of all user and item data.</p>
              <button className="mt-2 px-4 py-2 bg-[#7a0c0c] text-white rounded-lg">Backup Database</button>
            </div>

            <div className="border-t pt-4">
              <p className="text-gray-700 font-medium mb-2">MongoDB Status:</p>
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                <p className="text-sm text-gray-600">Connected · Response Time: 15ms</p>
              </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
};

export default AdminSettings;