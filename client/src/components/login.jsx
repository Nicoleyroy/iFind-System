import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";

// Get the Google client ID from .env (set as: VITE_GOOGLE_CLIENT_ID)
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  "511822923019-k6tkimq73a1cb17c70pj1eortrcqkm2u.apps.googleusercontent.com";

const Login = () => {
  const navigate = useNavigate();

  // Login form state 
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [captchaValue, setCaptchaValue] = useState(null);
  const [error, setError] = useState("");

  // Google auth state
  const googleInitialized = useRef(false);
  const codeClientRef = useRef(null);

  // Load Google Identity Services (for Google login, popup/code)
  useEffect(() => {
    const scriptId = "google-identity-script";
    if (document.getElementById(scriptId)) return;
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.id = scriptId;
    script.onload = () => {
      if (window.google && !googleInitialized.current) {
        try {
          // Basic ID prompt setup
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleCredentialResponse,
          });
          googleInitialized.current = true;

          // Google OAuth2 code flow setup
          if (window.google.accounts.oauth2 && !codeClientRef.current) {
            codeClientRef.current = window.google.accounts.oauth2.initCodeClient({
              client_id: GOOGLE_CLIENT_ID,
              scope: "openid email profile",
              ux_mode: "popup",
              redirect_uri: "postmessage",
              callback: async (resp) => {
                if (resp?.code) {
                  try {
                    const res = await fetch("http://localhost:4000/auth/google/code", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ code: resp.code }),
                    });
                    const data = await res.json();
                    if (res.ok) {
                      navigate("/dashboard");
                    } else {
                      setError(data.error || "Google code exchange failed");
                    }
                  } catch {
                    setError("Error connecting to server for Google code exchange");
                  }
                } else {
                  setError("No code returned from Google popup");
                }
              },
            });
          }
        } catch (e) {
          console.error("Failed to initialize Google Identity Services:", e);
        }
      }
    };
    document.head.appendChild(script);
  }, []);

  // Handle regular form input
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Capture recaptcha completed value
  const handleCaptchaChange = (value) => {
    setCaptchaValue(value);
  };

  // Email/password form submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!captchaValue) {
      setError("Please complete the reCAPTCHA");
      return;
    }
    setError("");
    try {
      const res = await fetch("http://localhost:4000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        navigate("/dashboard");
      } else {
        setError(data.error || "Login failed");
      }
    } catch {
      setError("Error connecting to server");
    }
  };

  // Google ID token handler (One Tap / direct sign-in)
  const handleCredentialResponse = async (response) => {
    if (!response?.credential) {
      setError("No credential returned from Google");
      return;
    }
    try {
      const res = await fetch("http://localhost:4000/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential }),
      });
      const data = await res.json();
      if (res.ok) {
        navigate("/dashboard");
      } else {
        setError(data.error || "Google sign-in failed");
      }
    } catch {
      setError("Error connecting to server for Google sign-in");
    }
  };

  // Main Google Sign-In button handler
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
    // Try Popup OAuth2 flow if possible, else fallback to One Tap
    try {
      if (codeClientRef.current && typeof codeClientRef.current.requestCode === "function") {
        codeClientRef.current.requestCode();
        return;
      }
      window.google.accounts.id.prompt();
    } catch (err) {
      // If prompt fails, try code flow or show error
      if (codeClientRef.current && typeof codeClientRef.current.requestCode === "function") {
        try {
          codeClientRef.current.requestCode();
        } catch {
          setError('Google sign-in failed. Please try again.');
        }
      } else {
        setError('Google sign-in unavailable. Please try again later.');
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100 items-center justify-center p-4">
      <div className="flex w-full max-w-5xl bg-white shadow-2xl rounded-3xl overflow-hidden">
        {/* LEFT: Login Form Section */}
        <div className="w-full md:w-1/2 p-10">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            Welcome Back
          </h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <input
              type="email"
              name="email"
              placeholder="Email"
              required
              autoComplete="username"
              onChange={handleChange}
              value={formData.email}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#8B0000] focus:outline-none"
            />
            {/* Password */}
            <input
              type="password"
              name="password"
              placeholder="Password"
              required
              autoComplete="current-password"
              onChange={handleChange}
              value={formData.password}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#8B0000] focus:outline-none"
            />
            {/* reCAPTCHA */}
            <div className="flex justify-center my-4">
              <ReCAPTCHA
                sitekey="6LepYPArAAAAAFkkMgW82_pHWpvGRiKXa3ZSTBqT"
                onChange={handleCaptchaChange}
              />
            </div>
            {/* Remember me & Forgot */}
            <div className="flex justify-between text-sm text-gray-600">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="accent-[#8B0000]" />
                Remember me
              </label>
              <Link to="/forgot" className="text-[#8B0000] hover:underline">
                Forgot password?
              </Link>
            </div>
            {/* Error Message */}
            {error && (
              <div className="text-red-600 text-sm mb-2">{error}</div>
            )}
            {/* Login button */}
            <button
              type="submit"
              className="w-full bg-[#8B0000] text-white rounded-lg py-2 font-semibold hover:bg-[#600000] transition"
            >
              Log in
            </button>
            {/* Divider */}
            <div className="flex items-center justify-center text-gray-400 text-sm my-2">
              <span className="border-t border-gray-300 w-20"></span>
              <span className="mx-3">or</span>
              <span className="border-t border-gray-300 w-20"></span>
            </div>
            {/* Google Sign-In Button */}
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
        {/* RIGHT: Welcome Panel */}
        <div className="hidden md:flex w-1/2 bg-gradient-to-b from-[#8B0000] via-[#600000] to-[#3E0703] text-white flex-col items-center justify-center p-10">
          <h2 className="text-4xl font-bold mb-2">Hello!</h2>
          <p className="mb-6 text-lg">Don’t have an account yet?</p>
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
