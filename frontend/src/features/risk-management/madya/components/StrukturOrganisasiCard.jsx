// frontend/src/features/risk-management/madya/components/StrukturOrganisasiCard.jsx
import React, { useState, useRef } from "react";
import { Card, Title, Text, Button, Badge } from "@tremor/react";
import { FiPlus, FiUpload, FiImage, FiTrash2, FiLoader, FiEye, FiEdit2 } from "react-icons/fi";
import StrukturOrganisasiTable from "./StrukturOrganisasiTable";
import StrukturOrganisasiFormModal from "./StrukturOrganisasiFormModal";
import ImageViewModal from "./ImageViewModal";
import apiClient from "../../../../api/api";

const MAX_FILE_SIZE_MB = 1;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

function StrukturOrganisasiCard({ assessmentId, initialData, initialImageUrl, onDataChange }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [entries, setEntries] = useState(initialData);
  const [imageUrl, setImageUrl] = useState(initialImageUrl); // State untuk URL gambar
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const API_BASE_URL_FOR_IMAGE = apiClient.defaults.baseURL;

  const [editingEntry, setEditingEntry] = useState(null);

  const handleSaveEntry = (savedEntry, isUpdate) => {
    if (isUpdate) {
      // Update item yang ada di state
      setEntries((prev) => prev.map((entry) => (entry.id === savedEntry.id ? savedEntry : entry)));
    } else {
      // Tambah item baru ke state
      setEntries((prev) => [...prev, savedEntry]);
    }
    setEditingEntry(null); // Reset editing state
  };

  const handleEditEntry = (entry) => {
    setEditingEntry(entry);
    setIsModalOpen(true);
  };

  // --- FUNGSI BARU: Untuk menghapus entri ---
  const handleDeleteEntry = async (entryId) => {
    if (window.confirm("Anda yakin ingin menghapus data struktur ini?")) {
      try {
        await apiClient.delete(`/structure-entries/${entryId}`);
        setEntries((prev) => prev.filter((entry) => entry.id !== entryId));
        alert("Data berhasil dihapus.");
      } catch (error) {
        alert("Gagal menghapus data: " + (error.response?.data?.msg || "Error"));
      }
    }
  };

  const handleAddEntry = (newEntry) => {
    setEntries((prev) => [...prev, newEntry]);
    // onDataChange(); // Tidak perlu refresh hanya untuk menambah data tabel
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setUploadError(`Ukuran file melebihi batas ${MAX_FILE_SIZE_MB}MB.`);
      if (fileInputRef.current) fileInputRef.current.value = ""; // Reset input
      return;
    }

    setUploadError("");
    setIsUploading(true);

    const formData = new FormData();
    formData.append("struktur_organisasi_image", file);

    try {
      const response = await apiClient.post(`/madya-assessments/${assessmentId}/structure-image`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setImageUrl(response.data.image_url); // Update URL gambar
      alert(response.data.msg);
    } catch (error) {
      setUploadError(error.response?.data?.msg || "Gagal mengupload gambar.");
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = ""; // Reset input setelah selesai
    }
  };

  // Fungsi untuk memicu klik input file tersembunyi
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Fungsi Hapus Gambar (opsional)
  const handleDeleteImage = async () => {
    if (window.confirm("Anda yakin ingin menghapus gambar struktur organisasi ini?")) {
      setIsUploading(true); // Gunakan state loading yang sama
      setUploadError("");
      try {
        await apiClient.delete(`/madya-assessments/${assessmentId}/structure-image`);
        setImageUrl(null); // Hapus URL gambar dari state
        alert("Gambar berhasil dihapus.");
      } catch (error) {
        setUploadError(error.response?.data?.msg || "Gagal menghapus gambar.");
        console.error("Delete error:", error);
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <>
      <Card>
        <div className="flex justify-between items-center mb-4">
          <div>
            <Title as="h3">1. Struktur Organisasi</Title>
            <Text>Definisikan struktur organisasi dan upload gambar (opsional).</Text>
          </div>
          <Button
            icon={FiPlus}
            onClick={() => {
              setEditingEntry(null);
              setIsModalOpen(true);
            }}
          >
            {" "}
            Tambah Data Tabel
          </Button>
        </div>

        {/* --- Bagian Upload Gambar --- */}
        <Card className="bg-slate-50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiImage className="text-slate-600" />
              <Text className="font-medium text-slate-700">Gambar Struktur Organisasi (Opsional, Max {MAX_FILE_SIZE_MB}MB)</Text>
              {isUploading && <FiLoader className="animate-spin text-blue-500" />}
            </div>
            <div>
              {imageUrl && (
                <>
                  {/* --- PERUBAHAN: Tombol Lihat --- */}
                  <Button
                    icon={FiEye}
                    variant="secondary"
                    onClick={() => setIsImageModalOpen(true)} // <-- Buka modal
                    size="xs"
                  >
                    Lihat
                  </Button>
                  <Button icon={FiTrash2} variant="light" color="red" onClick={handleDeleteImage} size="xs" disabled={isUploading}>
                    Hapus
                  </Button>
                </>
              )}
              <Button icon={FiUpload} onClick={triggerFileInput} disabled={isUploading} size="xs">
                {imageUrl ? "Ganti Gambar" : "Upload Gambar"}
              </Button>
            </div>
          </div>
          {/* Input file tersembunyi */}
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          {uploadError && <Text className="text-red-500 mt-2 text-sm">{uploadError}</Text>}
        </Card>

        {/* Tabel Data */}
        <div className="mt-4">
          <StrukturOrganisasiTable data={entries} onEdit={handleEditEntry} onDelete={handleDeleteEntry} />
        </div>
      </Card>

      <StrukturOrganisasiFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEntry(null);
        }} // Reset editing state saat tutup
        assessmentId={assessmentId}
        onSaveSuccess={handleSaveEntry}
        initialData={editingEntry} // Kirim data yang mau diedit
      />
      <ImageViewModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        // Langsung gabungkan baseURL API dengan path relatif dari backend
        imageUrl={imageUrl ? `${API_BASE_URL_FOR_IMAGE.replace("/api", "")}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}` : null}
        // imageUrl={imageUrl ? `${API_BASE_URL_FOR_IMAGE}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}` : null}
      />
    </>
  );
}

export default StrukturOrganisasiCard;
