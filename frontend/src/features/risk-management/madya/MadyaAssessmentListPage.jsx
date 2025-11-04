// frontend/src/features/risk-management/madya/MadyaAssessmentListPage.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Title, Text, Button, Dialog, DialogPanel, Grid, Card, Badge, TextInput } from "@tremor/react";
import { FiPlus, FiEye, FiCheckCircle, FiLoader, FiShield, FiX, FiGrid, FiList, FiTrash2, FiAlertTriangle, FiEdit2, FiDownload, FiMaximize, FiMinimize } from "react-icons/fi";
import { useNavigate, Link } from "react-router-dom";
import { debounce } from "lodash";
import apiClient from "../../../api/api";
import TemplateViewModal from "../templates/components/TemplateViewModal";
import MadyaAssessmentView from "./components/MadyaAssessmentView";
import NotificationModal from "../../../components/common/NotificationModal";

const ConfirmationDialog = ({ isOpen, onClose, onConfirm, title, message, isLoading = false }) => (
  <Dialog open={isOpen} onClose={onClose} static={true}>
    <DialogPanel>
      <div className="text-center">
        <FiAlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <Title>{title}</Title>
        <Text className="mt-2">{message}</Text>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={isLoading}>
          Batal
        </Button>
        <Button color="red" onClick={onConfirm} loading={isLoading} disabled={isLoading}>
          Hapus
        </Button>
      </div>
    </DialogPanel>
  </Dialog>
);

