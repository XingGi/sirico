// frontend/src/components/RiskMatrixWidget.jsx
import React from "react";
import { Card, Title, Text } from "@tremor/react";

// Fungsi helper untuk menentukan warna sel matriks
const getColorForValue = (value) => {
  if (value >= 15) return "bg-red-600";
  if (value >= 8) return "bg-orange-500";
  if (value >= 4) return "bg-yellow-400";
  return "bg-green-500";
};

function RiskMatrixWidget() {
  // Data statis untuk matriks 5x5
  const matrixData = [
    [5, 10, 15, 20, 25],
    [4, 8, 12, 16, 20],
    [3, 6, 9, 12, 15],
    [2, 4, 6, 8, 10],
    [1, 2, 3, 4, 5],
  ];

  // Data statis untuk risiko yang ada di matriks
  const risks = {
    25: 2,
    20: 1,
    16: 1,
    15: 1,
    12: 3,
    9: 5,
    6: 4,
    4: 2,
    3: 1,
    2: 2,
    1: 1,
  };

  return (
    <Card>
      <div className="flex justify-between items-center">
        <div>
          <Title>Risk Matrix</Title>
          <Text>Sample data Plan Starter</Text>
        </div>
        <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg">Upgrade</button>
      </div>

      <div className="mt-6 flex">
        {/* Label Sumbu Y (Likelihood) */}
        <div className="flex flex-col justify-between text-sm font-medium text-gray-600 pr-2">
          <span className="h-full flex items-center">5</span>
          <span className="h-full flex items-center">4</span>
          <span className="h-full flex items-center">3</span>
          <span className="h-full flex items-center">2</span>
          <span className="h-full flex items-center">1</span>
        </div>

        {/* Matriks */}
        <div className="grid grid-cols-5 gap-2 flex-1">
          {matrixData.flat().map((value, index) => (
            <div key={index} className={`${getColorForValue(value)} text-white flex items-center justify-center h-16 rounded-md text-xl font-bold`}>
              {risks[value.toString()] || 0}
            </div>
          ))}
        </div>
      </div>

      {/* Label Sumbu X (Impact) */}
      <div className="flex ml-8 mt-2">
        <div className="grid grid-cols-5 gap-2 flex-1 text-sm font-medium text-gray-600 text-center">
          <span>1</span>
          <span>2</span>
          <span>3</span>
          <span>4</span>
          <span>5</span>
        </div>
      </div>
    </Card>
  );
}

export default RiskMatrixWidget;
