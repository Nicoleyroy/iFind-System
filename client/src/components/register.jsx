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
    // Combine first and last name to match backend
    const payload = {
      name: formData.firstName + " " + formData.lastName, // or use template strings
      email: formData.email,
      password: formData.password,
    };

    try {
      const response = await fetch("http://localhost:4000/user", { // <-- ensure port matches backend
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (response.ok) {
        alert("Registration successful!");
        navigate("/login");
      } else {
        alert(data.message || "Registration failed");
      }
    } catch (err) {
      console.error(err);
      alert("Error connecting to server");
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100 items-center justify-center p-4">
      <div className="flex w-full max-w-5xl bg-white shadow-2xl rounded-3xl overflow-hidden">
        {/* LEFT - Gradient Welcome */}
        <div className="hidden md:flex w-1/2 bg-gradient-to-b from-[#8B0000] via-[#600000] to-[#3E0703] text-white flex-col items-center justify-center p-10 ">
          <h2 className="text-4xl font-bold mb-2">Welcome Back!</h2>
          <p className="mb-6 text-lg">Already have an account?</p>
          <Link to="/login">
            <button className="border-2 border-white rounded-full px-6 py-2 hover:bg-white hover:text-[#3E0703] transition-all">
              Log in
            </button>
          </Link>
        </div>

        {/* RIGHT - Form */}
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
                required
                className="w-1/2 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#8B0000] focus:outline-none"
              />
              <input
                type="text"
                name="lastName"
                placeholder="Last Name"
                onChange={handleChange}
                required
                className="w-1/2 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#8B0000] focus:outline-none"
              />
            </div>
            <input
              type="email"
              name="email"
              placeholder="Email"
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#8B0000] focus:outline-none"
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#8B0000] focus:outline-none"
            />
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#8B0000] focus:outline-none"
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
              className="w-full bg-[#8B0000] text-white rounded-lg py-2 font-semibold hover:bg-[#600000] transition"
            >
              Create account
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
