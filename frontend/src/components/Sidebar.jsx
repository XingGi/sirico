// frontend/src/components/Sidebar.jsx
import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { FiGrid, FiBarChart2, FiCheckSquare, FiBriefcase, FiAlertTriangle, FiLogOut } from "react-icons/fi";

function Sidebar() {
  const navigate = useNavigate();
  const navLinkClasses = ({ isActive }) => (isActive ? "flex items-center p-3 my-1 text-white bg-blue-500 rounded-lg" : "flex items-center p-3 my-1 text-gray-300 hover:bg-slate-700 rounded-lg");

  const handleLogout = () => {
    // Hapus token dari penyimpanan
    localStorage.removeItem("sirico-token");
    // Arahkan pengguna ke halaman login
    navigate("/login");
  };

  return (
    <aside className="w-64 bg-slate-800 text-white flex flex-col p-4">
      <div className="text-2xl font-bold mb-10 text-center">
        <Link to="/dashboard">SIRICO</Link>
      </div>
      <nav className="flex-grow">
        <NavLink to="/dashboard" className={navLinkClasses}>
          <FiGrid className="mr-3" /> Dashboard
        </NavLink>
        <NavLink to="/assessment-studio" className={navLinkClasses}>
          <FiCheckSquare className="mr-3" /> Assessment Studio
        </NavLink>
        <NavLink to="/rsca" className={navLinkClasses}>
          <FiBriefcase className="mr-3" /> Modul RSCA
        </NavLink>
        <NavLink to="/bpr" className={navLinkClasses}>
          <FiBarChart2 className="mr-3" /> Modul BPR
        </NavLink>
        <NavLink to="/bia" className={navLinkClasses}>
          <FiAlertTriangle className="mr-3" /> Modul BIA
        </NavLink>
      </nav>
      <div>
        {/* ↓↓↓ 4. Terapkan fungsi ke tombol onClick ↓↓↓ */}
        <button onClick={handleLogout} className="flex items-center p-3 w-full text-gray-300 hover:bg-slate-700 rounded-lg">
          <FiLogOut className="mr-3" /> Logout
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
