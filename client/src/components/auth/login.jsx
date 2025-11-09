import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";
import { API_ENDPOINTS, RECAPTCHA_SITE_KEY } from "../../utils/constants";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [captchaValue, setCaptchaValue] = useState(null);
  const [error, setError] = useState("");
  const googleInitialized = useRef(false);
  const codeClientRef = useRef(null);

  // Google client id - set this in client/.env as VITE_GOOGLE_CLIENT_ID
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID";

  useEffect(() => {
    // dynamically load the Google Identity Services script if it's not present
    const id = "google-identity-script";
    if (!document.getElementById(id)) {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.id = id;
      script.onload = () => {
        // initialize automatically when the script has loaded so the button works immediately
        if (window.google && !googleInitialized.current) {
          try {
            // initialize ID token client (One Tap / credential)
            window.google.accounts.id.initialize({
              client_id: GOOGLE_CLIENT_ID,
              callback: handleCredentialResponse,
            });
            googleInitialized.current = true;

            // initialize OAuth2 code client which opens a popup when requestCode() is called
            if (window.google.accounts.oauth2 && !codeClientRef.current) {
              try {
                codeClientRef.current = window.google.accounts.oauth2.initCodeClient({
                  client_id: GOOGLE_CLIENT_ID,
                  scope: "openid email profile",
                  ux_mode: "popup",
                  // use postMessage redirect which is appropriate for popup flows
                  redirect_uri: "postmessage",
                  callback: async (resp) => {
                    if (resp?.code) {
                      // send the authorization code to the backend for token exchange
                      try {
                        const res = await fetch(API_ENDPOINTS.GOOGLE_CODE, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ code: resp.code }),
                        });
                        const data = await res.json();
                        if (res.ok) {
                          // Save user data to localStorage if provided
                          if (data.user) {
                            localStorage.setItem('user', JSON.stringify(data.user));
                          }
                          navigate("/dashboard");
                        } else {
                          setError(data.error || "Google code exchange failed");
                        }
                      } catch (err) {
                        console.error(err);
                        setError("Error connecting to server for Google code exchange");
                      }
                    } else {
                      setError("No code returned from Google popup");
                    }
                  },
                });
              } catch (e) {
                console.warn("Could not init code client:", e);
              }
            }
          } catch (e) {
            console.error("Failed to initialize Google Identity Services:", e);
          }
        }
      };
      document.head.appendChild(script);
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCaptchaChange = (value) => {
    setCaptchaValue(value);
  };

  const handleSubmit = async (e) => {
      e.preventDefault();
    if (!captchaValue) {
      setError("Please complete the reCAPTCHA");
      return;
    }
    setError("");

    try {
      const response = await fetch(API_ENDPOINTS.LOGIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // Save user data to localStorage
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        // successful login — navigate to dashboard without showing an alert
        navigate("/dashboard");
      } else {
        setError(data.message || data.error || "Login failed");
      }
    } catch (err) {
      console.error(err);
      setError("Error connecting to server");
    }
  };

  // callback invoked by Google's Identity Services with the ID token (credential)
  const handleCredentialResponse = async (response) => {
    if (!response?.credential) {
      setError("No credential returned from Google");
      return;
    }

    try {
      // send credential (JWT) to your backend for verification and sign-in
      const res = await fetch(API_ENDPOINTS.GOOGLE_AUTH, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential }),
      });

      const data = await res.json();
      if (res.ok) {
        // Save user data to localStorage if provided
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        // backend should return user/session info or token
        navigate("/dashboard");
      } else {
        setError(data.error || "Google sign-in failed");
      }
    } catch (err) {
      console.error(err);
      setError("Error connecting to server for Google sign-in");
    }
  };

  const handleGoogleSignIn = () => {
    if (!window.google) {
      setError("Google auth not loaded yet. Please try again in a moment.");
      return;
    }

    if (!googleInitialized.current) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
      });
      googleInitialized.current = true;
    }

    // Prefer the OAuth2 popup code flow when available (more reliable across browsers).
    // If not available, try the ID prompt and handle AbortError (FedCM) by falling back.
    try {
      if (codeClientRef.current && typeof codeClientRef.current.requestCode === "function") {
        // open the popup flow which returns an authorization code via the code client callback
        codeClientRef.current.requestCode();
        return;
      }

      // show the One Tap prompt (or the popup depending on user's state)
      // wrap in try/catch to handle AbortError coming from FedCM internals
      try {
        window.google.accounts.id.prompt();
      } catch (err) {
        // FedCM may reject with an AbortError (user closed or browser aborted). Log and fallback.
        console.warn('[GSI] prompt() failed, falling back to code client if available:', err);
        if (codeClientRef.current && typeof codeClientRef.current.requestCode === "function") {
          try {
            codeClientRef.current.requestCode();
          } catch (e) {
            console.error('codeClient.requestCode() also failed:', e);
            setError('Google sign-in failed. Please try again.');
          }
        } else {
          // final fallback: inform the user to try again or use normal login
          setError('Google sign-in currently unavailable. Please try again or use email login.');
        }
      }
    } catch (topErr) {
      // defensive catch for any unexpected errors
      console.error('Unexpected error during Google sign-in:', topErr);
      setError('Google sign-in currently unavailable. Please try again later.');
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100 items-center justify-center p-4">
      <div className="flex w-full max-w-5xl bg-white shadow-2xl rounded-3xl overflow-hidden">
        {/* LEFT - Form */}
        <div className="w-full md:w-1/2 p-10">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            Welcome Back
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              name="email"
              placeholder="Email"
              required
              onChange={handleChange}
              value={formData.email}
              autoComplete="username"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#8B0000] focus:outline-none"
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              required
              onChange={handleChange}
              value={formData.password}
              autoComplete="current-password"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#8B0000] focus:outline-none"
            />

            {/* ✅ reCAPTCHA */}
            <div className="flex justify-center my-4">
              <ReCAPTCHA
                sitekey={RECAPTCHA_SITE_KEY}
                onChange={handleCaptchaChange}
              />
            </div>

            <div className="flex justify-between text-sm text-gray-600">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="accent-[#8B0000]" />
                Remember me
              </label>
              <Link to="/forgot" className="text-[#8B0000] hover:underline">
                Forgot password?
              </Link>
            </div>

            {error && (
              <div className="text-red-600 text-sm mb-2">{error}</div>
            )}

            <button
              type="submit"
              className="w-full bg-[#8B0000] text-white rounded-lg py-2 font-semibold hover:bg-[#600000] transition"
            >
              Log in
            </button>

            <div className="flex items-center justify-center text-gray-400 text-sm my-2">
              <span className="border-t border-gray-300 w-20"></span>
              <span className="mx-3">or</span>
              <span className="border-t border-gray-300 w-20"></span>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="flex items-center justify-center gap-2 w-full border border-gray-300 rounded-lg py-2 hover:bg-gray-100 transition"
            >
              <span className="text-red-500 text-xl font-bold">G</span>
              <span className="text-gray-700">Sign in with Google</span>
            </button>
          </form>
        </div>

        {/* RIGHT - Gradient Welcome */}
        <div className="hidden md:flex w-1/2 bg-gradient-to-b from-[#8B0000] via-[#600000] to-[#3E0703] text-white flex-col items-center justify-center p-10">
          <h2 className="text-4xl font-bold mb-2">Hello!</h2>
          <p className="mb-6 text-lg">Don't have an account yet?</p>
          <Link to="/register">
            <button className="border-2 border-white rounded-full px-6 py-2 hover:bg-white hover:text-[#3E0703] transition-all">
              Sign Up
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;