// Komponen Modal Pemilihan Template (Inline)
function SelectTemplateModal({ isOpen, onClose, onSelect }) {
  const [templates, setTemplates] = useState([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [assessmentName, setAssessmentName] = useState("");

  // State untuk modal preview (di dalam modal select)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingTemplate, setViewingTemplate] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setIsLoadingList(true);
      setTemplates([]);
      setAssessmentName("");
      apiClient
        .get("/risk-maps")
        .then((response) => setTemplates(response.data))
        .catch((error) => console.error("Gagal memuat template di modal:", error))
        .finally(() => setIsLoadingList(false));
    }
  }, [isOpen]);

  const handleSelect = async (templateId) => {
    if (!assessmentName.trim()) {
      alert("Nama asesmen tidak boleh kosong.");
      return;
    }
    setIsCreating(true);
    try {
      await onSelect(templateId, assessmentName);
    } catch (error) {
      console.error("Error during selection propagation:", error);
      setIsCreating(false); // Matikan loading jika ada error di onSelect
    }
  };

  const handleTemplatePreviewClick = (templateId) => {
    setIsDetailLoading(true);
    setIsViewModalOpen(true); // Buka modal preview
    setViewingTemplate(null); // Reset data lama
    // --- PERBAIKAN: Gunakan URL tanpa /api ---
    apiClient
      .get(`/risk-maps/${templateId}`) // Hapus /api
      .then((response) => {
        setViewingTemplate(response.data);
      })
      .catch((error) => {
        console.error("Gagal memuat detail template untuk preview:", error);
        alert("Gagal memuat detail template.");
        setIsViewModalOpen(false); // Tutup jika gagal
      })
      .finally(() => {
        setIsDetailLoading(false);
      });
    // --- AKHIR PERBAIKAN ---
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsViewFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const canProceed = assessmentName.trim() !== "" && !isCreating;

  return (
    <>
      <Dialog open={isOpen} onClose={() => !isCreating && onClose()} static={true}>
        <DialogPanel className="max-w-5xl">
          <div className="flex justify-between items-center">
            <Title>Mulai Asesmen Madya Baru</Title> {/* Judul diubah */}
            <Button icon={FiX} variant="light" onClick={onClose} disabled={isCreating} />
          </div>
          <Text className="mt-2">Beri nama asesmen dan pilih template peta risiko yang akan digunakan.</Text>

          <div className="mt-6">
            <label htmlFor="assessmentNameInput" className="text-sm font-medium text-gray-700">
              Nama Asesmen *
            </label>
            <TextInput id="assessmentNameInput" value={assessmentName} onChange={(e) => setAssessmentName(e.target.value)} placeholder="Contoh: Asesmen Risiko IT Kuartal 4 2025" required className="mt-1" disabled={isCreating} />
          </div>

          <div className="flex justify-between items-center">
            <Title>Pilih Template Peta Risiko</Title>
            <Button icon={FiX} variant="light" onClick={onClose} disabled={isCreating} />
          </div>
          <Text className="mt-2">Pilih template yang akan digunakan untuk asesmen madya baru.</Text>

          <div className="mt-6 max-h-[60vh] overflow-y-auto pr-2">
            {isLoadingList ? (
              <Text className="flex items-center justify-center gap-2 p-10">
                <FiLoader className="animate-spin h-5 w-5" /> Memuat template...
              </Text>
            ) : templates.length === 0 ? (
              <Card className="text-center p-6">
                <Text>Tidak ada template peta risiko yang tersedia.</Text>
                <Button onClick={() => navigate("/risk-management/templates/new")} className="mt-4">
                  Buat Template Baru
                </Button>
              </Card>
            ) : (
              <Grid numItemsSm={1} numItemsMd={2} className="gap-4 m-10">
                {" "}
                {/* Coba 2 kolom */}
                {templates.map((template) => (
                  <Card key={template.id} className="flex flex-col">
                    <div className="flex-grow">
                      <div className="flex items-center gap-3">
                        {template.is_default && <FiShield className="h-5 w-5 text-blue-500" />}
                        <Title as="h4" className="text-lg">
                          {template.name}
                        </Title>
                      </div>
                      {template.is_default && (
                        <Badge color="blue" size="xs" className="mt-1">
                          Default Sistem
                        </Badge>
                      )}
                      <Text className="mt-2 text-sm h-12 overflow-hidden text-ellipsis">
                        {" "}
                        {/* Batasi tinggi deskripsi */}
                        {template.description || "Tidak ada deskripsi."}
                      </Text>
                    </div>
                    <div className="mt-4 pt-4 border-t flex justify-end gap-2">
                      <Button icon={FiEye} variant="secondary" size="xs" onClick={() => handleTemplatePreviewClick(template.id)} disabled={isCreating}>
                        Preview
                      </Button>
                      <Button icon={FiCheckCircle} size="xs" onClick={() => handleSelect(template.id)} loading={isCreating} disabled={!canProceed}>
                        Gunakan
                      </Button>
                    </div>
                  </Card>
                ))}
              </Grid>
            )}
          </div>
          <div className="mt-6 flex justify-end">
            <Button variant="secondary" onClick={onClose} disabled={isCreating}>
              Batal
            </Button>
          </div>
        </DialogPanel>
      </Dialog>

      {/* Modal Preview Template (Nested) */}
      <TemplateViewModal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} templateData={isDetailLoading ? null : viewingTemplate} />
    </>
  );
}
// --- Akhir Komponen Modal ---

