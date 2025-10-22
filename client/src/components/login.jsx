import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';

const Login = () => {
  const [modalStep, setModalStep] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false,
  });
  const [recaptchaValue, setRecaptchaValue] = useState(null);
  const [errors, setErrors] = useState({});
  const recaptchaRef = useRef(null);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleRecaptchaChange = (value) => {
    setRecaptchaValue(value);
    if (errors.recaptcha) {
      setErrors((prev) => ({
        ...prev,
        recaptcha: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    if (!recaptchaValue) {
      newErrors.recaptcha = 'Please complete the reCAPTCHA verification';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      console.log('Form submitted:', { ...formData, recaptcha: recaptchaValue });
      navigate('/Lost-Items');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100">
      <div className="flex w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Left Section */}
        <div className="w-1/2 bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex flex-col justify-center items-center p-10">
          <h2 className="text-4xl font-bold mb-3">Hello, Welcome!</h2>
          <p className="text-lg mb-6">Don't have an account?</p>
          <Link to="/register">
            <button className="px-6 py-2 border-2 border-white rounded-full hover:bg-white hover:text-blue-700 transition-all">
              Register
            </button>
          </Link>
        </div>

        {/* Right Section */}
        <div className="w-1/2 p-10">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
            Log In
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 rounded-lg border ${
                  errors.email
                    ? 'border-red-500'
                    : 'border-gray-300 focus:border-indigo-500'
                } focus:ring-2 focus:ring-indigo-200 outline-none transition`}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 rounded-lg border ${
                  errors.password
                    ? 'border-red-500'
                    : 'border-gray-300 focus:border-indigo-500'
                } focus:ring-2 focus:ring-indigo-200 outline-none transition`}
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            {/* Remember / Forgot */}
            <div className="flex justify-between items-center text-sm">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="remember"
                  checked={formData.remember}
                  onChange={handleInputChange}
                  className="accent-indigo-600"
                />
                <span className="text-gray-700">Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => setModalStep('forgot')}
                className="text-indigo-600 hover:underline"
              >
                Forgot password?
              </button>
            </div>

            {/* reCAPTCHA */}
            <div>
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey="6LepYPArAAAAAFkkMgW82_pHWpvGRiKXa3ZSTBqT"
                onChange={handleRecaptchaChange}
              />
              {errors.recaptcha && (
                <p className="text-red-500 text-sm mt-1">{errors.recaptcha}</p>
              )}
            </div>

            <div className="flex items-center justify-center space-x-4">
              <div className="h-px bg-gray-300 flex-1" />
              <span className="text-gray-500 text-sm">or</span>
              <div className="h-px bg-gray-300 flex-1" />
            </div>

            {/* Google Button */}
            <button
              type="button"
              className="w-full bg-white border border-gray-300 py-3 rounded-lg shadow-sm flex justify-center items-center space-x-3 hover:bg-gray-50 transition"
            >
              <span className="text-lg text-red-500 font-bold">G</span>
              <span className="text-gray-700 font-medium">
                Sign in with Google
              </span>
            </button>

            {/* Login Button */}
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 font-semibold transition"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
