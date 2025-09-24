import React, { useState, useEffect } from "react";
import apiClient from "../api";
import { Card, Title, Text } from "@tremor/react";

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
    <Card>
      <Title>Recent Assessments</Title>
      <div className="mt-4 space-y-3">
        {assessments.length > 0 ? (
          assessments.map((assessment) => (
            <div key={assessment.id} className="border-t border-gray-200 pt-3">
              <Text className="font-semibold text-gray-800">{assessment.nama_asesmen}</Text>
              <Text>Mulai: {assessment.tanggal_mulai}</Text>
            </div>
          ))
        ) : (
          <Text>Belum ada asesmen yang dibuat.</Text>
        )}
      </div>
    </Card>
  );
}

export default AssessmentListWidget;
