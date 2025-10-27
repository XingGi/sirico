// frontend/src/features/risk-management/madya/MadyaAssessmentListPage.jsx
import React, { useState, useEffect } from "react";
import { Title, Text, Button, Dialog, DialogPanel, Grid, Card, Badge, TextInput } from "@tremor/react";
import { FiPlus, FiEye, FiCheckCircle, FiLoader, FiShield, FiX, FiGrid, FiList, FiTrash2, FiAlertTriangle } from "react-icons/fi";
import { useNavigate, Link } from "react-router-dom";
import apiClient from "../../../api/api";
import TemplateViewModal from "../templates/components/TemplateViewModal";

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

  // Fungsi untuk membuka modal preview
  const handleViewClick = (templateId) => {
    setIsDetailLoading(true);
    setIsViewModalOpen(true);
    apiClient
      .get(`/risk-maps/${templateId}`)
      .then((response) => setViewingTemplate(response.data))
      .catch((error) => {
        console.error("Gagal memuat detail template:", error);
        setIsViewModalOpen(false); // Tutup jika gagal
      })
      .finally(() => setIsDetailLoading(false));
  };

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
                      <Button icon={FiEye} variant="secondary" size="xs" onClick={() => handleViewClick(template.id)} disabled={isCreating}>
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
  // State untuk kontrol modal pemilihan template
  const [isSelectTemplateModalOpen, setIsSelectTemplateModalOpen] = useState(false);
  const [isCreatingAssessment, setIsCreatingAssessment] = useState(false); // Loading global
  const [viewMode, setViewMode] = useState("list");
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    assessmentId: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);

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

  useEffect(() => {
    fetchAssessments(); // Panggil fetch saat komponen dimuat
  }, []);

  // Handler untuk membuka modal
  const handleOpenSelectTemplateModal = () => {
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
            <Button icon={FiPlus} onClick={handleOpenSelectTemplateModal} loading={isCreatingAssessment}>
              Asesmen Baru
            </Button>
          </div>
        </div>

        <div className={`mt-6 ${viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}`}>
          {isLoadingList ? (
            // --- KONDISI LOADING ---
            // Jika grid, buat span full width
            <div className={`${viewMode === "grid" ? "col-span-full" : ""} flex justify-center items-center p-10`}>
              <FiLoader className="animate-spin h-6 w-6 mr-3 text-tremor-content-emphasis" />
              <Text>Memuat daftar asesmen...</Text>
            </div>
          ) : assessments.length > 0 ? (
            // --- JIKA ADA DATA ---
            assessments.map((assessment) => (
              <Card key={assessment.id} className="p-4 hover:shadow-lg transition-shadow duration-200 flex flex-col justify-between">
                {" "}
                {/* Tambah flex flex-col justify-between */}
                {/* Bagian Info (Link) */}
                <Link to={`/risk-management/madya/form/${assessment.id}`} className="block group mb-3">
                  {" "}
                  {/* Beri margin bawah */}
                  <div className="flex justify-between items-start">
                    {" "}
                    {/* items-start agar tombol tidak stretch */}
                    <div>
                      <p className="font-semibold text-tremor-content-strong group-hover:text-blue-600">{assessment.nama_asesmen || `Asesmen #${assessment.id}`}</p>
                      <Text className="text-sm text-tremor-content mt-1">Dibuat pada: {assessment.created_at ? new Date(assessment.created_at).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" }) : "-"}</Text>
                      {/* Tambahkan info lain jika perlu */}
                    </div>
                    {/* Tombol Buka/Edit (dihapus dari sini, dipindah ke bawah) */}
                  </div>
                </Link>
                {/* Bagian Tombol Aksi */}
                <div className="border-t pt-2 flex justify-end gap-2">
                  {" "}
                  {/* Border top dan padding */}
                  <Button
                    size="xs"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation(); // Mencegah Link ter-trigger
                      navigate(`/risk-management/madya/form/${assessment.id}`);
                    }}
                  >
                    Buka / Edit
                  </Button>
                  <Button
                    icon={FiTrash2}
                    size="xs"
                    variant="light"
                    color="red"
                    onClick={(e) => {
                      e.stopPropagation(); // Mencegah Link ter-trigger
                      openDeleteConfirm(assessment.id);
                    }}
                  />
                </div>
              </Card>
            ))
          ) : (
            // --- JIKA TIDAK ADA DATA ---
            // Jika grid, buat span full width
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
    </>
  );
}

export default MadyaAssessmentListPage;
