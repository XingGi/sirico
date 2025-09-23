import React from "react";

function ProcessStepNode({ step }) {
  return (
    <div className="flex items-center">
      {/* Kotak untuk langkah proses */}
      <div className="bg-white border-2 border-blue-500 rounded-lg p-4 shadow-md w-48 text-center">
        <p className="font-bold text-gray-800">{step.nama_langkah}</p>
        <p className="text-sm text-gray-500 mt-1">Urutan: {step.urutan}</p>
      </div>
      {/* Panah (dihilangkan untuk item terakhir nanti) */}
      <div className="w-16 text-center text-blue-500 font-bold text-2xl">→</div>
    </div>
  );
}

export default ProcessStepNode;
