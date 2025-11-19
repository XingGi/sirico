// frontend/src/features/admin/components/rsca/ActionPlanModal.jsx

import React, { useState, useEffect } from "react";
import { Dialog, DialogPanel, Title, Text, Button, Textarea, Select, SelectItem, DatePicker } from "@tremor/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../../../api/api";
import { toast } from "sonner";
import { FiSave } from "react-icons/fi";
import { toLocalISODate } from "../../../../utils/formatters";

const fetchDepartments = async () => {
  const { data } = await apiClient.get("/admin/departments-list");
  return data;
};

const createActionPlan = (planData) => {
  return apiClient.post("/admin/action-plans", planData);
};

function ActionPlanModal({ isOpen, onClose, sourceData, onSaveSuccess, cycleId }) {
  const queryClient = useQueryClient();
  const [description, setDescription] = useState("");
  const [assignedDeptId, setAssignedDeptId] = useState("");
  const [dueDate, setDueDate] = useState(null);

  const { data: departments, isLoading: isLoadingDepts } = useQuery({
    queryKey: ["allDepartments"],
    queryFn: fetchDepartments,
    enabled: isOpen,
  });

  const mutation = useMutation({
    mutationFn: createActionPlan,
    onSuccess: (data) => {
      toast.success(data.msg || "Rencana aksi berhasil dibuat!");
      queryClient.invalidateQueries({ queryKey: ["rscaResult", cycleId] });
      onSaveSuccess();
      handleClose();
    },
    onError: (error) => {
      toast.error("Gagal membuat rencana aksi: " + (error.response?.data?.msg || error.message));
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!description || !assignedDeptId) {
      toast.error("Deskripsi dan Departemen Penanggung Jawab wajib diisi.");
      return;
    }

    mutation.mutate({
      ...sourceData,
      action_description: description,
      assigned_department_id: Number(assignedDeptId),
      due_date: toLocalISODate(dueDate),
    });
  };

  const handleClose = () => {
    if (mutation.isPending) return;
    setDescription("");
    setAssignedDeptId("");
    setDueDate(null);
    onClose();
  };

  if (!isOpen || !sourceData) {
    return null;
  }

  return (
    <Dialog open={isOpen} onClose={handleClose} static={true}>
      <DialogPanel>
        <Title className="mb-4">Buat Rencana Aksi (Mitigasi)</Title>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-tremor-default font-medium text-tremor-content-strong">Sumber Masalah</label>
            <Text className="mt-1 p-2 bg-gray-100 rounded-md border">{sourceData.origin_answer_id ? `Jawaban Kuesioner #${sourceData.origin_answer_id}` : `Ajuan Risiko #${sourceData.origin_submitted_risk_id}`}</Text>
          </div>
          <div>
            <label className="text-tremor-default font-medium text-tremor-content-strong">Deskripsi Rencana Aksi (Wajib)</label>
            <Textarea value={description} onValueChange={setDescription} placeholder="Jelaskan tindakan perbaikan yang harus dilakukan..." rows={3} required disabled={mutation.isPending} className="mt-1" />
          </div>
          <div>
            <label className="text-tremor-default font-medium text-tremor-content-strong">Penanggung Jawab (Wajib)</label>
            <Select value={assignedDeptId} onValueChange={setAssignedDeptId} placeholder={isLoadingDepts ? "Memuat departemen..." : "Pilih departemen"} disabled={isLoadingDepts || mutation.isPending} className="mt-1">
              {departments?.map((dept) => (
                <SelectItem key={dept.id} value={String(dept.id)}>
                  {dept.name}
                </SelectItem>
              ))}
            </Select>
          </div>
          <div>
            <label className="text-tremor-default font-medium text-tremor-content-strong">Tenggat Waktu (Opsional)</label>
            <DatePicker value={dueDate} onValueChange={setDueDate} placeholder="Pilih tanggal" className="mt-1" disabled={mutation.isPending} />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="secondary" onClick={handleClose} disabled={mutation.isPending}>
              Batal
            </Button>
            <Button type="submit" icon={FiSave} loading={mutation.isPending} disabled={mutation.isPending}>
              Simpan Rencana Aksi
            </Button>
          </div>
        </form>
      </DialogPanel>
    </Dialog>
  );
}

export default ActionPlanModal;
