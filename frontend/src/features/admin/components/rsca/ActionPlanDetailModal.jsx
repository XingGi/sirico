// frontend/src/features/admin/components/rsca/ActionPlanDetailModal.jsx

import React, { useState, useEffect } from "react";
import { Dialog, DialogPanel, Title, Text, Button, Select, SelectItem, Badge, Flex, Icon, Subtitle } from "@tremor/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../../../api/api";
import { toast } from "sonner";
import { FiSave, FiClock, FiCheckCircle, FiMinusCircle } from "react-icons/fi";
import { getStatusColor } from "../../../../utils/formatters";

const updateStatus = ({ planId, status }) => {
  return apiClient.put(`/admin/action-plans/${planId}/status`, { status });
};

function ActionPlanDetailModal({ isOpen, onClose, plan, onSaveSuccess }) {
  const queryClient = useQueryClient();
  const [currentStatus, setCurrentStatus] = useState("");

  useEffect(() => {
    if (plan) {
      setCurrentStatus(plan.status || "Belum Mulai");
    }
  }, [plan, isOpen]);

  const mutation = useMutation({
    mutationFn: updateStatus,
    onSuccess: (data) => {
      toast.success(data.msg || "Status berhasil diupdate!");
      //   onSaveSuccess(data.action_plan);
      onSaveSuccess();
      onClose(); // Tutup modal
    },
    onError: (error) => {
      toast.error("Gagal update: " + (error.response?.data?.msg || error.message));
    },
  });

  const handleSave = () => {
    mutation.mutate({ planId: plan.id, status: currentStatus });
  };

  // Jangan render apapun jika data belum siap
  if (!isOpen || !plan) return null;

  return (
    <Dialog open={isOpen} onClose={() => !mutation.isPending && onClose()} static={true}>
      <DialogPanel>
        <Subtitle>Rencana Aksi #{plan.id}</Subtitle>
        <Title className="mb-4">{plan.action_description}</Title>

        <div className="space-y-4">
          <div>
            <label className="text-tremor-default font-medium text-tremor-content-strong">Status Saat Ini</label>
            <Select
              value={currentStatus}
              onValueChange={setCurrentStatus}
              className="mt-1"
              color={getStatusColor(currentStatus)}
              icon={currentStatus === "Selesai" ? FiCheckCircle : currentStatus === "Sedang Dikerjakan" ? FiClock : FiMinusCircle}
              disabled={mutation.isPending}
            >
              <SelectItem value="Belum Mulai" icon={FiMinusCircle}>
                Belum Mulai
              </SelectItem>
              <SelectItem value="Sedang Dikerjakan" icon={FiClock}>
                Sedang Dikerjakan
              </SelectItem>
              <SelectItem value="Selesai" icon={FiCheckCircle}>
                Selesai
              </SelectItem>
              {/* <SelectItem value="Dibatalkan" icon={FiXCircle}>Dibatalkan</SelectItem> */}
            </Select>
          </div>

          <div>
            <label className="text-tremor-default font-medium text-tremor-content-strong">Penanggung Jawab</label>
            <Text className="mt-1">{plan.assigned_department?.name || "N/A"}</Text>
          </div>

          <div>
            <label className="text-tremor-default font-medium text-tremor-content-strong">Tenggat Waktu</label>
            <Text className="mt-1" color={new Date(plan.due_date) < new Date() ? "red" : "inherit"}>
              {plan.due_date || "N/A"}
            </Text>
          </div>

          <div>
            <label className="text-tremor-default font-medium text-tremor-content-strong">Dibuat Oleh</label>
            <Text className="mt-1">{plan.creator?.nama_lengkap || "N/A"}</Text>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 mt-6 border-t">
          <Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>
            Tutup
          </Button>
          <Button icon={FiSave} onClick={handleSave} loading={mutation.isPending} disabled={mutation.isPending}>
            Update Status
          </Button>
        </div>
      </DialogPanel>
    </Dialog>
  );
}

export default ActionPlanDetailModal;
