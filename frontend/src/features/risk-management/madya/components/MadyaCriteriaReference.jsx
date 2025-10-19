// frontend/src/features/risk-management/madya/components/MadyaCriteriaReference.jsx
import React, { useState } from "react";
import { Card, Title, Text, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell } from "@tremor/react";

// Data Kriteria Probabilitas (dari CSV)
const probabilityCriteria = [
  { level: 5, likelihood: "Hampir Pasti Terjadi", frequency: "sekali dalam 1 bulan", percentage: "> 10%", probability: "80% - 100%" },
  { level: 4, likelihood: "Sangat Mungkin Terjadi", frequency: "sekali dalam 2 bulan", percentage: "> 5% - 10%", probability: "60% - 80%" },
  { level: 3, likelihood: "Bisa Terjadi", frequency: "sekali dalam 4 bulan", percentage: "> 1% - 5%", probability: "40% - 60%" },
  { level: 2, likelihood: "Jarang Terjadi", frequency: "sekali dalam 6 bulan", percentage: "1 permil - 1%", probability: "20% - 40%" },
  { level: 1, likelihood: "Sangat Jarang Terjadi", frequency: "paling banyak 1x/tahun", percentage: "< 1 permil", probability: "< 20%" },
];

// Data Kriteria Dampak (dari CSV, dikelompokkan per kategori)
const impactCriteria = {
  Finansial: [
    { parameter: "Financial Loss (% Batasan Risiko)", level1: "< 20%", level2: "20%-40%", level3: "40%-60%", level4: "60%-80%", level5: "> 80%" },
    { parameter: "Penurunan Pendapatan (% Pendapatan)", level1: "< 1%", level2: "1%-5%", level3: "5%-10%", level4: "10%-20%", level5: "> 20%" },
    // Tambahkan parameter lain dari CSV Finansial jika ada
  ],
  Reputasi: [
    { parameter: "Publikasi Negatif", level1: "Terisolasi (Internal)", level2: "Terisolasi (Media Lokal)", level3: "Terbatas (Media Nasional)", level4: "Luas (Nasional/Internasional)", level5: "Sangat Luas (Isu Utama)" },
    { parameter: "Penurunan Citra", level1: "Sangat Rendah", level2: "Rendah", level3: "Sedang", level4: "Tinggi", level5: "Sangat Tinggi" },
    { parameter: "Penurunan Pangsa Pasar", level1: "<= 5%", level2: "> 5% s/d 10%", level3: "> 10% s/d 15%", level4: "> 15% s/d 20%", level5: "> 20%" },
  ],
  Kepatuhan: [
    // Nama Tab disesuaikan
    { parameter: "Dampak Hukum & Regulasi", level1: "Peringatan Lisan", level2: "Peringatan Tertulis", level3: "Denda Kecil/Administratif", level4: "Denda Besar/Pembatasan", level5: "Pencabutan Izin/Pidana" },
    { parameter: "Jumlah Pelanggaran", level1: "0", level2: "1", level3: "2-3", level4: "4-5", level5: "> 5" },
  ],
  SDM: [
    // Nama Tab disesuaikan
    { parameter: "Keluhan Karyawan", level1: "Selesai di Unit", level2: "Perlu eskalasi terbatas", level3: "Perlu eskalasi luas", level4: "Gangguan Operasional", level5: "Pemberitaan Negatif" },
    { parameter: "Turn Over Pegawai Bertalenta (% per tahun)", level1: "< 1%", level2: "1%-3%", level3: "3%-5%", level4: "5%-7%", level5: "> 7%" }, // Judul diperjelas
    { parameter: "Keselamatan Kerja", level1: "Kasus Pertolongan Pertama", level2: "Kasus Perawatan Medis", level3: "Cacat Sementara/Absensi Terbatas", level4: "Cacat Permanen/Kematian Tunggal", level5: "Kematian Jamak" },
  ],
  Operasional: [
    { parameter: "Gangguan Layanan Utama (Jam)", level1: "< 1 jam", level2: "1-4 jam", level3: "4-8 jam", level4: "8-24 jam", level5: "> 24 jam" }, // Judul diperjelas
    { parameter: "Pelanggaran SLA (%)", level1: "< 1%", level2: "1%-3%", level3: "3%-5%", level4: "5%-10%", level5: "> 10%" }, // Judul diperjelas
    { parameter: "Serangan Siber (rata-rata per minggu)", level1: "< 50", level2: "50-100", level3: "100-200", level4: "200-500", level5: "> 500" },
    // Tambahkan parameter lain dari CSV Operasional jika ada
  ],
  // Tambahkan KATEGORI lain dari CSV jika perlu (misal: Proyek, Lingkungan, dll.)
};

