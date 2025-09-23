import React, { useState, useEffect } from "react";
import apiClient from "../api";

function AssessmentListWidget() {
  const [assessments, setAssessments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        const response = await apiClient.get("/assessments");
        setAssessments(response.data);
      } catch (error) {
        console.error("Gagal memuat data asesmen:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAssessments();
  }, []);

  if (isLoading) {
    return <p>Memuat daftar asesmen...</p>;
  }

  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Assessments</h3>
      <div className="space-y-3">
        {assessments.length > 0 ? (
          assessments.map((assessment) => (
            <div key={assessment.id} className="border rounded-md p-3 hover:bg-gray-50">
              <p className="font-semibold text-gray-800">{assessment.nama_asesmen}</p>
              <p className="text-sm text-gray-500">Mulai: {assessment.tanggal_mulai}</p>
            </div>
          ))
        ) : (
          <p className="text-gray-600">Belum ada asesmen yang dibuat.</p>
        )}
      </div>
    </div>
  );
}

export default AssessmentListWidget;
