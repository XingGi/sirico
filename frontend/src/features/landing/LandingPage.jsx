// frontend/src/pages/LandingPage.jsx

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FiShield, FiBriefcase, FiBarChart2, FiAlertTriangle, FiArrowRight, FiCpu, FiLayers, FiCheckSquare, FiList, FiSearch, FiTrello, FiUser, FiUsers, FiTrendingUp } from "react-icons/fi";
import AuthModal from "../../components/auth/AuthModal";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import { useAuth } from "../../context/AuthContext";

// Data untuk fitur-fitur yang akan ditampilkan
const features = [
  {
    icon: <FiCpu className="w-10 h-10 text-blue-500" />,
    title: "Risk Management AI",
    description: "Manfaatkan AI untuk identifikasi risiko otomatis, analisis mendalam, dan rekomendasi mitigasi cerdas.", //
  },
  {
    icon: <FiLayers className="w-10 h-10 text-indigo-500" />,
    title: "Asesmen Manual (Dasar & Madya)",
    description: "Gunakan alur kerja terstruktur 3-langkah (Dasar) atau 5-langkah (Madya) untuk asesmen risiko manual yang komprehensif.", //
  },
  {
    icon: <FiCheckSquare className="w-10 h-10 text-green-500" />,
    title: "RSCA (Risk & Control Self-Assessment)",
    description: "Distribusikan kuesioner penilaian mandiri ke berbagai departemen dan konsolidasikan hasil kontrol internal Anda.", //
  },
  {
    icon: <FiBarChart2 className="w-10 h-10 text-purple-500" />,
    title: "Business Process Review (BPR)",
    description: "Petakan proses bisnis Anda langkah demi langkah untuk mengidentifikasi dan mengelola risiko di setiap tahapan operasional.", //
  },
  {
    icon: <FiAlertTriangle className="w-10 h-10 text-red-500" />,
    title: "Business Impact Analysis (BIA)",
    description: "Simulasikan kegagalan aset kritis dan biarkan AI menganalisis dampak bisnis, baik kualitatif maupun kuantitatif.", //
  },
  {
    icon: <FiShield className="w-10 h-10 text-teal-500" />,
    title: "Governance & Compliance",
    description: "Kelola pengguna, peran (roles), hak akses, dan master data regulasi terpusat untuk memastikan kepatuhan.", //
  },
];

const howItWorksSteps = [
  {
    icon: <FiList className="w-10 h-10 text-blue-600" />,
    title: "1. Identifikasi & Konteks",
    description: "Petakan proses bisnis (BPR), tentukan aset kritis (BIA), atau input risiko secara manual. Berikan konteks yang jelas untuk analisis.",
    //
  },
  {
    icon: <FiSearch className="w-10 h-10 text-blue-600" />,
    title: "2. Analisis & Evaluasi",
    description: "Pilih alur kerja Anda. Gunakan AI untuk analisis instan, atau gunakan modul terstruktur (Dasar & Madya) untuk evaluasi mendalam.",
    //
  },
  {
    icon: <FiTrello className="w-10 h-10 text-blue-600" />,
    title: "3. Kontrol & Pantau",
    description: "Terapkan kontrol, distribusikan kuesioner RSCA, dan pantau semua risiko Anda secara real-time melalui Dashboard eksekutif.",
    //
  },
];

const userRoles = [
  {
    icon: <FiUser className="w-12 h-12 text-blue-600" />,
    role: "Manajer Risiko",
    needs: "Alat terpusat untuk menjalankan asesmen (AI, Dasar, Madya), mengelola Pustaka Risiko, dan menyusun laporan komprehensif.",
    //
  },
  {
    icon: <FiUsers className="w-12 h-12 text-blue-600" />,
    role: "Pimpinan Unit Bisnis",
    needs: "Platform mudah untuk mengisi kuesioner RSCA, melaporkan insiden, dan memahami risiko yang relevan dengan departemen mereka.",
    //
  },
  {
    icon: <FiTrendingUp className="w-12 h-12 text-blue-600" />,
    role: "Eksekutif & Direksi",
    needs: "Visualisasi data tingkat tinggi melalui Dashboard, Peta Risiko (Risk Map), dan KRI untuk pengambilan keputusan strategis.",
    //
  },
];

function LandingPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalView, setModalView] = useState("login");
  const { user } = useAuth();

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
      <Navbar onLoginClick={handleOpenLogin} onRegisterClick={handleOpenRegister} />

      {/* Hero Section */}
      <main className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center py-24 sm:py-32">
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight">
            SIRICO
            <span className="block text-blue-600 text-3xl md:text-5xl mt-2">Sistem Informasi Risk & Control</span>
          </h1>
          <p className="mt-6 max-w-3xl mx-auto text-lg text-slate-600">
            Platform GRC (Governance, Risk, & Compliance) terintegrasi yang memberdayakan organisasi Anda untuk mengelola risiko secara cerdas. Mulai dari asesmen manual terstruktur, modul RSCA, BPR, BIA, hingga analisis risiko mendalam
            menggunakan AI.
          </p>
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
        <section className="bg-white py-20">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-slate-800">Solusi GRC Lengkap dalam Satu Platform</h2>
            <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-2 transition-all duration-300"
                >
                  <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-6">{feature.icon}</div>
                  <h3 className="text-xl font-semibold text-slate-900">{feature.title}</h3>
                  <p className="mt-4 text-slate-600">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-slate-50 py-20">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-slate-800">Kelola Risiko dalam 3 Langkah Mudah</h2>
            <p className="mt-4 text-lg text-slate-600 text-center max-w-2xl mx-auto">SIRICO menyederhanakan proses GRC kompleks menjadi alur kerja yang intuitif.</p>
            <div className="mt-16 grid gap-10 md:grid-cols-3">
              {howItWorksSteps.map((step, index) => (
                <motion.div key={step.title} initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.1 }} className="text-center">
                  <div className="flex items-center justify-center h-20 w-20 rounded-full bg-white shadow-md mb-6 mx-auto">{step.icon}</div>
                  <h3 className="text-xl font-semibold text-slate-900">{step.title}</h3>
                  <p className="mt-4 text-slate-600">{step.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* --- BAGIAN BARU: "Untuk Siapa" (Use Cases) --- */}
        <section className="bg-white py-20">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-slate-800">Dirancang untuk Setiap Peran</h2>
            <p className="mt-4 text-lg text-slate-600 text-center max-w-2xl mx-auto">Setiap pemangku kepentingan mendapatkan data yang mereka butuhkan, dalam format yang mereka pahami.</p>
            <div className="mt-16 grid gap-8 md:grid-cols-3">
              {userRoles.map((role, index) => (
                <motion.div
                  key={role.role}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-slate-50 p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center"
                >
                  {role.icon}
                  <h3 className="text-2xl font-semibold text-slate-900 mt-5">{role.role}</h3>
                  <p className="mt-4 text-slate-600">{role.needs}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* --- BAGIAN BARU: Final Call to Action (CTA) --- */}
        <section className="bg-slate-100 py-20">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
              <h2 className="text-3xl font-bold text-slate-800">Siap Mentransformasi Manajemen Risiko Anda?</h2>
              <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">Mulai gunakan SIRICO hari ini. Daftar gratis untuk mencoba fitur-fitur dasar atau hubungi kami untuk demo platform AI GRC kami.</p>
              <div className="mt-8 flex justify-center gap-4">
                {user ? (
                  <Link to="/dashboard" className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-lg font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                    Kembali ke Dashboard
                  </Link>
                ) : (
                  <button onClick={handleOpenRegister} className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-lg font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                    Mulai Gratis Sekarang <FiArrowRight className="ml-2" />
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
      <AuthModal isOpen={isModalOpen} onClose={handleCloseModal} initialView={modalView} />
    </div>
  );
}

export default LandingPage;
