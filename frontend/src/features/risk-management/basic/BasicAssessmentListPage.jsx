// frontend/src/pages/risk_management/BasicAssessmentListPage.jsx

import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, Title, Text, Button, Dialog, DialogPanel, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell } from "@tremor/react";
import { FiPlus, FiHome, FiCalendar, FiEdit2, FiEye, FiInfo, FiCheckCircle, FiDownload, FiMaximize, FiMinimize, FiGrid, FiList, FiLoader, FiTrash2, FiAlertTriangle } from "react-icons/fi";
import apiClient from "../../../api/api";
import BasicAssessmentView from "./components/BasicAssessmentView";

const formatCurrency = (value) => {
  if (value === null || value === undefined || isNaN(value)) return "Rp 0";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(value);
};

const ConfirmationDialog = ({ isOpen, onClose, onConfirm, title, message }) => (
  <Dialog open={isOpen} onClose={onClose} static={true}>
    <DialogPanel>
      <div className="text-center">
        <FiAlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <Title>{title}</Title>
        <Text className="mt-2">{message}</Text>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Batal
        </Button>
        <Button color="red" onClick={onConfirm}>
          Hapus
        </Button>
      </div>
    </DialogPanel>
  </Dialog>
);

function BasicAssessmentListPage() {
  const [assessments, setAssessments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(true);

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [isViewLoading, setIsViewLoading] = useState(false);
  const [isExportingId, setIsExportingId] = useState(null);

  const [isViewFullscreen, setIsViewFullscreen] = useState(false);
  const viewContentRef = useRef(null);
  const [viewMode, setViewMode] = useState("list");
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    assessmentId: null,
    assessmentName: "",
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAssessments = () => {
    setIsLoading(true); // Set loading ON setiap kali fetch
    apiClient
      .get("/basic-assessments")
      .then((response) => setAssessments(response.data))
      .catch((error) => console.error("Gagal memuat asesmen dasar:", error))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchAssessments(); // Panggil fungsi fetch

    const handleFullscreenChange = () => {
      setIsViewFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
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

  const toggleViewFullscreen = () => {
    if (!document.fullscreenElement) {
      viewContentRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const handleExportClick = async (assessmentId, assessmentName) => {
    setIsExportingId(assessmentId);
    try {
      const response = await apiClient.get(`/basic-assessments/${assessmentId}/export`, {
        responseType: "blob", // Penting: memberitahu axios untuk menerima file
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Asesmen_Dasar_${assessmentName}.xlsx`);
      document.body.appendChild(link);
      link.click();

      // Hapus link sementara
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Gagal mengekspor file:", error);
      alert("Gagal mengekspor file Excel.");
    } finally {
      setIsExportingId(null);
    }
  };

  const openDeleteConfirm = (assessmentId, assessmentName) => {
    setDeleteConfirmation({
      isOpen: true,
      assessmentId: assessmentId,
      assessmentName: assessmentName,
    });
  };

  const closeDeleteConfirm = () => {
    setDeleteConfirmation({ isOpen: false, assessmentId: null, assessmentName: "" });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmation.assessmentId) return;

    setIsDeleting(true); // Mulai loading hapus
    try {
      // Panggil API DELETE
      await apiClient.delete(`/basic-assessments/${deleteConfirmation.assessmentId}`);
      alert(`Asesmen "${deleteConfirmation.assessmentName}" berhasil dihapus.`);
      closeDeleteConfirm(); // Tutup dialog
      fetchAssessments(); // Muat ulang daftar setelah berhasil hapus
    } catch (error) {
      console.error("Gagal menghapus asesmen:", error);
      alert("Gagal menghapus asesmen: " + (error.response?.data?.msg || "Terjadi kesalahan."));
      // Dialog tetap terbuka jika gagal, agar user tahu ada masalah
    } finally {
      setIsDeleting(false); // Hentikan loading hapus
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
          <div className="flex items-center gap-2">
            <Button icon={viewMode === "list" ? FiGrid : FiList} variant="light" onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")} aria-label={viewMode === "list" ? "Switch to grid view" : "Switch to list view"} />
            <Button icon={FiPlus} onClick={() => navigate("/risk-management/dasar/new")}>
              New Assessment
            </Button>
          </div>
        </div>

        <div className={`mt-6 ${viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}`}>
          {isLoading ? (
            <div className="col-span-full flex justify-center items-center p-10">
              <FiLoader className="animate-spin h-6 w-6 mr-3 text-tremor-content-emphasis" />
              <Text>Memuat data...</Text>
            </div>
          ) : assessments.length > 0 ? (
            assessments.map((assessment) => (
              <Card key={assessment.id} className="p-0 overflow-hidden hover:shadow-lg transition-shadow duration-200 flex flex-col">
                <div className="p-4 flex-grow group">
                  <div className="flex justify-between items-start">
                    <div>
                      <Link to={`/risk-management/dasar/edit/${assessment.id}`} className="block mb-2 group">
                        <p className="font-bold text-tremor-content-strong group-hover:text-blue-600">{assessment.nama_unit_kerja}</p>
                      </Link>
                      <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-tremor-content">
                        <span className="flex items-center gap-1.5 text-xs">
                          <FiHome className="w-4 h-4 flex-shrink-0" />
                          {assessment.nama_perusahaan}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs">
                          <FiCalendar className="w-4 h-4 flex-shrink-0" />
                          {new Date(assessment.created_at).toLocaleDateString("id-ID")}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 transition-opacity duration-300 flex-shrink-0">
                      <Button
                        size="xs"
                        variant="secondary"
                        icon={FiEye}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewClick(assessment.id);
                        }}
                      >
                        View
                      </Button>
                      <Button
                        variant="light"
                        size="xs"
                        icon={FiEdit2}
                        color="blue"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/risk-management/dasar/edit/${assessment.id}`);
                        }}
                      />
                      <Button
                        variant="light"
                        size="xs"
                        icon={FiTrash2} // Gunakan ikon trash
                        color="red"
                        onClick={(e) => {
                          e.stopPropagation(); // Cegah klik menyebar ke Link
                          openDeleteConfirm(assessment.id, assessment.nama_unit_kerja); // Buka dialog konfirmasi
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div className="border-t p-2 flex justify-end">
                  <Button
                    size="xs"
                    variant="light"
                    icon={FiDownload}
                    loading={isExportingId === assessment.id} // Gunakan ID
                    onClick={() => handleExportClick(assessment.id, assessment.nama_unit_kerja)}
                  >
                    Export
                  </Button>
                </div>
              </Card>
            ))
          ) : (
            <Card className="col-span-full text-center p-8 border-dashed border-gray-300">
              <FiPlus className="mx-auto h-10 w-10 text-gray-400 mb-2" />
              <Text className="font-medium">Belum ada asesmen dasar.</Text>
              <Text>Klik tombol "New Assessment" untuk memulai.</Text>
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
        {/* 1. Ubah ukuran DialogPanel agar memenuhi sebagian besar layar */}
        <DialogPanel className="w-full max-w-7xl h-[90vh] flex flex-col">
          {isViewLoading ? (
            <Text className="text-center p-12">Memuat detail...</Text>
          ) : (
            selectedAssessment && (
              <>
                <div className="flex justify-between items-start flex-shrink-0">
                  <div>
                    <Title>Detail Asesmen: {selectedAssessment.nama_unit_kerja}</Title>
                    <Text>{selectedAssessment.nama_perusahaan}</Text>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button icon={FiDownload} onClick={() => handleExportClick(selectedAssessment.id, selectedAssessment.nama_unit_kerja)} loading={isExportingId}>
                      Export to Excel
                    </Button>
                    <Button variant="light" icon={isViewFullscreen ? FiMinimize : FiMaximize} onClick={toggleViewFullscreen} />
                  </div>
                </div>

                {/* 2. Buat area konten bisa di-scroll dan mengisi ruang yang tersisa */}
                <div ref={viewContentRef} className="mt-6 flex-grow overflow-y-auto pr-2 view-fullscreen-content">
                  <BasicAssessmentView assessmentData={selectedAssessment} />
                </div>

                <div className="flex justify-end mt-6 flex-shrink-0">
                  <Button onClick={() => setIsViewModalOpen(false)}>Tutup</Button>
                </div>
              </>
            )
          )}
        </DialogPanel>
      </Dialog>

      <ConfirmationDialog
        isOpen={deleteConfirmation.isOpen}
        onClose={closeDeleteConfirm}
        onConfirm={handleDeleteConfirm} // Pastikan ini memanggil fungsi yang benar
        title="Konfirmasi Penghapusan"
        message={`Apakah Anda yakin ingin menghapus asesmen "${deleteConfirmation.assessmentName}"? Tindakan ini tidak dapat dibatalkan.`}
        // Tambahkan prop loading jika komponen ConfirmationDialog mendukungnya
        // isLoading={isDeleting} // Uncomment jika komponennya dimodifikasi
      />
    </>
  );
}

export default BasicAssessmentListPage;