// Style warna untuk header skala (seperti di RiskCriteriaReference)
const criteriaStyles = {
  level1: "bg-green-500 text-white text-center",
  level2: "bg-lime-500 text-white text-center",
  level3: "bg-yellow-400 text-black text-center",
  level4: "bg-orange-500 text-white text-center",
  level5: "bg-red-600 text-white text-center",
};

function MadyaCriteriaReference() {
  const [activeImpactTab, setActiveImpactTab] = useState("Finansial");

  return (
    <div className="space-y-6">
      {/* Tabel Probabilitas */}
      <div>
        <Title as="h4">Kriteria Probabilitas</Title>
        <Table className="mt-2">
          <TableHead>
            <TableRow className="bg-slate-100">
              <TableHeaderCell>Skala</TableHeaderCell>
              <TableHeaderCell>Kemungkinan Terjadi</TableHeaderCell>
              <TableHeaderCell>Frekuensi Kejadian</TableHeaderCell>
              <TableHeaderCell>Persentase Kejadian</TableHeaderCell>
              <TableHeaderCell>Probabilitas</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {probabilityCriteria.map((item) => (
              <TableRow key={item.level}>
                <TableCell className={`font-semibold ${criteriaStyles[`level${item.level}`]}`}>{item.level}</TableCell>
                <TableCell>{item.likelihood}</TableCell>
                <TableCell>{item.frequency}</TableCell>
                <TableCell>{item.percentage}</TableCell>
                <TableCell>{item.probability}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Tabel Dampak */}
      <div>
        <Title as="h4">Kriteria Dampak</Title>
        {/* Tab Navigasi */}
        <div className="mt-4 border-b border-gray-200">
          <nav className="-mb-px flex space-x-6 overflow-x-auto">
            {Object.keys(impactCriteria).map((tabName) => (
              <button
                key={tabName}
                className={`shrink-0 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm focus:outline-none ${
                  activeImpactTab === tabName ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                onClick={() => setActiveImpactTab(tabName)}
              >
                {tabName}
              </button>
            ))}
          </nav>
        </div>

        {/* Tabel Dampak Aktif */}
        <div className="mt-3">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell className="bg-slate-100 w-1/3">Parameter</TableHeaderCell>
                <TableHeaderCell className={criteriaStyles.level1}>1</TableHeaderCell>
                <TableHeaderCell className={criteriaStyles.level2}>2</TableHeaderCell>
                <TableHeaderCell className={criteriaStyles.level3}>3</TableHeaderCell>
                <TableHeaderCell className={criteriaStyles.level4}>4</TableHeaderCell>
                <TableHeaderCell className={criteriaStyles.level5}>5</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {impactCriteria[activeImpactTab].map((row, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{row.parameter}</TableCell>
                  <TableCell className="text-center">{row.level1}</TableCell>
                  <TableCell className="text-center">{row.level2}</TableCell>
                  <TableCell className="text-center">{row.level3}</TableCell>
                  <TableCell className="text-center">{row.level4}</TableCell>
                  <TableCell className="text-center">{row.level5}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

export default MadyaCriteriaReference;