function MadyaAssessmentListPage() {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState([]); // State untuk menyimpan daftar asesmen
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [userLimits, setUserLimits] = useState(null);
  const [limitModal, setLimitModal] = useState({ isOpen: false, message: "" });
  const [isSelectTemplateModalOpen, setIsSelectTemplateModalOpen] = useState(false);
  const [isCreatingAssessment, setIsCreatingAssessment] = useState(false); // Loading global
  const [viewMode, setViewMode] = useState("list");
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    assessmentId: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingAssessmentData, setViewingAssessmentData] = useState(null);
  const [viewingTemplateData, setViewingTemplateData] = useState(null);
  const [viewingRiskInputs, setViewingRiskInputs] = useState([]);
  const [isViewLoading, setIsViewLoading] = useState(false);
  const [isExportingId, setIsExportingId] = useState(null);
  const [isViewFullscreen, setIsViewFullscreen] = useState(false);
  const viewContentRef = useRef(null);

  const fetchAssessments = async () => {
    setIsLoadingList(true);
    setAssessments([]);
    try {
      const response = await apiClient.get("/madya-assessments");
      if (Array.isArray(response.data)) {
        setAssessments(response.data);
      } else {
        console.error("API /madya-assessments tidak mengembalikan array:", response.data);
        setAssessments([]);
      }
    } catch (error) {
      console.error("Gagal memuat daftar asesmen madya:", error);
      setAssessments([]);
    } finally {
      setIsLoadingList(false);
    }
  };

  const handleViewClick = async (assessmentId) => {
    setIsViewLoading(true);
    setIsViewModalOpen(true);
    setViewingAssessmentData(null); // Reset data lama
    setViewingTemplateData(null);
    setViewingRiskInputs([]);
    try {
      // Fetch data asesmen, template, dan risk input secara paralel
      const [assessmentRes, riskInputRes] = await Promise.all([apiClient.get(`/madya-assessments/${assessmentId}`), apiClient.get(`/madya-assessments/${assessmentId}/risk-inputs`)]);
      setViewingAssessmentData(assessmentRes.data);
      setViewingRiskInputs(riskInputRes.data || []);

      // Fetch detail template jika ID-nya ada
      const templateId = assessmentRes.data.risk_map_template_id;
      if (templateId) {
        try {
          const templateRes = await apiClient.get(`/risk-maps/${templateId}`);
          setViewingTemplateData(templateRes.data);
        } catch (templateError) {
          console.error("Gagal memuat detail template untuk view:", templateError);
          setViewingTemplateData(null); // Tetap null jika gagal
        }
      }
    } catch (error) {
      console.error("Gagal memuat detail asesmen untuk view:", error);
      alert("Gagal memuat detail asesmen.");
      setIsViewModalOpen(false); // Tutup modal jika fetch gagal
    } finally {
      setIsViewLoading(false);
    }
  };

  const handleExportClick = async (assessmentId, assessmentName) => {
    setIsExportingId(assessmentId);
    try {
      const response = await apiClient.get(`/madya-assessments/${assessmentId}/export`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Asesmen_Madya_${assessmentName || assessmentId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Gagal mengekspor file:", error);
      alert("Gagal mengekspor file Excel.");
    } finally {
      setIsExportingId(null);
    }
  };

  // Fungsi Fullscreen untuk Modal View
  const toggleViewFullscreen = () => {
    if (!document.fullscreenElement) {
      viewContentRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsViewFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    fetchAssessments();
    setIsLoadingList(true); // Pastikan loading total aktif
    apiClient
      .get("/account/details")
      .then((response) => {
        setUserLimits(response.data.assessment_limits);
      })
      .catch((err) => {
        console.error("Gagal memuat limit user:", err);
      })
      .finally(() => {
        // (loading di-false-kan oleh fetchAssessments, jadi tidak perlu di sini)
      });
  }, []);

  // Handler untuk membuka modal
  const handleOpenSelectTemplateModal = () => {
    if (userLimits) {
      const currentCount = assessments.length;
      const limit = userLimits.madya?.limit;

      if (limit !== null && currentCount >= limit) {
        setLimitModal({
          isOpen: true,
          message: `Batas pembuatan Asesmen Madya Anda telah tercapai (${currentCount}/${limit}). Hubungi admin untuk menambah kuota.`,
        });
        return;
      }
    } else if (isLoadingList) {
      alert("Sedang memuat data limit, silakan coba lagi sesaat.");
      return;
    }

    // Jika lolos, baru buka modal
    setIsSelectTemplateModalOpen(true);
  };

  // Handler yang dipanggil oleh modal saat template dipilih
  const handleTemplateSelected = async (templateId, name) => {
    setIsCreatingAssessment(true); // Aktifkan loading global
    try {
      const payload = {
        risk_map_template_id: templateId,
        nama_asesmen: name,
      };
      const response = await apiClient.post("/madya-assessments", payload);
      const newAssessmentId = response.data.id;
      setIsSelectTemplateModalOpen(false); // Tutup modal pemilihan
      navigate(`/risk-management/madya/form/${newAssessmentId}`); // Navigasi ke form
      // Tidak perlu matikan loading karena sudah pindah halaman
    } catch (error) {
      console.error("Gagal memulai asesmen madya baru:", error);
      alert("Gagal memulai asesmen baru: " + (error.response?.data?.message || "Silakan coba lagi."));
      setIsCreatingAssessment(false);
    }
  };

  const openDeleteConfirm = (assessmentId) => {
    setDeleteConfirmation({ isOpen: true, assessmentId: assessmentId });
  };

  const closeDeleteConfirm = () => {
    setDeleteConfirmation({ isOpen: false, assessmentId: null });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmation.assessmentId) return;
    setIsDeleting(true);
    try {
      // Panggil endpoint DELETE baru di backend
      await apiClient.delete(`/madya-assessments/${deleteConfirmation.assessmentId}`);
      alert(`Asesmen #${deleteConfirmation.assessmentId} berhasil dihapus.`);
      closeDeleteConfirm();
      fetchAssessments(); // Muat ulang daftar
    } catch (error) {
      console.error("Gagal menghapus asesmen madya:", error);
      alert("Gagal menghapus asesmen: " + (error.response?.data?.msg || "Terjadi kesalahan."));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="p-6 sm:p-10">
        <div className="flex justify-between items-center">
          <div>
            <Title>Asesmen Madya</Title>
            <Text>Daftar asesmen risiko tingkat madya.</Text>
          </div>
          <div className="flex items-center gap-2">
            <Button
              icon={viewMode === "list" ? FiGrid : FiList} // Tampilkan ikon sesuai mode
              variant="light"
              onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")} // Toggle state
              aria-label={viewMode === "list" ? "Switch to grid view" : "Switch to list view"}
            />
            <Button icon={FiPlus} onClick={handleOpenSelectTemplateModal} loading={isCreatingAssessment} disabled={isLoadingList || !userLimits}>
              Asesmen Baru
            </Button>
          </div>
        </div>

        <div className={`mt-6 ${viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}`}>
          {isLoadingList ? (
            <div className={`${viewMode === "grid" ? "col-span-full" : ""} flex justify-center items-center p-10`}>
              <FiLoader className="animate-spin h-6 w-6 mr-3 text-tremor-content-emphasis" />
              <Text>Memuat daftar asesmen...</Text>
            </div>
          ) : assessments.length > 0 ? (
            assessments.map((assessment) => (
              <Card key={assessment.id} className="p-4 hover:shadow-lg transition-shadow duration-200">
                {" "}
                {/* Hapus flex flex-col & p-0 */}
                <div className="flex justify-between items-start">
                  {" "}
                  {/* Container utama: Info kiri, Aksi kanan */}
                  {/* Bagian Info (Kiri) */}
                  <div className="flex-grow group mr-4">
                    {" "}
                    {/* Beri margin kanan */}
                    <Link to={`/risk-management/madya/form/${assessment.id}`} className="block mb-1 group">
                      <p className="font-bold text-tremor-content-strong group-hover:text-blue-600">{assessment.nama_asesmen || `Asesmen #${assessment.id}`}</p>
                    </Link>
                    <Text className="text-xs text-tremor-content mt-1">Dibuat: {new Date(assessment.created_at).toLocaleDateString("id-ID")}</Text>
                  </div>
                  {/* Bagian Aksi (Kanan) */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    {" "}
                    {/* Susun tombol vertikal */}
                    {/* Grup Tombol Atas: View, Edit, Delete */}
                    <div className="flex items-center gap-1">
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
                          navigate(`/risk-management/madya/form/${assessment.id}`);
                        }}
                        aria-label="Edit" // Tambah aria-label
                      />
                      <Button
                        variant="light"
                        size="xs"
                        icon={FiTrash2}
                        color="red"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeleteConfirm(assessment.id, assessment.nama_asesmen);
                        }}
                        loading={isDeleting && deleteConfirmation.assessmentId === assessment.id}
                        disabled={isDeleting}
                        aria-label="Delete" // Tambah aria-label
                      />
                    </div>
                    {/* Tombol Export di Bawah */}
                    <Button
                      size="xs"
                      variant="light" // Ubah jadi light agar mirip Asesmen Dasar
                      icon={FiDownload}
                      loading={isExportingId === assessment.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExportClick(assessment.id, assessment.nama_asesmen);
                      }} // Tambah stopPropagation
                    >
                      Export
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className={`${viewMode === "grid" ? "col-span-full" : ""} text-center p-8 border-dashed border-gray-300`}>
              <FiPlus className="mx-auto h-10 w-10 text-gray-400 mb-2" />
              <Text className="font-medium">Belum ada asesmen madya.</Text>
              <Text>Klik tombol "Asesmen Baru" untuk memulai.</Text>
            </Card>
          )}
        </div>
      </div>
      <SelectTemplateModal isOpen={isSelectTemplateModalOpen} onClose={() => setIsSelectTemplateModalOpen(false)} onSelect={handleTemplateSelected} />
      <ConfirmationDialog
        isOpen={deleteConfirmation.isOpen}
        onClose={closeDeleteConfirm}
        onConfirm={handleDeleteConfirm}
        title="Konfirmasi Penghapusan"
        message={`Apakah Anda yakin ingin menghapus Asesmen Madya #${deleteConfirmation.assessmentId}? Semua data terkait (struktur, sasaran, risk input) akan ikut terhapus.`}
        isLoading={isDeleting} // Pass loading state
      />
      <Dialog open={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} static={true}>
        <DialogPanel className="w-full max-w-7xl h-[90vh] flex flex-col">
          {isViewLoading ? (
            <div className="flex justify-center items-center h-full">
              <FiLoader className="animate-spin h-8 w-8 text-tremor-brand" />
            </div>
          ) : (
            viewingAssessmentData && (
              <>
                <div className="flex justify-between items-start flex-shrink-0 border-b pb-3 mb-3">
                  <div>
                    <Title>Detail: {viewingAssessmentData.nama_asesmen}</Title>
                    <Text>ID: #{viewingAssessmentData.id}</Text>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button icon={FiDownload} onClick={() => handleExportClick(viewingAssessmentData.id, viewingAssessmentData.nama_asesmen)} loading={isExportingId === viewingAssessmentData.id} size="sm">
                      Export
                    </Button>
                    <Button variant="light" icon={isViewFullscreen ? FiMinimize : FiMaximize} onClick={toggleViewFullscreen} size="sm" />
                  </div>
                </div>

                <div ref={viewContentRef} className="flex-grow overflow-y-auto pr-2 view-fullscreen-content">
                  {" "}
                  {/* Konten Scrollable */}
                  <MadyaAssessmentView assessmentData={viewingAssessmentData} templateData={viewingTemplateData} riskInputEntries={viewingRiskInputs} />
                </div>

                <div className="flex justify-end mt-4 flex-shrink-0 border-t pt-3">
                  <Button onClick={() => setIsViewModalOpen(false)}>Tutup</Button>
                </div>
              </>
            )
          )}
        </DialogPanel>
      </Dialog>
      <NotificationModal isOpen={limitModal.isOpen} onClose={() => setLimitModal({ isOpen: false, message: "" })} title="Batas Kuota Tercapai" message={limitModal.message} />
    </>
  );
}

export default MadyaAssessmentListPage;
