// frontend/src/components/Sidebar.jsx

import React, { useState, useEffect, useMemo, useRef } from "react";
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
  FiKey,
  FiUsers,
  FiMoreVertical,
  FiUser,
  FiLock,
  FiBox,
  FiShuffle,
  FiFileText,
  FiActivity,
  FiGlobe,
} from "react-icons/fi";
import { HiCalculator } from "react-icons/hi";
import { useAuth } from "../../context/AuthContext";
// import { motion, AnimatePresence } from "framer-motion";

// 1. Definisikan struktur menu dalam bentuk data
const menuItems = [
  { title: "Dashboard", path: "/dashboard", icon: <FiGrid />, requiredPermission: "view_dashboard" },
  {
    key: "riskLevel",
    title: "Risk Management Level",
    icon: <FiLayers />,
    children: [
      { title: "Dasar", path: "/risk-management/dasar", icon: <FiArrowDownCircle />, requiredPermission: "view_risk_dasar" },
      { title: "Madya", path: "/risk-management/madya", icon: <FiArrowRightCircle />, requiredPermission: "view_risk_madya" },
      { title: "Template Peta Risiko", path: "/risk-management/templates", icon: <FiMap />, requiredPermission: "view_risk_templates" },
    ],
  },
  {
    key: "riskAI",
    title: "Risk Management AI",
    icon: <FiAlertTriangle />,
    children: [
      { title: "Risk Assessment", path: "/risk-ai/assessments", icon: <FiCheckSquare />, requiredPermission: "view_risk_assessment_ai" },
      { title: "Risk Register", path: "/risk-ai/risk-register", icon: <FiList />, requiredPermission: "view_risk_register_main" },
    ],
  },
  // --- ADD-ONS GROUP ---
  {
    key: "addons",
    title: "Add-ons",
    icon: <FiBox />,
    requiredPermission: "view_addons_menu",
    children: [
      {
        key: "rsca",
        title: "Modul RSCA",
        icon: <FiFileText />,
        requiredPermission: "view_rsca",
        children: [
          { title: "Tugas Kuesioner", path: "/addons/rsca", icon: <FiCheckSquare />, requiredPermission: "submit_rsca" },
          { title: "Manajemen Siklus", path: "/admin/rsca", icon: <FiSettings />, requiredPermission: "manage_rsca_cycles" },
          { title: "Manajemen Departemen", path: "/admin/departments", icon: <FiBriefcase />, requiredPermission: "manage_departments" },
          { title: "Pemantauan Mitigasi", path: "/admin/mitigation-monitor", icon: <FiActivity />, requiredPermission: "view_mitigation_monitor" },
        ],
      },
      { title: "Modul BPR", path: "/addons/bpr", icon: <FiBarChart2 />, requiredPermission: "view_bpr" },
      { title: "Horizon Scanner", path: "/addons/horizon-scanner", icon: <FiGlobe />, requiredPermission: "view_horizon_scanner" },
      { title: "Modul BIA", path: "/addons/bia", icon: <FiAlertTriangle />, requiredPermission: "view_bia" },
      { title: "CBA Calculator", path: "/addons/cba", icon: <HiCalculator />, requiredPermission: "view_cba_calculator" },
      { title: "Monte Carlo Simulator", path: "/addons/monte-carlo", icon: <FiShuffle />, requiredPermission: "view_monte_carlo" },
    ],
  },
  {
    key: "admin", // Kunci unik untuk state management
    title: "Admin",
    icon: <FiSettings />,
    requiredPermission: "view_admin_area",
    children: [
      { title: "Master Data", path: "/admin/master-data", icon: <FiDatabase />, requiredPermission: "manage_master_data" },
      { title: "Master Regulasi", path: "/admin/regulations", icon: <FiBookOpen />, requiredPermission: "manage_regulations" },
      { title: "Role & Permission", path: "/admin/roles", icon: <FiKey />, requiredPermission: "manage_roles" },
      { title: "Member", path: "/admin/members", icon: <FiUsers />, requiredPermission: "manage_users" },
    ],
  },
];

