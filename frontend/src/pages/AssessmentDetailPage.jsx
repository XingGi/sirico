// frontend/src/pages/AssessmentDetailPage.jsx
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, Title, Text, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell } from "@tremor/react";
import apiClient from "../api";

function AssessmentDetailPage() {
  const { assessmentId } = useParams();
  const [assessment, setAssessment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get(`/assessments/${assessmentId}`)
      .then((response) => {
        setAssessment(response.data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Gagal memuat detail asesmen:", error);
        setIsLoading(false);
      });
  }, [assessmentId]);

  if (isLoading) return <div className="p-10">Memuat detail asesmen...</div>;
  if (!assessment) return <div className="p-10">Asesmen tidak ditemukan.</div>;

  return (
    <div className="p-6 sm:p-10">
      <Title>{assessment.nama_asesmen}</Title>
      <Text>{assessment.deskripsi}</Text>

      <Card className="mt-6">
        <Title>Risk Register</Title>
        <Text>Daftar risiko yang teridentifikasi dalam asesmen ini.</Text>
        <Table className="mt-4">
          <TableHead>
            <TableRow>
              <TableHeaderCell>Kode Risiko</TableHeaderCell>
              <TableHeaderCell>Deskripsi Risiko</TableHeaderCell>
              <TableHeaderCell>Level Risiko Inheren</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {assessment.risks.length > 0 ? (
              assessment.risks.map((risk) => (
                <TableRow key={risk.id}>
                  <TableCell>{risk.kode_risiko}</TableCell>
                  <TableCell>{risk.deskripsi_risiko}</TableCell>
                  <TableCell>{risk.level_risiko_inheren}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center">
                  Belum ada risiko yang ditambahkan.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

export default AssessmentDetailPage;
