import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Registration successful!");
        navigate("/login");
      } else {
        alert(data.error || "Registration failed");
      }
    } catch (err) {
      console.error(err);
      alert("Error connecting to server");
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100 items-center justify-center p-4">
      <div className="flex w-full max-w-5xl bg-white shadow-xl rounded-2xl overflow-hidden">
        {/* Left side – Form */}
        <div className="w-full md:w-1/2 p-10">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            Create your account
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-3">
              <input
                type="text"
                name="firstName"
                placeholder="First Name"
                onChange={handleChange}
                className="w-1/2 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <input
                type="text"
                name="lastName"
                placeholder="Last Name"
                onChange={handleChange}
                className="w-1/2 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <input
              type="email"
              name="email"
              placeholder="Email"
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />

            <input
              type="password"
              name="password"
              placeholder="Password"
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />

            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />

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
              <span className="text-gray-700">Sign up with Google</span>
            </button>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white rounded-lg py-2 font-semibold hover:bg-blue-700 transition"
            >
              Create account
            </button>
          </form>
        </div>

        {/* Right side – Welcome section */}
        <div className="hidden md:flex w-1/2 bg-blue-600 text-white flex-col items-center justify-center p-10">
          <h2 className="text-3xl font-bold mb-2">Welcome Back!</h2>
          <p className="mb-6">Already have an account?</p>
          <Link to="/login">
            <button className="border border-white rounded-lg px-6 py-2 hover:bg-white hover:text-blue-600 transition">
              Log in
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
 