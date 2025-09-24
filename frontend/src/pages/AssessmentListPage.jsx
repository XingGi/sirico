// frontend/src/pages/AssessmentListPage.jsx
import React, { useState, useEffect } from "react";
import { Card, Title, Text, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Badge } from "@tremor/react";
import apiClient from "../api";
import { FiEye } from "react-icons/fi";

function AssessmentListPage() {
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

  return (
    <div className="p-6 sm:p-10">
      <Title>Semua Asesmen Risiko</Title>
      <Text>Kelola dan tinjau semua asesmen risiko yang telah dibuat.</Text>

      <Card className="mt-6">
        {isLoading ? (
          <Text>Memuat data...</Text>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Nama Asesmen</TableHeaderCell>
                <TableHeaderCell>Tanggal Mulai</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Aksi</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {assessments.length > 0 ? (
                assessments.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.nama_asesmen}</TableCell>
                    <TableCell>{item.tanggal_mulai}</TableCell>
                    <TableCell>
                      <Badge color={item.tanggal_selesai ? "emerald" : "amber"}>{item.tanggal_selesai ? "Selesai" : "In Progress"}</Badge>
                    </TableCell>
                    <TableCell>
                      <button className="text-blue-500 hover:text-blue-700">
                        <FiEye className="w-5 h-5" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-500">
                    Belum ada data asesmen.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}

export default AssessmentListPage;
