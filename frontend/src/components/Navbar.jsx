// frontend/src/components/Navbar.jsx

import React from "react";
import { Link } from "react-router-dom";
import { FiLogIn } from "react-icons/fi";

function Navbar() {
  return (
    <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <Link to="/" className="text-2xl font-bold text-slate-800">
              SIRICO
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/login" className="text-gray-600 hover:text-blue-600 font-medium">
              Login
            </Link>
            <Link to="/register" className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
              Daftar Sekarang
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