function Sidebar({ isOpen, toggle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedKeys, setExpandedKeys] = useState({});
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  const hasPermission = (requiredPermission) => {
    if (user?.role === "admin") return true;
    if (!requiredPermission) return true;
    if (!user?.permissions) return false;
    return user.permissions.includes(requiredPermission);
  };

  const isItemActive = (item) => {
    if (item.path && location.pathname.startsWith(item.path)) return true;
    if (item.children) {
      return item.children.some((child) => isItemActive(child));
    }
    return false;
  };

  useEffect(() => {
    const newExpandedKeys = { ...expandedKeys };
    let hasChanges = false;

    // Fungsi rekursif untuk membuka parent dari item aktif
    const checkExpand = (items) => {
      items.forEach((item) => {
        if (item.children && isItemActive(item)) {
          if (!newExpandedKeys[item.key]) {
            newExpandedKeys[item.key] = true;
            hasChanges = true;
          }
          checkExpand(item.children); // Cek anak-anaknya juga (untuk level 3)
        }
      });
    };

    checkExpand(menuItems);
    if (hasChanges) {
      setExpandedKeys(newExpandedKeys);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, user]);

  const handleToggle = (key) => {
    setExpandedKeys((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    }
    if (isUserMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isUserMenuOpen]);

  const handleLogout = () => {
    setIsUserMenuOpen(false);
    logout();
    navigate("/");
  };

  const toggleUserMenu = () => setIsUserMenuOpen(!isUserMenuOpen);

  const baseLinkClass = "flex items-center p-3 my-1 rounded-lg transition-colors duration-200 w-full text-left";
  const activeLinkClass = "bg-blue-500 text-white";
  const inactiveLinkClass = "text-gray-300 hover:bg-slate-700";

  // Fungsi Render Rekursif (KUNCI PERUBAHAN)
  const renderMenuItem = (item, level = 0) => {
    const visibleChildren = item.children ? item.children.filter((child) => hasPermission(child.requiredPermission)) : [];

    // Cek permission item itu sendiri dan apakah punya anak visible (jika folder)
    const canView = hasPermission(item.requiredPermission) && (!item.children || visibleChildren.length > 0);

    if (!canView) return null;

    const paddingLeft = level * 12 + 12; // Indentasi bertingkat

    if (item.children && visibleChildren.length > 0) {
      const isExpanded = expandedKeys[item.key];
      return (
        <div key={item.key}>
          <button onClick={() => handleToggle(item.key)} className={`${baseLinkClass} ${inactiveLinkClass} justify-between`} style={{ paddingLeft: level === 0 ? undefined : `${paddingLeft}px` }}>
            <div className="flex items-center overflow-hidden">
              <span className="h-6 w-6 flex-shrink-0">{item.icon}</span>
              <span className={`ml-3 whitespace-nowrap transition-opacity duration-200 ${isOpen ? "opacity-100" : "opacity-0 w-0"}`}>{item.title}</span>
            </div>
            {isOpen && <FiChevronDown className={`h-4 w-4 transform transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />}
          </button>
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded && isOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"}`}>{visibleChildren.map((child) => renderMenuItem(child, level + 1))}</div>
        </div>
      );
    }

    const isActive = location.pathname.startsWith(item.path);
    return (
      <NavLink key={item.path} to={item.path} className={`${baseLinkClass} ${isActive ? activeLinkClass : inactiveLinkClass}`} style={{ paddingLeft: level === 0 ? undefined : `${paddingLeft}px` }}>
        <span className="h-6 w-6 flex-shrink-0">{item.icon}</span>
        <span className={`ml-3 whitespace-nowrap transition-opacity duration-200 ${isOpen ? "opacity-100" : "opacity-0 w-0"}`}>{item.title}</span>
      </NavLink>
    );
  };

  const userName = user?.nama_lengkap || "Pengguna";
  const userEmail = user?.email || "email@example.com";
  const userInitial = userName ? userName[0].toUpperCase() : "?";

  return (
    <aside className={`bg-slate-800 text-white flex flex-col p-4 transition-[width] duration-300 ease-in-out ${isOpen ? "w-80" : "w-20"} h-screen sticky top-0 overflow-y-auto custom-scrollbar`}>
      <div className="flex items-center mb-8 flex-shrink-0" style={{ justifyContent: isOpen ? "space-between" : "center" }}>
        <h1 className={`text-2xl font-bold overflow-hidden transition-all duration-200 whitespace-nowrap ${isOpen ? "w-auto" : "w-0"}`}>
          <Link to="/dashboard">SIRICO</Link>
        </h1>
        <button onClick={toggle} className="p-2 hover:bg-slate-700 rounded-lg">
          <FiChevronsLeft className={`transform transition-transform duration-300 ${!isOpen && "rotate-180"}`} />
        </button>
      </div>

      <nav className="flex-grow space-y-1">{menuItems.map((item) => renderMenuItem(item))}</nav>

      <div className="mt-auto pt-4 border-t border-slate-700 flex-shrink-0" ref={userMenuRef}>
        {isUserMenuOpen && isOpen && (
          <div className="absolute bottom-[80px] left-4 z-50 bg-white rounded-md shadow-xl border border-gray-200 text-slate-700 py-1 w-64 animate-in fade-in slide-in-from-bottom-2">
            <Link to="/account-setting" onClick={() => setIsUserMenuOpen(false)} className="flex items-center w-full px-4 py-2 text-sm hover:bg-slate-100 transition-colors">
              <FiUser className="mr-3 h-4 w-4 text-gray-500" /> Account Setting
            </Link>
            <Link to="/password-setting" onClick={() => setIsUserMenuOpen(false)} className="flex items-center w-full px-4 py-2 text-sm hover:bg-slate-100 transition-colors">
              <FiLock className="mr-3 h-4 w-4 text-gray-500" /> Password Setting
            </Link>
            <hr className="my-1 border-slate-200" />
            <button onClick={handleLogout} className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50">
              <FiLogOut className="mr-3 h-4 w-4" /> Log out
            </button>
          </div>
        )}
        <button onClick={toggleUserMenu} className="flex items-center w-full p-2 hover:bg-slate-700 rounded-lg text-left transition-colors">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mr-3 flex-shrink-0 shadow-md border-2 border-slate-600">
            <span className="text-white font-bold text-lg">{userInitial}</span>
          </div>
          <div className={`flex-grow overflow-hidden transition-all duration-200 ${isOpen ? "w-auto opacity-100" : "w-0 opacity-0"}`}>
            <p className="text-sm font-semibold truncate">{userName}</p>
            <p className="text-xs text-slate-400 truncate">{userEmail}</p>
          </div>
          {isOpen && <FiMoreVertical className="ml-2 text-slate-400 flex-shrink-0" />}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
