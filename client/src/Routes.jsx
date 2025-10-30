import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Login from "./components/login";
import Register from "./components/register";
import ForgotPassword from "./components/ForgotPassword";
import EnterCode from "./components/EnterCode";
import ResetPassword from "./components/ResetPassword";
import App from "./App";
import LostItemManagement from "./components/user/Lost-Item-Management";
import FoundItems from "./components/user/Found-Item";
import ReportItem from "./components/user/Report-Item";

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
      ],
    },
    { path: "/login", element: <Login /> },
  ]);

  return <RouterProvider router={routes} />;
}

export default Routes;
