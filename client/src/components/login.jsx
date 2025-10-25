import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [captchaValue, setCaptchaValue] = useState(null);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleCaptchaChange = (value) => {
    setCaptchaValue(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!captchaValue) {
      alert("Please complete the reCAPTCHA");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Login successful!");
        navigate("/dashboard");
      } else {
        alert(data.error || "Login failed");
      }
    } catch (err) {
      console.error(err);
      alert("Error connecting to server");
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
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#8B0000] focus:outline-none"
            />

            <input
              type="password"
              name="password"
              placeholder="Password"
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#8B0000] focus:outline-none"
            />

            {/* ✅ reCAPTCHA */}
            <div className="flex justify-center my-4">
              <ReCAPTCHA
                sitekey="6LepYPArAAAAAFkkMgW82_pHWpvGRiKXa3ZSTBqT" // ← replace this with your real site key
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

             <Link to="/">
                  <button
              type="submit"
              className="w-full bg-[#8B0000] text-white rounded-lg py-2 font-semibold hover:bg-[#600000] transition"
            >
              Log in
            </button>
              </Link>
          

            <div className="flex items-center justify-center text-gray-400 text-sm my-2">
              <span className="border-t border-gray-300 w-20"></span>
              <span className="mx-3">or</span>
              <span className="border-t border-gray-300 w-20"></span>
            </div>

            <button
              type="button"
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
