// frontend/src/features/bpr/components/CreateBPRModal.jsx
import React, { useState, useEffect } from "react";
import { Dialog, DialogPanel, Title, TextInput, Select, SelectItem, Button, Text } from "@tremor/react";
import { FiSave, FiX } from "react-icons/fi";
import apiClient from "../../../../api/api";
import { toast } from "sonner";

export default function CreateBPRModal({ isOpen, onClose, onSaveSuccess }) {
  const [formData, setFormData] = useState({ name: "", department_id: "", period: "2025-Q1" });
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      apiClient.get("/admin/departments-list").then((res) => setDepartments(res.data));
      setFormData({ name: "", department_id: "", period: "2025-Q1" });
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await apiClient.post("/bpr/documents", formData);
      toast.success("Dokumen BPR berhasil dibuat.");
      onSaveSuccess();
      onClose();
    } catch (error) {
      toast.error("Gagal membuat BPR.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={() => !isLoading && onClose()} static={true}>
      <DialogPanel>
        <div className="flex justify-between items-center mb-4">
          <Title>Buat Proses Bisnis Baru</Title>
          <Button icon={FiX} variant="light" onClick={onClose} disabled={isLoading} />
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Text>Nama Proses Bisnis</Text>
            <TextInput placeholder="Contoh: Rekrutmen Karyawan" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="mt-1" />
          </div>
          <div>
            <Text>Departemen Pemilik</Text>
            <Select value={String(formData.department_id)} onValueChange={(val) => setFormData({ ...formData, department_id: val })} placeholder="Pilih Departemen..." required className="mt-1">
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={String(dept.id)}>
                  {dept.name}
                </SelectItem>
              ))}
            </Select>
          </div>
          <div>
            <Text>Periode</Text>
            <TextInput value={formData.period} onChange={(e) => setFormData({ ...formData, period: e.target.value })} required className="mt-1" />
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="secondary" onClick={onClose} disabled={isLoading}>
              Batal
            </Button>
            <Button type="submit" loading={isLoading} icon={FiSave}>
              Buat Proses
            </Button>
          </div>
        </form>
      </DialogPanel>
    </Dialog>
  );
}
