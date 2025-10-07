import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
// ↓↓↓ Tambahkan icon baru untuk tombol minimize/maximize ↓↓↓
import { FiGrid, FiBarChart2, FiCheckSquare, FiBriefcase, FiAlertTriangle, FiLogOut, FiChevronsLeft, FiDatabase, FiBookOpen } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";

// 1. Terima props "isOpen" dan "toggle" dari Layout
function Sidebar({ isOpen, toggle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // 2. Buat class untuk NavLink menjadi dinamis
  const navLinkClasses = ({ isActive }) => `flex items-center p-3 my-1 rounded-lg transition-colors duration-200 ${isActive ? "bg-blue-500 text-white" : "text-gray-300 hover:bg-slate-700"}`;

  // const handleLogout = () => {
  //   localStorage.removeItem("sirico-token");
  //   navigate("/login");
  // };
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    // 3. Buat class <aside> menjadi dinamis untuk mengubah lebar
    <aside className={`bg-slate-800 text-white flex flex-col p-4 transition-[width] duration-300 ease-in-out ${isOpen ? "w-64" : "w-20"}`}>
      {/* Tombol Toggle Sidebar */}
      <div className="flex items-center mb-10" style={{ justifyContent: isOpen ? "space-between" : "center" }}>
        {/* 4. Sembunyikan teks "SIRICO" saat sidebar tertutup */}
        <h1 className={`text-2xl font-bold overflow-hidden transition-all duration-200 ${isOpen ? "w-32" : "w-0"}`}>
          <Link to="/dashboard">SIRICO</Link>
        </h1>
        <button onClick={toggle} className="p-2 hover:bg-slate-700 rounded-lg">
          <FiChevronsLeft className={`transform transition-transform duration-300 ${!isOpen && "rotate-180"}`} />
        </button>
      </div>

      <nav className="flex-grow">
        {/* 5. Sembunyikan semua teks menu saat sidebar tertutup */}
        <NavLink to="/dashboard" className={navLinkClasses}>
          <FiGrid className="h-6 w-6 flex-shrink-0" />
          <span className={`ml-3 whitespace-nowrap overflow-hidden transition-all duration-200 ${isOpen ? "opacity-100" : "opacity-0 w-0"}`}>Dashboard</span>
        </NavLink>
        <NavLink to="/assessment-studio" className={navLinkClasses}>
          <FiCheckSquare className="h-6 w-6 flex-shrink-0" />
          <span className={`ml-3 whitespace-nowrap overflow-hidden transition-all duration-200 ${isOpen ? "opacity-100" : "opacity-0 w-0"}`}>Assessment Studio</span>
        </NavLink>
        <NavLink to="/rsca" className={navLinkClasses}>
          <FiBriefcase className="h-6 w-6 flex-shrink-0" />
          <span className={`ml-3 whitespace-nowrap overflow-hidden transition-all duration-200 ${isOpen ? "opacity-100" : "opacity-0 w-0"}`}>Modul RSCA</span>
        </NavLink>
        <NavLink to="/bpr" className={navLinkClasses}>
          <FiBarChart2 className="h-6 w-6 flex-shrink-0" />
          <span className={`ml-3 whitespace-nowrap overflow-hidden transition-all duration-200 ${isOpen ? "opacity-100" : "opacity-0 w-0"}`}>Modul BPR</span>
        </NavLink>
        <NavLink to="/bia" className={navLinkClasses}>
          <FiAlertTriangle className="h-6 w-6 flex-shrink-0" />
          <span className={`ml-3 whitespace-nowrap overflow-hidden transition-all duration-200 ${isOpen ? "opacity-100" : "opacity-0 w-0"}`}>Modul BIA</span>
        </NavLink>
        {/* === 3. Tampilkan Menu Master Data jika rolenya "admin" === */}
        {user && user.role === "admin" && (
          <>
            {" "}
            {/* Gunakan Fragment untuk mengelompokkan menu admin */}
            <NavLink to="/admin/master-data" className={navLinkClasses}>
              <FiDatabase className="h-6 w-6 flex-shrink-0" />
              <span className={`ml-3 whitespace-nowrap overflow-hidden transition-all duration-200 ${isOpen ? "opacity-100" : "opacity-0 w-0"}`}>Master Data</span>
            </NavLink>
            {/* 2. TAMBAHKAN MENU BARU DI SINI */}
            <NavLink to="/admin/regulations" className={navLinkClasses}>
              <FiBookOpen className="h-6 w-6 flex-shrink-0" />
              <span className={`ml-3 whitespace-nowrap overflow-hidden transition-all duration-200 ${isOpen ? "opacity-100" : "opacity-0 w-0"}`}>Master Regulasi</span>
            </NavLink>
          </>
        )}
      </nav>

      <div>
        <button onClick={handleLogout} className="flex items-center p-3 w-full text-gray-300 hover:bg-slate-700 rounded-lg">
          <FiLogOut className="h-6 w-6 flex-shrink-0" />
          <span className={`ml-3 whitespace-nowrap overflow-hidden transition-all duration-200 ${isOpen ? "opacity-100" : "opacity-0 w-0"}`}>Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
