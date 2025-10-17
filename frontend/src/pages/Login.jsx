import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { Card, Title, Button } from "@tremor/react";
import { useAuth } from "../context/AuthContext";

function Login() {
  const { login } = useAuth();
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
      login(token);
      navigate("/dashboard");
    } catch (error) {
      alert("Error: " + (error.response?.data?.msg || "Email atau password salah."));
    } finally {
      setIsLoading(false); // Selesai loading
    }
  };

  // ... (bagian return JSX tidak berubah)
  return (
    <div className="min-h-screen bg-slate-800 flex flex-col justify-center items-center p-4">
      <h1 className="text-3xl font-bold text-white mb-6">SIRICO</h1>

      {/* ↓↓↓ 2. Ganti div dengan Card Tremor ↓↓↓ */}
      <Card className="max-w-md w-full">
        <Title className="text-center mb-6">Login ke Akun Anda</Title>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-tremor-content text-sm font-medium mb-2" htmlFor="email">
              Alamat Email
            </label>
            <input type="email" name="email" id="email" onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" required />
          </div>
          <div className="mb-6">
            <label className="block text-tremor-content text-sm font-medium mb-2" htmlFor="password">
              Password
            </label>
            <input type="password" name="password" id="password" onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" required />
          </div>
          <div className="flex flex-col items-center">
            {/* ↓↓↓ 3. Ganti button dengan Button Tremor ↓↓↓ */}
            <Button type="submit" className="w-full" loading={isLoading}>
              Login
            </Button>
            <Link to="/register" className="mt-4 text-sm text-blue-600 hover:underline">
              Belum punya akun? Daftar di sini
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default Login;
