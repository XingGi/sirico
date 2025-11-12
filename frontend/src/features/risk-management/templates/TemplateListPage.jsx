// frontend/src/features/risk-management/templates/TemplateListPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Title, Text, Button, Badge, Grid } from "@tremor/react";
import { FiPlus, FiShield, FiEdit, FiTrash2, FiEye } from "react-icons/fi";
import apiClient from "../../../api/api";
import TemplateViewModal from "./components/TemplateViewModal";
import ConfirmationDialog from "../../../components/common/ConfirmationDialog";
import NotificationModal from "../../../components/common/NotificationModal";
import { useAuth } from "../../../context/AuthContext";

function TemplateListPage() {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();
  // State untuk mengontrol modal
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingTemplate, setViewingTemplate] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(null);
  const [userLimits, setUserLimits] = useState(null);
  const [limitModal, setLimitModal] = useState({ isOpen: false, message: "" });

  const fetchTemplates = () => {
    setIsLoading(true);
    apiClient
      .get("/risk-maps")
      .then((response) => {
        setTemplates(response.data);
      })
      .catch((error) => console.error("Gagal memuat template:", error))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchTemplates();

    // Ambil data limit saat komponen dimuat
    apiClient
      .get("/account/details")
      .then((response) => {
        setUserLimits(response.data.assessment_limits);
      })
      .catch((err) => {
        console.error("Gagal memuat limit user:", err);
      });
  }, []);

  const handleViewClick = (templateId) => {
    setIsDetailLoading(true);
    setIsViewModalOpen(true);
    apiClient
      .get(`/risk-maps/${templateId}`)
      .then((response) => {
        setViewingTemplate(response.data);
      })
      .catch((error) => {
        console.error("Gagal memuat detail template:", error);
        setIsViewModalOpen(false); // Tutup modal jika gagal
      })
      .finally(() => {
        setIsDetailLoading(false);
      });
  };

  const handleDeleteTemplate = async (templateId, templateName) => {
    // Tampilkan konfirmasi
    if (window.confirm(`Apakah Anda yakin ingin menghapus template "${templateName}"? Template ini tidak bisa dikembalikan.`)) {
      setIsDeleting(templateId); // Set ID template yang sedang dihapus untuk loading
      try {
        // Panggil API DELETE
        await apiClient.delete(`/risk-maps/${templateId}`);
        alert(`Template "${templateName}" berhasil dihapus.`);
        // Hapus template dari state lokal agar UI update
        setTemplates((prevTemplates) => prevTemplates.filter((t) => t.id !== templateId));
        // Alternatif: panggil fetchTemplates() lagi untuk data terbaru dari server
        // fetchTemplates();
      } catch (error) {
        console.error(`Gagal menghapus template ${templateId}:`, error);
        alert(`Gagal menghapus template: ${error.response?.data?.msg || "Terjadi kesalahan."}`);
      } finally {
        setIsDeleting(null); // Reset state loading hapus
      }
    }
  };

  const handleNewTemplateClick = () => {
    if (user && user.role === "Admin") {
      navigate("/risk-management/templates/new");
      return;
    }

    if (!userLimits) {
      toast.info("Sedang memuat data limit, silakan coba lagi sesaat.");
      return;
    }

    const currentCount = templates.filter((t) => !t.is_default).length;
    const limit = userLimits.template_peta?.limit;

    if (limit !== null && currentCount >= limit) {
      setLimitModal({
        isOpen: true,
        message: `Batas pembuatan Template Peta Risiko kustom Anda telah tercapai (${currentCount}/${limit}). Hubungi admin untuk menambah kuota.`,
      });
    } else {
      navigate("/risk-management/templates/new");
    }
  };

  return (
    <>
      <div className="p-6 sm:p-10">
        <div className="flex justify-between items-center">
          <div>
            <Title>Template Peta Risiko</Title>
            <Text>Kelola template matriks risiko untuk digunakan dalam asesmen.</Text>
          </div>
          <Button icon={FiPlus} onClick={handleNewTemplateClick} disabled={isLoading || !userLimits}>
            Buat Template Baru
          </Button>
        </div>

        <div className="mt-6">
          {isLoading ? (
            <Text>Memuat template...</Text>
          ) : (
            <Grid numItemsSm={2} numItemsLg={3} className="gap-6">
              {templates.map((template) => (
                <Card key={template.id} className="flex flex-col">
                  <div className="flex-grow">
                    <div className="flex items-center gap-3">
                      {template.is_default && <FiShield className="h-6 w-6 text-blue-500" />}
                      <Title as="h3">{template.name}</Title>
                    </div>
                    {template.is_default && (
                      <Badge color="blue" className="mt-1">
                        Default Sistem
                      </Badge>
                    )}
                    <Text className="mt-2 h-16">{template.description || "Tidak ada deskripsi."}</Text>
                  </div>
                  <div className="mt-4 pt-4 border-t flex justify-end gap-2">
                    {/* --- PERUBAHAN: onClick handler diperbarui --- */}
                    <Button icon={FiEye} variant="secondary" onClick={() => handleViewClick(template.id)}>
                      Lihat
                    </Button>
                    <Button icon={FiEdit} variant="light" disabled={template.is_default} onClick={() => navigate(`/risk-management/templates/edit/${template.id}`)}>
                      Edit
                    </Button>
                    <Button icon={FiTrash2} variant="light" color="red" disabled={template.is_default || isDeleting === template.id} loading={isDeleting === template.id} onClick={() => handleDeleteTemplate(template.id, template.name)}>
                      Hapus
                    </Button>
                  </div>
                </Card>
              ))}
            </Grid>
          )}
        </div>
      </div>

      {/* --- PERUBAHAN: Render komponen modal di sini --- */}
      <TemplateViewModal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} templateData={isDetailLoading ? null : viewingTemplate} />
      <NotificationModal isOpen={limitModal.isOpen} onClose={() => setLimitModal({ isOpen: false, message: "" })} title="Batas Kuota Tercapai" message={limitModal.message} />
    </>
  );
}

export default TemplateListPage;
