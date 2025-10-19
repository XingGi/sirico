// frontend/src/features/risk-management/templates/TemplateListPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Title, Text, Button, Badge, Grid } from "@tremor/react";
import { FiPlus, FiShield, FiEdit, FiTrash2, FiEye } from "react-icons/fi";
import apiClient from "../../../api/api";
import TemplateViewModal from "./components/TemplateViewModal";

function TemplateListPage() {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  // State untuk mengontrol modal
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingTemplate, setViewingTemplate] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    apiClient
      .get("/risk-maps")
      .then((response) => {
        setTemplates(response.data);
      })
      .catch((error) => console.error("Gagal memuat template:", error))
      .finally(() => setIsLoading(false));
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

  return (
    <>
      <div className="p-6 sm:p-10">
        <div className="flex justify-between items-center">
          <div>
            <Title>Template Peta Risiko</Title>
            <Text>Kelola template matriks risiko untuk digunakan dalam asesmen.</Text>
          </div>
          <Button icon={FiPlus} onClick={() => navigate("/risk-management/templates/new")}>
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
                    <Button icon={FiTrash2} variant="light" color="red" disabled={template.is_default}>
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
    </>
  );
}

export default TemplateListPage;
