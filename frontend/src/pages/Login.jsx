import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { Card, Title, Button } from "@tremor/react";

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true); // Mulai loading
    try {
      const response = await axios.post("http://127.0.0.1:5000/api/login", formData);
      const token = response.data.access_token;
      localStorage.setItem("sirico-token", token);
      navigate("/dashboard");
    } catch (error) {
      alert("Error: " + (error.response?.data?.msg || "Email atau password salah."));
    } finally {
      setIsLoading(false); // Selesai loading
    }
  };

  // ... (bagian return JSX tidak berubah)
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center">
      {/* ... isi form ... */}
      <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Login ke SIRICO</h2>
        <form onSubmit={handleSubmit}>
          {/* ... input email dan password ... */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
              Alamat Email
            </label>
            <input type="email" name="email" id="email" onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              Password
            </label>
            <input type="password" name="password" id="password" onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline" required />
          </div>
          <div className="flex items-center justify-between">
            <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full">
              Login
            </button>
          </div>
          <div className="text-center mt-4">
            <a href="/register" className="font-bold text-sm text-blue-500 hover:text-blue-800">
              Belum punya akun? Daftar
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
