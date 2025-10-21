// frontend/src/features/risk-management/madya/MadyaAssessmentListPage.jsx
import React, { useState, useEffect } from "react"; // Tambahkan useState, useEffect
import { Title, Text, Button, Dialog, DialogPanel, Grid, Card, Badge } from "@tremor/react"; // Tambahkan Dialog, DialogPanel, Grid, Card, Badge
import { FiPlus, FiEye, FiCheckCircle, FiLoader, FiShield, FiX } from "react-icons/fi"; // Tambahkan ikon baru
import { useNavigate, Link } from "react-router-dom";
import apiClient from "../../../api/api"; // Import apiClient
import TemplateViewModal from "../templates/components/TemplateViewModal"; // Import modal preview

// Komponen Modal Pemilihan Template (Inline)
function SelectTemplateModal({ isOpen, onClose, onSelect }) {
  const [templates, setTemplates] = useState([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isCreating, setIsCreating] = useState(false); // Loading saat POST asesmen

  // State untuk modal preview (di dalam modal select)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingTemplate, setViewingTemplate] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const navigate = useNavigate(); // Untuk navigasi dari tombol Buat Template

  useEffect(() => {
    if (isOpen) {
      setIsLoadingList(true);
      setTemplates([]);
      apiClient
        .get("/risk-maps")
        .then((response) => setTemplates(response.data))
        .catch((error) => console.error("Gagal memuat template di modal:", error))
        .finally(() => setIsLoadingList(false));
    }
  }, [isOpen]);

  const handleSelect = async (templateId) => {
    setIsCreating(true);
    // Panggil onSelect dan tunggu selesai sebelum potensial mematikan loading
    try {
      await onSelect(templateId);
      // Loading akan dimatikan oleh parent jika sukses navigasi atau error
    } catch (error) {
      // Error sudah dihandle di parent, cukup matikan loading di sini jika perlu
      console.error("Error during selection propagation:", error);
      setIsCreating(false); // Matikan loading jika ada error di onSelect
    }
    // Jangan matikan loading di sini jika onSelect melakukan navigasi
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

  return (
    <>
      <Dialog open={isOpen} onClose={() => !isCreating && onClose()} static={true}>
        {" "}
        {/* Jangan tutup jika sedang creating */}
        <DialogPanel className="max-w-5xl">
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
                      <Button icon={FiCheckCircle} size="xs" onClick={() => handleSelect(template.id)} loading={isCreating} disabled={isCreating}>
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

  useEffect(() => {
    const fetchAssessments = async () => {
      setIsLoadingList(true); // Set loading ON
      setAssessments([]); // Kosongkan dulu
      try {
        // Panggil endpoint GET untuk list asesmen madya
        // Pastikan endpoint '/madya-assessments' (GET) sudah ada di backend
        const response = await apiClient.get("/madya-assessments");
        // Pastikan backend mengembalikan array
        if (Array.isArray(response.data)) {
          setAssessments(response.data); // Simpan data ke state
        } else {
          console.error("API /madya-assessments tidak mengembalikan array:", response.data);
          setAssessments([]); // Set array kosong jika data tidak valid
        }
      } catch (error) {
        console.error("Gagal memuat daftar asesmen madya:", error);
        setAssessments([]); // Set array kosong jika fetch gagal
        // Opsional: Tampilkan pesan error ke user
        // alert("Gagal memuat daftar asesmen. Coba refresh halaman.");
      } finally {
        setIsLoadingList(false); // Set loading OFF
      }
    };

    fetchAssessments(); // Panggil fungsi fetch saat komponen dimuat
  }, []);

  // Handler untuk membuka modal
  const handleOpenSelectTemplateModal = () => {
    setIsSelectTemplateModalOpen(true);
  };

  // Handler yang dipanggil oleh modal saat template dipilih
  const handleTemplateSelected = async (templateId) => {
    setIsCreatingAssessment(true); // Aktifkan loading global
    try {
      const response = await apiClient.post("/madya-assessments", {
        risk_map_template_id: templateId,
      });
      const newAssessmentId = response.data.id;
      setIsSelectTemplateModalOpen(false); // Tutup modal pemilihan
      navigate(`/risk-management/madya/form/${newAssessmentId}`); // Navigasi ke form
      // Tidak perlu matikan loading karena sudah pindah halaman
    } catch (error) {
      console.error("Gagal memulai asesmen madya baru:", error);
      alert("Gagal memulai asesmen baru: " + (error.response?.data?.message || "Silakan coba lagi."));
      setIsCreatingAssessment(false); // Matikan loading jika gagal
      // Pertimbangkan apakah modal harus tetap terbuka atau ditutup jika gagal
      // setIsSelectTemplateModalOpen(false);
    }
  };

  return (
    <>
      {" "}
      {/* Gunakan Fragment */}
      <div className="p-6 sm:p-10">
        <div className="flex justify-between items-center">
          <div>
            <Title>Asesmen Madya</Title>
            <Text>Daftar asesmen risiko tingkat madya.</Text>
          </div>
          {/* Tombol memanggil handler modal */}
          <Button icon={FiPlus} onClick={handleOpenSelectTemplateModal} loading={isCreatingAssessment}>
            Asesmen Baru
          </Button>
        </div>
        <div className="mt-6">
          {isLoadingList ? (
            <div className="flex justify-center items-center p-10">
              <FiLoader className="animate-spin h-6 w-6 mr-3 text-tremor-content-emphasis" />
              <Text>Memuat daftar asesmen...</Text>
            </div>
          ) : assessments.length > 0 ? (
            <div className="space-y-4">
              {assessments.map((assessment) => (
                <Card key={assessment.id} className="p-4 hover:shadow-lg transition-shadow duration-200">
                  {/* Buat item bisa diklik untuk navigasi */}
                  <Link to={`/risk-management/madya/form/${assessment.id}`} className="block group">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-tremor-content-strong group-hover:text-blue-600">Asesmen #{assessment.id}</p>
                        <Text className="text-sm text-tremor-content mt-1">Dibuat pada: {assessment.created_at ? new Date(assessment.created_at).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" }) : "-"}</Text>
                      </div>
                      <span className="text-sm font-medium text-blue-600 border border-blue-600 px-3 py-1 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">Buka / Edit</span>
                    </div>
                  </Link>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center p-8 border-dashed border-gray-300">
              <FiPlus className="mx-auto h-10 w-10 text-gray-400 mb-2" />
              <Text className="font-medium">Belum ada asesmen madya.</Text>
              <Text>Klik tombol "Asesmen Baru" untuk memulai.</Text>
            </Card>
          )}
        </div>
        {/* --- Akhir Highlight --- */}
      </div>
      {/* Render Modal Pemilihan Template */}
      <SelectTemplateModal isOpen={isSelectTemplateModalOpen} onClose={() => setIsSelectTemplateModalOpen(false)} onSelect={handleTemplateSelected} />
    </>
  );
}

export default MadyaAssessmentListPage;
