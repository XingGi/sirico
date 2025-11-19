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
  {
    key: "rsca",
    title: "RSCA",
    icon: <FiFileText />,
    children: [
      // 1. Untuk Staf (dari Add-ons)
      { title: "Tugas Kuesioner", path: "/addons/rsca", icon: <FiCheckSquare />, requiredPermission: "submit_rsca" },
      // 2. Untuk Manajer Risiko (dari Admin)
      { title: "Manajemen Siklus", path: "/admin/rsca", icon: <FiSettings />, requiredPermission: "manage_rsca_cycles" },
      // 3. Untuk Manajer Risiko (dari Admin)
      { title: "Manajemen Departemen", path: "/admin/departments", icon: <FiBriefcase />, requiredPermission: "manage_departments" },
      { title: "Pemantauan Mitigasi", path: "/admin/mitigation-monitor", icon: <FiActivity />, requiredPermission: "view_mitigation_monitor" },
    ],
  },
  {
    key: "addons",
    title: "Add-ons",
    icon: <FiBox />,
    requiredPermission: "view_addons_menu", // Permission baru untuk parent
    children: [
      { title: "Modul BPR", path: "/addons/bpr", icon: <FiBarChart2 />, requiredPermission: "view_bpr" },
      { title: "Modul BIA", path: "/addons/bia", icon: <FiAlertTriangle />, requiredPermission: "view_bia" },
      { title: "Horizon Scanner", path: "/addons/horizon-scanner", icon: <FiGlobe />, requiredPermission: "view_horizon_scanner" },
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
  const [openMenu, setOpenMenu] = useState("");
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  const hasPermission = (requiredPermission) => {
    // Admin selalu punya akses
    if (user?.role === "admin") return true;
    // Jika tidak ada permission yg dibutuhkan, tampilkan
    if (!requiredPermission) return true;
    // Jika user tidak punya permissions array (misal token lama/invalid), jangan tampilkan
    if (!user?.permissions) return false;
    // Cek apakah permission ada di array user
    return user.permissions.includes(requiredPermission);
  };

  // Efek untuk membuka menu induk secara otomatis jika salah satu anaknya aktif
  useEffect(() => {
    const activeParent = menuItems.find((item) => item.children?.some((child) => location.pathname.startsWith(child.path) && hasPermission(child.requiredPermission)));
    if (activeParent) {
      setOpenMenu(activeParent.key);
    } else {
      setOpenMenu(""); // Tutup menu lain jika tidak ada child aktif
    }
  }, [location.pathname, user]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    }
    // Tambahkan event listener saat menu terbuka
    if (isUserMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      // Hapus event listener saat menu tertutup
      document.removeEventListener("mousedown", handleClickOutside);
    }
    // Cleanup listener saat komponen unmount atau menu tertutup
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isUserMenuOpen]);

  const handleLogout = () => {
    setIsUserMenuOpen(false);
    logout();
    navigate("/");
  };

  const handleMenuClick = (key) => {
    setOpenMenu(openMenu === key ? "" : key);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  const navLinkClasses = ({ isActive }) => `flex items-center p-3 my-1 rounded-lg transition-colors duration-200 ${isActive ? "bg-blue-500 text-white" : "text-gray-300 hover:bg-slate-700"}`;

  // Kelas untuk sub-menu
  const subMenuNavLinkClasses = ({ isActive }) => `flex items-center py-2 px-3 my-1 rounded-md text-sm transition-colors duration-200 ${isActive ? "bg-slate-600 text-white" : "text-gray-400 hover:bg-slate-700 hover:text-gray-200"}`;

  const getVisibleChildren = (children) => {
    if (!children) return [];
    return children.filter((child) => hasPermission(child.requiredPermission));
  };

  const userName = user?.nama_lengkap || "Pengguna";
  const userEmail = user?.email || "email@example.com";
  const userInitial = userName ? userName[0].toUpperCase() : "?";

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
          const visibleChildren = getVisibleChildren(item.children);
          const canViewParent = item.children ? visibleChildren.length > 0 : hasPermission(item.requiredPermission);

          if (!canViewParent) {
            // console.log(`Hiding menu: ${item.title} (Permission check failed or no visible children)`); // Optional log
            return null; // Sembunyikan item jika tidak punya permission ATAU tidak punya child yang visible
          }

          // 3. Render menu dengan sub-menu jika ada 'children'
          return item.children && visibleChildren.length > 0 ? (
            <div key={item.key}>
              <button onClick={() => handleMenuClick(item.key)} className="flex items-center justify-between p-3 my-1 w-full rounded-lg text-gray-300 hover:bg-slate-700 transition-colors duration-200">
                <div className="flex items-center">
                  <span className="h-6 w-6 flex-shrink-0">{item.icon}</span>
                  <span className={`ml-3 whitespace-nowrap overflow-hidden transition-opacity duration-200 ${isOpen ? "opacity-100" : "opacity-0"}`}>{item.title}</span>
                </div>
                {isOpen && <FiChevronDown className={`h-5 w-5 transform transition-transform duration-300 ${openMenu === item.key ? "rotate-180" : ""}`} />}
              </button>
              {isOpen && openMenu === item.key && (
                <div className="overflow-hidden pl-6">
                  {visibleChildren.map((child) => (
                    <NavLink to={child.path} key={child.path} className={subMenuNavLinkClasses}>
                      <span className="w-1 h-5 mr-3">{location.pathname.startsWith(child.path) && <div className="w-1 h-full bg-blue-400 rounded-full" />}</span>
                      <div className="w-6 h-6 mr-3 flex-shrink-0 text-gray-500">{child.icon}</div>
                      <span className="whitespace-nowrap">{child.title}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          ) : !item.children ? (
            <NavLink to={item.path} key={item.path} className={navLinkClasses}>
              <span className="h-6 w-6 flex-shrink-0">{item.icon}</span>
              <span className={`ml-3 whitespace-nowrap overflow-hidden transition-all duration-200 ${isOpen ? "opacity-100" : "opacity-0 w-0"}`}>{item.title}</span>
            </NavLink>
          ) : null;
        })}
      </nav>

      {/* Logout Button (tidak berubah) */}
      <div className="mt-auto pt-4 border-t border-slate-700" ref={userMenuRef}>
        {isUserMenuOpen && isOpen && (
          <div className="absolute bottom-[75px] left-4 z-20 bg-white rounded-md shadow-lg border border-gray-200 text-slate-700 py-1 transition-opacity duration-200 w-max min-w-[200px]">
            <Link
              to="/account-setting"
              onClick={() => setIsUserMenuOpen(false)} // Tutup menu saat diklik
              className="flex items-center w-full px-4 py-2 text-sm hover:bg-slate-100 transition-colors"
            >
              <FiUser className="mr-3 h-4 w-4 text-gray-500" /> Account Setting
            </Link>
            <Link
              to="/password-setting" // Arahkan ke route baru
              onClick={() => setIsUserMenuOpen(false)} // Tutup menu
              className="flex items-center w-full px-4 py-2 text-sm hover:bg-slate-100 transition-colors"
            >
              <FiLock className="mr-3 h-4 w-4 text-gray-500" /> Password Setting
            </Link>
            <hr className="my-1 border-slate-200" /> {/* Garis pemisah */}
            <button onClick={handleLogout} className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
              <FiLogOut className="mr-3 h-4 w-4" /> Log out
            </button>
          </div>
        )}
        {/* Tombol Trigger Menu User */}
        <button onClick={toggleUserMenu} className="flex items-center w-full p-2 hover:bg-slate-700 rounded-lg text-left transition-colors" aria-expanded={isUserMenuOpen} aria-haspopup="true">
          {/* Avatar Placeholder */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mr-3 flex-shrink-0 shadow-md">
            <span className="text-white font-bold text-lg">{userInitial}</span>
          </div>
          {/* Teks Nama & Email (hanya saat expanded) */}
          <div className={`flex-grow overflow-hidden transition-all duration-200 ${isOpen ? "w-auto opacity-100" : "w-0 opacity-0"}`}>
            <p className="text-sm font-semibold truncate">{userName}</p>
            <p className="text-xs text-slate-400 truncate">{userEmail}</p>
          </div>
          {/* Ikon More (hanya saat expanded) */}
          <div className={`flex-shrink-0 transition-opacity duration-200 ${isOpen ? "opacity-100" : "opacity-0"}`}>
            <FiMoreVertical className="ml-2 text-slate-400" />
          </div>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
