import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Login from "./components/auth/login";
import Register from "./components/auth/register";
import ForgotPassword from "./components/auth/ForgotPassword";
import EnterCode from "./components/auth/EnterCode";
import ResetPassword from "./components/auth/ResetPassword";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import App from "./App";
import LostItemManagement from "./components/user/Lost-Item-Management";
import FoundItems from "./components/user/Found-Item";
import ReportItem from "./components/user/Report-Item";
import Settings from "./components/user/management/Settings";
import Profile from "./components/user/management/profile";
import ClaimRequests from "./components/user/ClaimRequests";
import ContactUs from "./components/user/ContactUs";

//Moderator
import ModFoundItemManagement from "./components/Moderator/ModFoundItemManagement";
import ModeratorDashboard from "./components/Moderator/ModeratorDashboard";
import ModLostItemManagement from "./components/Moderator/ModLostItemManagement";
import ReportsDashboard from "./components/Moderator/ReportsDashboard";
import ClaimTicketVerification from "./components/Moderator/ClaimTicketVerification";
import ModeratorSettings from "./components/Moderator/ModeratorSettings";

//Admin
import AdminDashboard from "./components/Admin/AdminDashboard";
import AllUsers from "./components/Admin/AllUsers";
import Permission from "./components/Admin/Permission";
import SuspendedUsers from "./components/Admin/SuspendedUsers";
import Reports from "./components/Admin/Reports";
import Analytics from "./components/Admin/Analytics";
import ActivityLogs from "./components/Admin/ActivityLogs";
import AdminSettings from "./components/Admin/AdminSettings";

function Routes() {
  const routes = createBrowserRouter([
    {
      path: "/",
      element: <App />,
      children: [
        { index: true, element: <Login /> },
        
        // User Routes - Protected for authenticated users
        { 
          path: "dashboard", 
          element: <ProtectedRoute allowedRoles={['user', 'moderator', 'admin']}><LostItemManagement /></ProtectedRoute> 
        },
        { 
          path: "lost", 
          element: <ProtectedRoute allowedRoles={['user', 'moderator', 'admin']}><LostItemManagement /></ProtectedRoute> 
        },
        { 
          path: "found", 
          element: <ProtectedRoute allowedRoles={['user', 'moderator', 'admin']}><FoundItems /></ProtectedRoute> 
        },
        { 
          path: "report", 
          element: <ProtectedRoute allowedRoles={['user', 'moderator', 'admin']}><ReportItem /></ProtectedRoute> 
        },
        { 
          path: "settings", 
          element: <ProtectedRoute allowedRoles={['user', 'moderator', 'admin']}><Settings /></ProtectedRoute> 
        },
        { 
          path: "profile", 
          element: <ProtectedRoute allowedRoles={['user', 'moderator', 'admin']}><Profile /></ProtectedRoute> 
        },
        {
          path: "profile/claims",
          element: <ProtectedRoute allowedRoles={['user', 'moderator', 'admin']}><ClaimRequests /></ProtectedRoute>
        },
        { 
          path: "contact", 
          element: <ProtectedRoute allowedRoles={['user', 'moderator', 'admin']}><ContactUs /></ProtectedRoute> 
        },

        // Public Routes
        { path: "register", element: <Register /> },
        { path: "login", element: <Login /> },
        { path: "forgot", element: <ForgotPassword /> },
        { path: "verify", element: <EnterCode /> },
        { path: "reset", element: <ResetPassword /> },

        // Moderator Routes - Protected for moderators and admins
        {
          path: "moderator/FoundItem/Management",
          element: <ProtectedRoute allowedRoles={['moderator', 'admin']}><ModFoundItemManagement /></ProtectedRoute>,
        },
        {
          path: "moderator/LostItem/Management",
          element: <ProtectedRoute allowedRoles={['moderator', 'admin']}><ModLostItemManagement /></ProtectedRoute>,
        },
        { 
          path: "moderator/dashboard", 
          element: <ProtectedRoute allowedRoles={['moderator', 'admin']}><ModeratorDashboard /></ProtectedRoute> 
        },
        { 
          path: "moderator/reports-dashboard", 
          element: <ProtectedRoute allowedRoles={['moderator', 'admin']}><ReportsDashboard /></ProtectedRoute> 
        },
        { 
          path: "moderator/item-verification", 
          element: <ProtectedRoute allowedRoles={['moderator', 'admin']}><ClaimTicketVerification /></ProtectedRoute> 
        },
        { 
          path: "moderator/settings", 
          element: <ProtectedRoute allowedRoles={['moderator', 'admin']}><ModeratorSettings /></ProtectedRoute> 
        },

        // Admin Routes - Protected for admins only
        { 
          path: "admin/dashboard", 
          element: <ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute> 
        },
        { 
          path: "admin/users/all", 
          element: <ProtectedRoute allowedRoles={['admin']}><AllUsers /></ProtectedRoute> 
        },
        { 
          path: "admin/users/permission", 
          element: <ProtectedRoute allowedRoles={['admin']}><Permission /></ProtectedRoute> 
        },
        { 
          path: "admin/users/suspended", 
          element: <ProtectedRoute allowedRoles={['admin']}><SuspendedUsers /></ProtectedRoute> 
        },
        { 
          path: "admin/reports", 
          element: <ProtectedRoute allowedRoles={['admin']}><Reports /></ProtectedRoute> 
        },
        { 
          path: "admin/analytics", 
          element: <ProtectedRoute allowedRoles={['admin']}><Analytics /></ProtectedRoute> 
        },
        { 
          path: "admin/activity-logs", 
          element: <ProtectedRoute allowedRoles={['admin']}><ActivityLogs /></ProtectedRoute> 
        },
        { 
          path: "admin/settings", 
          element: <ProtectedRoute allowedRoles={['admin']}><AdminSettings /></ProtectedRoute> 
        },
      ],
    },
  ]);

  return <RouterProvider router={routes} />;
}

export default Routes;
