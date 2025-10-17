// frontend/src/pages/LandingPage.jsx

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FiShield, FiBriefcase, FiBarChart2, FiAlertTriangle, FiArrowRight } from "react-icons/fi";
import AuthModal from "../../components/auth/AuthModal";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import { useAuth } from "../../context/AuthContext";

// Data untuk fitur-fitur yang akan ditampilkan
const features = [
  {
    icon: <FiShield className="w-10 h-10 text-blue-500" />,
    title: "Risk Assessment Studio",
    description: "Buat, kelola, dan lacak asesmen risiko secara terpusat dengan metodologi yang terstruktur.",
  },
  {
    icon: <FiBriefcase className="w-10 h-10 text-green-500" />,
    title: "Modul RSCA",
    description: "Otomatiskan proses Risk & Control Self-Assessment untuk setiap departemen dengan mudah.",
  },
  {
    icon: <FiBarChart2 className="w-10 h-10 text-purple-500" />,
    title: "Modul BPR",
    description: "Visualisasikan dan identifikasi potensi risiko dalam setiap langkah proses bisnis Anda.",
  },
  {
    icon: <FiAlertTriangle className="w-10 h-10 text-red-500" />,
    title: "Modul BIA",
    description: "Simulasikan dampak bisnis dari berbagai skenario gangguan untuk meningkatkan ketahanan.",
  },
];

function LandingPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalView, setModalView] = useState("login");
  const { user } = useAuth();

  // 3. Buat fungsi untuk membuka modal
  const handleOpenLogin = () => {
    setModalView("login");
    setIsModalOpen(true);
  };

  const handleOpenRegister = () => {
    setModalView("register");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };
  return (
    <div className="bg-slate-50">
      {/* 4. Kirim fungsi handler ke Navbar */}
      <Navbar onLoginClick={handleOpenLogin} onRegisterClick={handleOpenRegister} />

      {/* Hero Section */}
      <main className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center py-24 sm:py-32">
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight">
            Platform <span className="text-blue-600">Manajemen Risiko</span> Cerdas
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-slate-600">SIRICO membantu Anda mengidentifikasi, menganalisis, dan memitigasi risiko dengan lebih efisien melalui alat-alat canggih yang didukung AI.</p>
          <div className="mt-8 flex justify-center gap-4">
            {user ? (
              // Jika user sudah login
              <Link to="/dashboard" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                Lanjutkan ke Dashboard <FiArrowRight className="ml-2" />
              </Link>
            ) : (
              // Jika belum login
              <>
                <button onClick={handleOpenRegister} className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                  Mulai Gratis <FiArrowRight className="ml-2" />
                </button>
                <button onClick={handleOpenLogin} className="inline-flex items-center justify-center px-6 py-3 border border-slate-300 text-base font-medium rounded-md text-slate-700 bg-white hover:bg-slate-100">
                  Login
                </button>
              </>
            )}
          </div>
        </motion.div>

        {/* Features Section */}
        <div className="py-16">
          <h2 className="text-3xl font-bold text-center text-slate-800">Fitur Unggulan SIRICO</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-2 transition-all duration-300"
              >
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-6">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-4 text-slate-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
      <AuthModal isOpen={isModalOpen} onClose={handleCloseModal} initialView={modalView} />
    </div>
  );
}

export default LandingPage;
