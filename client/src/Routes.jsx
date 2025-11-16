import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Login from "./components/auth/login";
import Register from "./components/auth/register";
import ForgotPassword from "./components/auth/ForgotPassword";
import EnterCode from "./components/auth/EnterCode";
import ResetPassword from "./components/auth/ResetPassword";
import App from "./App";
import LostItemManagement from "./components/user/Lost-Item-Management";
import FoundItems from "./components/user/Found-Item";
import ReportItem from "./components/user/Report-Item";
import Settings from "./components/user/management/Settings";
import Profile from "./components/user/management/profile";
import ContactUs from "./components/user/ContactUs";

//Moderator
import ModFoundItemManagement from "./components/Moderator/ModFoundItemManagement";
import ModeratorDashboard from "./components/Moderator/ModeratorDashboard";
import ModLostItemManagement from "./components/Moderator/ModLostItemManagement";
import ReportsDashboard from "./components/Moderator/ReportsDashboard";
import ClaimTicketVerification from "./components/Moderator/ClaimTicketVerification";

//Admin
import AdminDashboard from "./components/Admin/AdminDashboard";
import AllUsers from "./components/Admin/AllUsers";
import Moderators from "./components/Admin/Moderators";
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
        { path: "dashboard", element: <LostItemManagement /> },
        { path: "lost", element: <LostItemManagement /> },
        { path: "found", element: <FoundItems /> },
        { path: "report", element: <ReportItem /> },
        { path: "settings", element: <Settings /> },
        { path: "profile", element: <Profile /> },
        { path: "contact", element: <ContactUs /> },
        { path: "register", element: <Register /> },
        { path: "login", element: <Login /> },
        { path: "forgot", element: <ForgotPassword /> },
        { path: "verify", element: <EnterCode /> },
        { path: "reset", element: <ResetPassword /> },

        // Moderator
        {
          path: "moderator/FoundItem/Management",
          element: <ModFoundItemManagement />,
        },
        {
          path: "moderator/LostItem/Management",
          element: <ModLostItemManagement />,
        },
        { path: "moderator/dashboard", element: <ModeratorDashboard /> },
        { path: "moderator/reports-dashboard", element: <ReportsDashboard /> },
        { path: "moderator/item-verification", element: <ClaimTicketVerification /> },

        // Admin
        { path: "admin/dashboard", element: <AdminDashboard /> },
        { path: "admin/users/all", element: <AllUsers /> },
        { path: "admin/users/moderators", element: <Moderators /> },
        { path: "admin/users/suspended", element: <SuspendedUsers /> },
        { path: "admin/reports", element: <Reports /> },
        { path: "admin/analytics", element: <Analytics /> },
        { path: "admin/activity-logs", element: <ActivityLogs /> },
        { path: "admin/settings", element: <AdminSettings /> },
      ],
    },
  ]);

  return <RouterProvider router={routes} />;
}

export default Routes;
