import React, { useState } from "react";
import { Dialog, DialogPanel, Title, Button, TextInput, DatePicker, MultiSelect, MultiSelectItem } from "@tremor/react";
import { useQuery, useMutation } from "@tanstack/react-query";
import apiClient from "../../../../api/api";
import { toast } from "sonner";

const fetchDepartments = async () => {
  // const { data } = await apiClient.get("/master-data/Department"); // <-- INI SALAH
  const { data } = await apiClient.get("/admin/departments-list");
  return data;
};

// Fungsi mutation untuk membuat siklus
const createCycle = (newCycle) => {
  return apiClient.post("/admin/rsca-cycles", newCycle);
};

function CreateCycleModal({ isOpen, onClose }) {
  const [nama, setNama] = useState("");
  const [tanggalMulai, setTanggalMulai] = useState(null);
  const [tanggalSelesai, setTanggalSelesai] = useState(null);
  const [selectedDepts, setSelectedDepts] = useState([]);

  // Ambil data departemen
  const { data: departments, isLoading: isLoadingDepts } = useQuery({
    queryKey: ["allDepartments"],
    queryFn: fetchDepartments,
  });

  const mutation = useMutation({
    mutationFn: createCycle,
    onSuccess: () => {
      toast.success("Siklus RSCA berhasil dibuat!");
      onClose();
    },
    onError: (error) => {
      toast.error("Gagal membuat siklus: " + error.message);
    },
  });

  const handleSubmit = () => {
    mutation.mutate({
      nama_siklus: nama,
      tanggal_mulai: tanggalMulai,
      tanggal_selesai: tanggalSelesai,
      department_ids: selectedDepts.map((id) => parseInt(id)), // Pastikan jadi integer
    });
  };

  // Konversi data departemen untuk MultiSelect
  const departmentOptions = departments?.map((dep) => ({
    value: dep.id.toString(), // Pastikan value adalah string
    name: dep.name,
  }));

  return (
    <Dialog open={isOpen} onClose={onClose} static={true}>
      <DialogPanel>
        <Title className="mb-4">Buat Siklus RSCA Baru</Title>
        <div className="space-y-4">
          <TextInput placeholder="Nama Siklus (cth: Kepatuhan Q4 2025)" value={nama} onValueChange={setNama} />
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
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button onClick={handleSubmit} loading={mutation.isPending}>
            Simpan
          </Button>
        </div>
      </DialogPanel>
    </Dialog>
  );
}

export default CreateCycleModal;
