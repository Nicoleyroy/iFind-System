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
import YourPosts from "./components/user/Your-Post";
import Settings from "./components/user/Settings";

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
        { path: "your-posts", element: <YourPosts /> },
        { path: "settings", element: <Settings /> },
        { path: "register", element: <Register /> },
        { path: "login", element: <Login /> },
        { path: "forgot", element: <ForgotPassword /> },
        { path: "verify", element: <EnterCode /> },
        { path: "reset", element: <ResetPassword /> },
      ],
    },
  ]);

  return <RouterProvider router={routes} />;
}

export default Routes;
