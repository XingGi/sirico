// frontend/src/features/risk-management/madya/components/StrukturOrganisasiFormModal.jsx
import React, { useState, useEffect } from "react";
import { Dialog, DialogPanel, Title, Text, Button, TextInput, Textarea } from "@tremor/react";
import apiClient from "../../../../api/api";

function StrukturOrganisasiFormModal({ isOpen, onClose, assessmentId, onSaveSuccess, initialData = null }) {
  const [formData, setFormData] = useState({ direktorat: "", divisi: "", unit_kerja: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const isEditMode = Boolean(initialData);

  useEffect(() => {
    if (isEditMode && initialData) {
      setFormData({
        direktorat: initialData.direktorat || "",
        divisi: initialData.divisi || "",
        unit_kerja: initialData.unit_kerja || "",
      });
    } else {
      // Reset form jika bukan mode edit atau initialData null
      setFormData({ direktorat: "", divisi: "", unit_kerja: "" });
    }
  }, [initialData, isEditMode, isOpen]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    const payload = { ...formData };

    try {
      let response;
      // --- PERUBAHAN: Pilih API berdasarkan mode ---
      if (isEditMode) {
        response = await apiClient.put(`/structure-entries/${initialData.id}`, payload);
      } else {
        response = await apiClient.post(`/madya-assessments/${assessmentId}/structure-entries`, payload);
      }

      onSaveSuccess(response.data.entry, isEditMode); // Kirim flag isEditMode ke parent
      handleClose();
    } catch (err) {
      setError(err.response?.data?.msg || `Gagal ${isEditMode ? "memperbarui" : "menyimpan"} data.`);
      console.error("Save/Update error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setError("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} static={true}>
      <DialogPanel>
        <Title>{isEditMode ? "Edit" : "Tambah"} Data Struktur Organisasi</Title>
        {error && <Text className="text-red-500 mt-2">{error}</Text>}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label>Direktorat</label>
            <TextInput name="direktorat" value={formData.direktorat} onChange={handleChange} />
          </div>
          <div>
            <label>Divisi</label>
            <TextInput name="divisi" value={formData.divisi} onChange={handleChange} />
          </div>
          <div>
            <label>Unit Kerja</label>
            <TextInput name="unit_kerja" value={formData.unit_kerja} onChange={handleChange} />
          </div>
          {/* --- PERUBAHAN: Hapus input file dari sini --- */}
          {/* <div> <label>Upload Struktur Organisasi...</label> <input/> </div> */}
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="secondary" onClick={handleClose} type="button">
              Batal
            </Button>
            <Button type="submit" loading={isLoading}>
              {isEditMode ? "Update" : "Simpan"}
            </Button>
          </div>
        </form>
      </DialogPanel>
    </Dialog>
  );
}

export default StrukturOrganisasiFormModal;
