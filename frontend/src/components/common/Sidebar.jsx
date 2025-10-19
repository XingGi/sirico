// frontend/src/components/Sidebar.jsx

import React, { useState, useEffect } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  FiGrid,
  FiCheckSquare,
  FiList,
  FiBriefcase,
  FiBarChart2,
  FiAlertTriangle,
  FiLogOut,
  FiChevronsLeft,
  FiDatabase,
  FiBookOpen,
  FiSettings,
  FiChevronDown,
  FiLayers,
  FiArrowDownCircle,
  FiArrowRightCircle,
  FiArrowUpCircle,
  FiMap,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

// 1. Definisikan struktur menu dalam bentuk data
const menuItems = [
  { title: "Dashboard", path: "/dashboard", icon: <FiGrid /> },
  {
    key: "riskLevel",
    title: "Risk Management Level",
    icon: <FiLayers />,
    children: [
      { title: "Dasar", path: "/risk-management/dasar", icon: <FiArrowDownCircle /> },
      { title: "Madya", path: "/risk-management/madya", icon: <FiArrowRightCircle /> },
      { title: "Utama", path: "/risk-management/utama", icon: <FiArrowUpCircle /> },
      { title: "Template Peta Risiko", path: "/risk-management/templates", icon: <FiMap /> },
    ],
  },
  {
    key: "riskAI",
    title: "Risk Management AI",
    icon: <FiAlertTriangle />,
    children: [
      { title: "Risk Assessment", path: "risk-ai/assessments", icon: <FiCheckSquare /> },
      { title: "Risk Register", path: "risk-ai/risk-register", icon: <FiList /> },
    ],
  },
  { title: "Modul RSCA", path: "/rsca", icon: <FiBriefcase /> },
  { title: "Modul BPR", path: "/bpr", icon: <FiBarChart2 /> },
  { title: "Modul BIA", path: "/bia", icon: <FiAlertTriangle /> },
  {
    key: "admin", // Kunci unik untuk state management
    title: "Admin",
    icon: <FiSettings />,
    children: [
      { title: "Master Data", path: "/admin/master-data", icon: <FiDatabase /> },
      { title: "Master Regulasi", path: "/admin/regulations", icon: <FiBookOpen /> },
    ],
  },
];

function Sidebar({ isOpen, toggle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // 2. State untuk melacak menu mana yang sedang terbuka
  const [openMenu, setOpenMenu] = useState("");

  // Efek untuk membuka menu induk secara otomatis jika salah satu anaknya aktif
  useEffect(() => {
    const activeParent = menuItems.find((item) => item.children?.some((child) => location.pathname.startsWith(child.path)));
    if (activeParent) {
      setOpenMenu(activeParent.key);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleMenuClick = (key) => {
    setOpenMenu(openMenu === key ? "" : key);
  };

  const navLinkClasses = ({ isActive }) => `flex items-center p-3 my-1 rounded-lg transition-colors duration-200 ${isActive ? "bg-blue-500 text-white" : "text-gray-300 hover:bg-slate-700"}`;

  // Kelas untuk sub-menu
  const subMenuNavLinkClasses = ({ isActive }) => `flex items-center py-2 px-3 my-1 rounded-md text-sm transition-colors duration-200 ${isActive ? "bg-slate-600 text-white" : "text-gray-400 hover:bg-slate-700 hover:text-gray-200"}`;

  return (
    <aside className={`bg-slate-800 text-white flex flex-col p-4 transition-[width] duration-300 ease-in-out ${isOpen ? "w-80" : "w-20"}`}>
      {/* Header Sidebar (tidak berubah) */}
      <div className="flex items-center mb-10" style={{ justifyContent: isOpen ? "space-between" : "center" }}>
        <h1 className={`text-2xl font-bold overflow-hidden transition-all duration-200 ${isOpen ? "w-32" : "w-0"}`}>
          <Link to="/dashboard">SIRICO</Link>
        </h1>
        <button onClick={toggle} className="p-2 hover:bg-slate-700 rounded-lg">
          <FiChevronsLeft className={`transform transition-transform duration-300 ${!isOpen && "rotate-180"}`} />
        </button>
      </div>

      <nav className="flex-grow">
        {menuItems.map((item) => {
          // Hanya tampilkan menu Admin jika rolenya 'admin'
          if (item.key === "admin" && user?.role !== "admin") {
            return null;
          }

          // 3. Render menu dengan sub-menu jika ada 'children'
          return item.children ? (
            <div key={item.key}>
              <button onClick={() => handleMenuClick(item.key)} className="flex items-center justify-between p-3 my-1 w-full rounded-lg text-gray-300 hover:bg-slate-700 transition-colors duration-200">
                <div className="flex items-center">
                  <span className="h-6 w-6 flex-shrink-0">{item.icon}</span>
                  <span className={`ml-3 whitespace-nowrap overflow-hidden transition-opacity duration-200 ${isOpen ? "opacity-100" : "opacity-0"}`}>{item.title}</span>
                </div>
                {isOpen && <FiChevronDown className={`h-5 w-5 transform transition-transform duration-300 ${openMenu === item.key ? "rotate-180" : ""}`} />}
              </button>
              <AnimatePresence>
                {isOpen && openMenu === item.key && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: "easeInOut" }} className="overflow-hidden pl-6">
                    {item.children.map((child) => (
                      <NavLink to={child.path} key={child.path} className={subMenuNavLinkClasses}>
                        {/* Garis vertikal untuk penanda aktif seperti di referensi */}
                        <span className="w-1 h-5 mr-3">{location.pathname.startsWith(child.path) && <div className="w-1 h-full bg-blue-400 rounded-full" />}</span>
                        <div className="w-6 h-6 mr-3 flex-shrink-0 text-gray-500">{child.icon}</div>
                        <span className="whitespace-nowrap">{child.title}</span>
                      </NavLink>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            // Render menu biasa jika tidak ada 'children'
            <NavLink to={item.path} key={item.path} className={navLinkClasses}>
              <span className="h-6 w-6 flex-shrink-0">{item.icon}</span>
              <span className={`ml-3 whitespace-nowrap overflow-hidden transition-all duration-200 ${isOpen ? "opacity-100" : "opacity-0 w-0"}`}>{item.title}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Logout Button (tidak berubah) */}
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
