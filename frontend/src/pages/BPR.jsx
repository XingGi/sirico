import React from "react";
import { Link } from "react-router-dom"; // Jika diperlukan navigasi
import ProcessStepNode from "../components/ProcessStepNode"; // Asumsi path komponen

function BPR() {
  // Data dummy untuk visualisasi awal
  // Nantinya, data ini akan diambil dari API
  const mockProcess = {
    id: 1,
    nama_proses: "Proses Perekrutan Karyawan Baru",
    pemilik_proses: "Divisi HR",
    steps: [
      { id: 1, nama_langkah: "Review CV Pelamar", urutan: 1 },
      { id: 2, nama_langkah: "Wawancara HR", urutan: 2 },
      { id: 3, nama_langkah: "Tes Kompetensi", urutan: 3 },
      { id: 4, nama_langkah: "Wawancara User", urutan: 4 },
      { id: 5, nama_langkah: "Offering & Kontrak", urutan: 5 },
    ],
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-2">Business Process Review</h1>
      <p className="text-gray-600 mb-8">Visualisasikan dan kelola alur kerja proses bisnis Anda.</p>

      {/* Nantinya, di sini akan ada daftar proses bisnis di sidebar kiri */}
      {/* Untuk saat ini, kita langsung tampilkan satu proses */}

      <div className="bg-white p-6 rounded-xl shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{mockProcess.nama_proses}</h2>
            <p className="text-gray-500">Pemilik Proses: {mockProcess.pemilik_proses}</p>
          </div>
          <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">+ Tambah Langkah</button>
        </div>

        {/* Wrapper untuk diagram alir dengan horizontal scroll di layar kecil */}
        <div className="overflow-x-auto pb-4">
          <div className="flex items-center">
            {mockProcess.steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <ProcessStepNode step={step} />
                {/* Sembunyikan panah untuk item terakhir */}
                {index === mockProcess.steps.length - 1 && (
                  <div className="w-16"></div> // Placeholder untuk merapikan layout
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BPR;
