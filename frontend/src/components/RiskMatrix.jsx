// frontend/src/components/RiskMatrix.jsx

import React from "react";
import { Card, Title, Text, Badge } from "@tremor/react";

// Fungsi helper untuk mendapatkan warna latar sel matriks (tidak berubah)
const getColorForCell = (value) => {
  if (value >= 15) return "bg-red-500";
  if (value >= 8) return "bg-orange-400";
  if (value >= 4) return "bg-yellow-300";
  if (value >= 2) return "bg-lime-400";
  return "bg-green-500";
};

// Data untuk legenda (tidak berubah)
const legendItems = [
  { level: "5 - High", color: "bg-red-500" },
  { level: "4 - Moderate to High", color: "bg-orange-400" },
  { level: "3 - Moderate", color: "bg-yellow-300" },
  { level: "2 - Low to Moderate", color: "bg-lime-400" },
  { level: "1 - Low", color: "bg-green-500" },
];

function RiskMatrix({ risks = [] }) {
  // 1. Ubah struktur data untuk menampung 'inherent' dan 'residual'
  const matrixRisks = {};
  for (let i = 1; i <= 5; i++) {
    matrixRisks[i] = {};
    for (let l = 1; l <= 5; l++) {
      // Setiap sel sekarang punya dua array: satu untuk inherent, satu untuk residual
      matrixRisks[i][l] = { inherent: [], residual: [] };
    }
  }

  // 2. Kelompokkan risiko ke dalam bucket yang sesuai
  risks.forEach((risk) => {
    const i_impact = risk.inherent_impact;
    const i_likelihood = risk.inherent_likelihood;
    const r_impact = risk.residual_impact;
    const r_likelihood = risk.residual_likelihood;

    // Plot Inherent Risk
    if (i_impact >= 1 && i_impact <= 5 && i_likelihood >= 1 && i_likelihood <= 5) {
      matrixRisks[i_impact][i_likelihood].inherent.push(risk);
    }
    // Plot Residual Risk
    if (r_impact >= 1 && r_impact <= 5 && r_likelihood >= 1 && r_likelihood <= 5) {
      matrixRisks[r_impact][r_likelihood].residual.push(risk);
    }
  });

  // 3. Buat array untuk me-render grid matriks (logika sama, tapi data beda)
  const gridCells = [];
  for (let l = 5; l >= 1; l--) {
    for (let i = 1; i <= 5; i++) {
      const value = i * l;
      const cellRisks = matrixRisks[i][l]; // Sekarang berisi { inherent: [...], residual: [...] }
      gridCells.push({
        value: value,
        risks: cellRisks,
        key: `cell-${i}-${l}`,
      });
    }
  }

  return (
    <Card className="mt-6 rounded-xl shadow-lg">
      <Title>Risk Matrix</Title>
      <Text>Visual mapping of inherent vs residual risk</Text>

      <div className="mt-6 flex flex-col md:flex-row gap-8">
        {/* Sisi Kiri: Matriks dan Label */}
        <div className="flex-grow">
          <div className="flex">
            <div className="flex flex-col text-sm font-medium text-gray-600 pr-4 text-center w-20">
              {/* Wrapper untuk label agar bisa disejajarkan dengan benar */}
              <div className="flex flex-col justify-end h-full">
                {/* 1. Label "Likelihood" sekarang di atas dengan margin bawah */}
                <div className="mb-2 font-bold text-gray-700">Likelihood</div>
                {/* 2. Angka-angka sumbu Y */}
                <div className="flex flex-col-reverse justify-between">
                  <span className="h-24 flex items-center justify-center">1</span>
                  <span className="h-24 flex items-center justify-center">2</span>
                  <span className="h-24 flex items-center justify-center">3</span>
                  <span className="h-24 flex items-center justify-center">4</span>
                  <span className="h-24 flex items-center justify-center">5</span>
                </div>
              </div>
            </div>

            {/* Grid Matriks Utama */}
            <div className="grid grid-cols-5 gap-1 flex-1">
              {gridCells.map((cell) => (
                <div key={cell.key} className={`${getColorForCell(cell.value)} h-24 rounded-md p-1.5 flex flex-wrap gap-1 content-start overflow-y-auto`}>
                  {/* 4. Render Badge untuk Inherent Risk */}
                  {cell.risks.inherent.map((risk) => (
                    <Badge key={`i-${risk.id}`} className="text-xs font-mono bg-gray-200 text-gray-800">
                      {risk.kode_risiko}
                    </Badge>
                  ))}
                  {/* 5. Render Badge untuk Residual Risk */}
                  {cell.risks.residual.map((risk) => (
                    <Badge key={`r-${risk.id}`} className="text-xs font-mono bg-pink-200 text-pink-800">
                      {risk.kode_risiko}
                    </Badge>
                  ))}
                </div>
              ))}
            </div>
          </div>
          {/* Label Sumbu X (Impact) */}
          <div className="flex mt-2">
            <div className="w-16"></div>
            <div className="grid grid-cols-5 gap-1 flex-1 text-sm font-medium text-gray-600 text-center">
              <span>1</span>
              <span>2</span>
              <span>3</span>
              <span>4</span>
              <span>5</span>
            </div>
          </div>
          <div className="text-center font-bold mt-1 text-gray-700">Impact</div>
        </div>

        {/* Sisi Kanan: Legenda */}
        <div className="w-full md:w-64 flex-shrink-0">
          <h4 className="font-semibold text-gray-700">Risk Level Legend</h4>
          <div className="space-y-2 mt-2">
            {legendItems.map((item) => (
              <div key={item.level} className="flex items-center">
                <div className={`w-5 h-5 rounded ${item.color} mr-2`}></div>
                <span className="text-sm">{item.level}</span>
              </div>
            ))}
          </div>
          {/* ↓↓↓ 6. Perbarui Legenda Risk Type ↓↓↓ */}
          <div className="mt-4 border-t pt-4">
            <h4 className="font-semibold text-gray-700">Risk Type</h4>
            <div className="space-y-2 mt-2">
              <div className="flex items-center">
                <div className="w-5 h-5 rounded bg-gray-200 mr-2"></div>
                <span className="text-sm">= Inherent Risk</span>
              </div>
              <div className="flex items-center">
                <div className="w-5 h-5 rounded bg-pink-200 mr-2"></div>
                <span className="text-sm">= Residual Risk</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default RiskMatrix;
