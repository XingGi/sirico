import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import apiClient from "../api";
import KRICard from "../components/KRICard";
import HorizonScanWidget from "../components/HorizonScanWidget";
import AssessmentListWidget from "../components/AssessmentListWidget";

function Dashboard() {
  const [kris, setKris] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchKRI = async () => {
      try {
        const response = await apiClient.get("/kri");
        setKris(response.data);
      } catch (err) {
        setError("Gagal memuat data KRI.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchKRI();
  }, []);

  if (isLoading) return <div className="p-8">Memuat data...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <div className="bg-gray-100 min-h-screen">
      <header className="bg-white shadow p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">SIRICO Command Center</h1>

        {/* ↓↓↓ UBAH BAGIAN INI ↓↓↓ */}
        <div className="space-x-2">
          <Link to="/rsca" className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded">
            Modul RSCA
          </Link>
          <Link to="/assessment-studio" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            Buat Asesmen Baru
          </Link>
        </div>
      </header>

      <main className="p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri (lebih besar) */}
        <div className="lg:col-span-2 space-y-6">
          <AssessmentListWidget />

          {/* Bagian untuk Key Risk Indicators */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Key Risk Indicators (KRI)</h2>
            {kris.length === 0 ? (
              <p>Anda belum memiliki KRI.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {kris.map((kri) => (
                  <KRICard key={kri.id} kri={kri} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Kolom Kanan (lebih kecil) */}
        <div className="lg:col-span-1">
          <HorizonScanWidget />
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
