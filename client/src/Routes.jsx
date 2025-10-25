import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Login from "./components/login";
import Register from "./components/Register";
import App from "./App";
import { GoogleOAuthProvider } from "@react-oauth/google";

const CLIENT_ID = "981315655353-emie91kjn834i4gnlmg34bhir28vbvgg.apps.googleusercontent.com";

function Routes() {
  const routes = createBrowserRouter([
    {
      path: "/",
      element: <App />,
    },
    {
      path: "/login",
      element: <Login />,
    },
    {
      path: "/register",
      element: <Register />,
    },
  ]);

  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <RouterProvider router={routes} />
    </GoogleOAuthProvider>
  );
}

export default Routes;
