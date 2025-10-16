// frontend/src/pages/risk_management/BasicAssessmentListPage.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Title, Text, Button, Dialog, DialogPanel, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell } from "@tremor/react";
import { FiPlus, FiHome, FiCalendar, FiEdit2, FiEye, FiInfo, FiCheckCircle } from "react-icons/fi";
import apiClient from "../../api";

const formatCurrency = (value) => {
  if (value === null || value === undefined || isNaN(value)) return "Rp 0";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(value);
};

function BasicAssessmentListPage() {
  const [assessments, setAssessments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(true);

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [isViewLoading, setIsViewLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    apiClient
      .get("/basic-assessments")
      .then((response) => setAssessments(response.data))
      .catch((error) => console.error("Gagal memuat asesmen dasar:", error))
      .finally(() => setIsLoading(false));
  }, []);

  const handleViewClick = async (assessmentId) => {
    setIsViewLoading(true);
    setIsViewModalOpen(true);
    try {
      const response = await apiClient.get(`/basic-assessments/${assessmentId}`);
      setSelectedAssessment(response.data);
    } catch (error) {
      console.error("Gagal memuat detail asesmen:", error);
      alert("Gagal memuat detail.");
      setIsViewModalOpen(false);
    } finally {
      setIsViewLoading(false);
    }
  };

  return (
    <>
      <div className="p-6 sm:p-10">
        <div className="flex justify-between items-center">
          <div>
            <Title>Asesmen Dasar</Title>
            <Text>Daftar semua asesmen tingkat dasar yang telah dibuat.</Text>
          </div>
          <Button icon={FiPlus} onClick={() => navigate("/risk-management/dasar/new")}>
            New Assessment
          </Button>
        </div>

        <div className="mt-6">
          {isLoading ? (
            <Text>Memuat data...</Text>
          ) : assessments.length > 0 ? (
            <div className="space-y-4">
              {assessments.map((assessment) => (
                <Card key={assessment.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold text-tremor-content-strong">{assessment.nama_unit_kerja}</p>
                      <div className="flex items-center gap-4 mt-2 text-tremor-content">
                        <span className="flex items-center gap-1.5 text-xs">
                          <FiHome className="w-4 h-4" />
                          {assessment.nama_perusahaan}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs">
                          <FiCalendar className="w-4 h-4" />
                          {new Date(assessment.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="secondary" icon={FiEye} onClick={() => handleViewClick(assessment.id)}>
                        View
                      </Button>
                      <Button variant="light" icon={FiEdit2} color="blue" onClick={() => navigate(`/risk-management/dasar/edit/${assessment.id}`)} />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center p-8">
              <Text>Belum ada asesmen dasar.</Text>
            </Card>
          )}
        </div>
      </div>

      {/* --- POPUP DISCLAIMER YANG DIPERBARUI --- */}
      <Dialog open={isDisclaimerOpen} onClose={() => setIsDisclaimerOpen(false)} static={true}>
        <DialogPanel className="max-w-2xl">
          {/* Header dengan Ikon */}
          <div className="flex flex-col items-center text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-2">
              <FiInfo className="w-6 h-6 text-blue-600" />
            </div>
            <Title>Portofolio Uji Kompetensi</Title>
            <Text className="mt-1">Selamat datang di modul Asesmen Dasar.</Text>
          </div>

          {/* Konten Utama */}
          <div className="mt-6 space-y-6">
            {/* Bagian 1: Tugas Utama */}
            <div>
              <h3 className="font-semibold text-tremor-content-strong">Tiga Tugas Utama</h3>
              <Text className="mt-1">Dalam pelatihan Risk Management Officer, Anda diharapkan mampu memetakan tiga hal berikut:</Text>
              <ul className="mt-2 space-y-2">
                <li className="flex items-start">
                  <FiCheckCircle className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                  Konteks internal dan eksternal organisasi
                </li>
                <li className="flex items-start">
                  <FiCheckCircle className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                  Melakukan Identifikasi Risiko
                </li>
                <li className="flex items-start">
                  <FiCheckCircle className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                  Melakukan Analisis Risiko
                </li>
              </ul>
            </div>

            {/* Garis Pemisah */}
            <hr />

            {/* Bagian 2: Pemahaman Dasar */}
            <div>
              <h3 className="font-semibold text-tremor-content-strong">Pemahaman Dasar</h3>
              <Text className="mt-1">Untuk menyelesaikan tugas, pahami beberapa konsep kunci berikut:</Text>
              <ul className="list-decimal list-inside mt-2 space-y-1 text-tremor-content text-sm">
                <li>Konteks adalah faktor-faktor yang mempengaruhi proses manajemen risiko.</li>
                <li>Konteks internal adalah lingkungan di dalam organisasi.</li>
                <li>Konteks eksternal adalah lingkungan di luar organisasi.</li>
                <li>Identifikasi risiko adalah proses mendefinisikan potensi risiko.</li>
                <li>Analisis risiko adalah proses mengukur probabilitas dan dampak risiko.</li>
              </ul>
            </div>
          </div>

          {/* Tombol OK */}
          <div className="flex justify-end mt-8">
            <Button onClick={() => setIsDisclaimerOpen(false)}>OK</Button>
          </div>
        </DialogPanel>
      </Dialog>
      {/* Modal untuk View Detail Asesmen */}
      <Dialog open={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} static={true}>
        <DialogPanel className="max-w-4xl">
          {isViewLoading ? (
            <Text className="text-center">Memuat detail...</Text>
          ) : (
            selectedAssessment && (
              <>
                <Title>Detail Asesmen: {selectedAssessment.nama_unit_kerja}</Title>
                <Text>{selectedAssessment.nama_perusahaan}</Text>

                <div className="mt-6 max-h-[70vh] overflow-y-auto space-y-6 pr-2">
                  {/* Data Konteks */}
                  <Card>
                    <Title as="h3">Konteks Organisasi</Title>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableHeaderCell>Eksternal</TableHeaderCell>
                          <TableHeaderCell>Internal</TableHeaderCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedAssessment.contexts.map((ctx, i) => (
                          <TableRow key={i}>
                            <TableCell>{ctx.external}</TableCell>
                            <TableCell>{ctx.internal}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Card>
                  {/* Data Analisis Risiko */}
                  <Card>
                    <Title as="h3">Analisis Risiko</Title>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableHeaderCell>Deskripsi</TableHeaderCell>
                          <TableHeaderCell>Skor (W)</TableHeaderCell>
                          <TableHeaderCell>Nilai Bersih</TableHeaderCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedAssessment.analyses.map((an, i) => {
                          const riskInfo = selectedAssessment.risks[an.risk_identification_id];
                          return (
                            <TableRow key={i}>
                              <TableCell>{riskInfo?.deskripsi_risiko}</TableCell>
                              <TableCell>{(an.probabilitas || 0) * (an.dampak || 0)}</TableCell>
                              <TableCell>{formatCurrency((an.dampak_finansial || 0) * ((an.probabilitas_kualitatif || 0) / 100))}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </Card>
                </div>

                <div className="flex justify-end mt-6">
                  <Button onClick={() => setIsViewModalOpen(false)}>Tutup</Button>
                </div>
              </>
            )
          )}
        </DialogPanel>
      </Dialog>
    </>
  );
}

export default BasicAssessmentListPage;
