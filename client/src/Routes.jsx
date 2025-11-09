import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/register";
import ForgotPassword from "./components/ForgotPassword";
import EnterCode from "./components/EnterCode";
import ResetPassword from "./components/ResetPassword";
import App from "./App";
import LostItemManagement from "./components/user/Lost-Item-Management";
import FoundItems from "./components/user/Found-Item";
import ReportItem from "./components/user/Report-Item";
import AdminDashboard from "./components/Admin/AdminDashboard.jsx";
import UserRoleManagement from "./components/Admin/AdminManageUser.jsx";
import AdminSettings from "./components/Admin/AdminSettings.jsx";
import ModeratorDashboard from "./components/Moderator/ModDashboard.jsx";
import LostItemsPage from "./components/Moderator/ModLostItems.jsx";
import ModItemVerification from "./components/Moderator/ClaimTicketVerification.jsx";
import FoundItemManagement from "./components/Moderator/FoundItemManagement.jsx";
import ReportsDashboard from "./components/Moderator/ReportsDashboard.jsx";

function Routes() {
  const routes = createBrowserRouter([
    {
      path: "/",
      element: <App />,
      children: [
        { index: true, element: <Login /> },
  { path: "dashboard", element: <LostItemManagement /> },
  { path: "lost", element: <FoundItems /> },
  { path: "found", element: <LostItemManagement /> },
  { path: "report", element: <ReportItem /> },
  { path: "register", element: <Register /> },
  { path: "forgot", element: <ForgotPassword /> },
  { path: "verify", element: <EnterCode /> },
  { path: "reset", element: <ResetPassword /> },

  { path: "admin/dashboard", element: <AdminDashboard /> },
  { path: "admin/users", element: <UserRoleManagement /> },
  { path: "admin/settings", element: <AdminSettings /> },

  { path: "moderator/dashboard", element: <ModeratorDashboard /> },
  { path: "moderator/lost-items", element: <LostItemsPage /> },
  { path: "moderator/item-verification", element: <ModItemVerification /> },
  { path: "moderator/found-items", element: <FoundItemManagement /> },
  { path: "moderator/reports-dashboard", element: <ReportsDashboard /> }
      ],
    },
    { path: "/login", element: <Login /> },
  ]);

  return <RouterProvider router={routes} />;
}

export default Routes;
