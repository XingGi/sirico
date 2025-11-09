import React from "react";

function KRICard({ kri }) {
  // Logika untuk warna berdasarkan ambang batas bisa ditambahkan di sini
  const cardColor = "bg-white"; // Default

  return (
    <div className={`${cardColor} shadow-lg rounded-lg p-6`}>
      <h3 className="text-xl font-bold text-gray-800 mb-2">{kri.nama_kri}</h3>
      <p className="text-gray-600 mb-4">{kri.deskripsi || "Tidak ada deskripsi."}</p>
      <div className="flex justify-between items-center text-sm text-gray-500">
        <span>Tipe: {kri.tipe_data}</span>
        <span className="font-semibold">Batas Kritis: {kri.ambang_batas_kritis}</span>
      </div>
    </div>
  );
}

export default KRICard;
