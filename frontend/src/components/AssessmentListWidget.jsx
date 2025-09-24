import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, Title, Text, List, ListItem } from "@tremor/react";
import apiClient from "../api";

function AssessmentListWidget() {
  const [assessments, setAssessments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get("/assessments?limit=5") // Kita bisa tambahkan parameter limit nanti di API
      .then((res) => setAssessments(res.data))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <p>Memuat daftar asesmen...</p>;
  }

  return (
    <Card className="bg-emerald-50 border-emerald-200">
      <Title>Recent Assessments</Title>
      <Text>5 asesmen terakhir yang Anda kerjakan.</Text>

      <div className="mt-4 space-y-3">
        {isLoading ? (
          <Text>Memuat...</Text>
        ) : assessments.length > 0 ? (
          assessments.slice(0, 5).map((assessment) => (
            // ↓↓↓ Bungkus setiap item dengan Link dan beri style ↓↓↓
            <Link
              key={assessment.id}
              to={`/assessments/${assessment.id}`} // Nanti akan mengarah ke halaman detail
              className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div>
                <p className="font-semibold text-tremor-content-emphasis">{assessment.nama_asesmen}</p>
                <p className="text-sm text-tremor-content">Mulai: {assessment.tanggal_mulai}</p>
              </div>
              <span className="text-sm font-medium text-blue-600 border border-blue-600 px-3 py-1 rounded-md hover:bg-blue-600 hover:text-white">View</span>
            </Link>
          ))
        ) : (
          <div className="text-center py-4">
            <Text>Belum ada asesmen yang dibuat.</Text>
          </div>
        )}
      </div>
    </Card>
  );
}

export default AssessmentListWidget;
