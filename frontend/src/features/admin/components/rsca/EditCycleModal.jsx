import React, { useState, useEffect } from "react"; // <-- Tambahkan useEffect
import { Dialog, DialogPanel, Title, Button, TextInput, DatePicker, MultiSelect, MultiSelectItem } from "@tremor/react";
import { useQuery, useMutation } from "@tanstack/react-query"; // <-- Kita butuh useMutation
import apiClient from "../../../../api/api";
import { toast } from "sonner";

// Fungsi fetcher untuk mengambil departemen (Sama seperti di CreateModal)
const fetchDepartments = async () => {
  // Kita panggil endpoint 'list' yang sudah kita amankan per institusi
  const { data } = await apiClient.get("/admin/departments-list");
  return data;
};

const updateCycle = ({ id, cycleData }) => {
  return apiClient.put(`/admin/rsca-cycles/${id}`, cycleData);
};

const toLocalISODate = (date) => {
  if (!date) return null;
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0"); // +1 karena bulan 0-indexed
  const day = date.getDate().toString().padStart(2, "0");

  return `${year}-${month}-${day}`; // Menghasilkan "YYYY-MM-DD"
};

const parseDate = (dateString) => {
  if (!dateString) return null;
  return new Date(dateString + "T00:00:00");
};

function EditCycleModal({ isOpen, onClose, cycleData, onSaveSuccess }) {
  // State untuk form
  const [nama, setNama] = useState("");
  const [tanggalMulai, setTanggalMulai] = useState(null);
  const [tanggalSelesai, setTanggalSelesai] = useState(null);
  const [selectedDepts, setSelectedDepts] = useState([]);

  // Ambil data departemen (untuk dropdown)
  const { data: departments, isLoading: isLoadingDepts } = useQuery({
    queryKey: ["allDepartments"], // Manajer Risiko hanya akan dapat dept institusinya
    queryFn: fetchDepartments,
  });

  useEffect(() => {
    if (cycleData && isOpen) {
      setNama(cycleData.nama_siklus || "");
      setTanggalMulai(parseDate(cycleData.tanggal_mulai));
      setTanggalSelesai(parseDate(cycleData.tanggal_selesai));
      // Map array of department objects ke array of string IDs
      setSelectedDepts(cycleData.departments?.map((dept) => String(dept.id)) || []);
    }
  }, [cycleData, isOpen]);

  const mutation = useMutation({
    mutationFn: updateCycle, // <-- Gunakan fungsi update
    onSuccess: (updatedData) => {
      toast.success("Siklus RSCA berhasil diupdate!");
      onSaveSuccess(updatedData); // Kirim data baru ke parent
      onClose();
    },
    onError: (error) => {
      toast.error("Gagal mengupdate siklus: " + error.response?.data?.msg);
    },
  });

  const handleSubmit = () => {
    mutation.mutate({
      id: cycleData.id,
      cycleData: {
        nama_siklus: nama,
        tanggal_mulai: toLocalISODate(tanggalMulai),
        tanggal_selesai: toLocalISODate(tanggalSelesai),
        department_ids: selectedDepts.map(Number),
      },
    });
  };

  const departmentOptions = departments?.map((dep) => ({
    value: dep.id.toString(),
    name: dep.name,
  }));

  return (
    <Dialog open={isOpen} onClose={() => !mutation.isPending && onClose()} static={true}>
      <DialogPanel>
        <Title className="mb-4">Edit Siklus: {cycleData?.nama_siklus}</Title>
        <div className="space-y-4">
          <TextInput placeholder="Nama Siklus" value={nama} onValueChange={setNama} />
          <DatePicker placeholder="Tanggal Mulai" value={tanggalMulai} onValueChange={setTanggalMulai} />
          <DatePicker placeholder="Tanggal Selesai" value={tanggalSelesai} onValueChange={setTanggalSelesai} />
          <MultiSelect placeholder="Tugaskan ke Departemen..." value={selectedDepts} onValueChange={setSelectedDepts} disabled={isLoadingDepts}>
            {departmentOptions?.map((item) => (
              <MultiSelectItem key={item.value} value={item.value}>
                {item.name}
              </MultiSelectItem>
            ))}
          </MultiSelect>
        </div>
        <div className="mt-6 flex justify-end space-x-2">
          <Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>
            Batal
          </Button>
          <Button onClick={handleSubmit} loading={mutation.isPending}>
            Simpan Perubahan
          </Button>
        </div>
      </DialogPanel>
    </Dialog>
  );
}

export default EditCycleModal;
