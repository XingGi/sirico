// frontend/src/features/admin/ActionPlanMonitorPage.jsx

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../api/api";
import { Card, Title, Text, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Badge, Flex, Icon, Button } from "@tremor/react";
import { FiActivity, FiLoader, FiAlertTriangle, FiCheckCircle } from "react-icons/fi";
import ActionPlanDetailModal from "./components/rsca/ActionPlanDetailModal";

// Fungsi fetcher
const fetchActionPlans = async () => {
  const { data } = await apiClient.get("/admin/action-plans");
  return data;
};

// Helper untuk format tanggal
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

// Helper untuk status badge
const getStatusColor = (status) => {
  if (status === "Selesai") return "green";
  if (status === "Sedang Dikerjakan") return "blue";
  if (status === "Belum Mulai") return "gray";
  return "gray";
};

function ActionPlanMonitorPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const { data: plans, isLoading } = useQuery({
    queryKey: ["allActionPlans"],
    queryFn: fetchActionPlans,
  });

  const getSourceText = (plan) => {
    if (plan.origin_answer_id) {
      return `Jawaban RSCA #${plan.origin_answer_id}`;
    }
    if (plan.origin_submitted_risk_id) {
      return `Ajuan Risiko #${plan.origin_submitted_risk_id}`;
    }
    return "Tidak Diketahui";
  };

  const openModal = (plan) => {
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setSelectedPlan(null);
    setIsModalOpen(false);
  };

  const handleSaveSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["allActionPlans"] });
  };

  return (
    <>
      <div className="p-6 sm:p-10">
        <Flex alignItems="center" className="space-x-3 mb-6">
          <Icon icon={FiActivity} size="lg" variant="light" color="blue" />
          <div>
            <Title>Pemantauan Mitigasi (Rencana Aksi)</Title>
            <Text>Memantau semua rencana aksi yang sedang berjalan di institusi Anda.</Text>
          </div>
        </Flex>

        <Card>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Deskripsi Rencana Aksi</TableHeaderCell>
                <TableHeaderCell>Penanggung Jawab (Dept)</TableHeaderCell>
                <TableHeaderCell>Sumber Masalah</TableHeaderCell>
                <TableHeaderCell>Tenggat Waktu</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell className="text-right">Aksi</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    <Flex justifyContent="center" alignItems="center" className="space-x-2 text-tremor-content">
                      <Icon icon={FiLoader} className="animate-spin" size="sm" />
                      <Text>Memuat rencana aksi...</Text>
                    </Flex>
                  </TableCell>
                </TableRow>
              ) : plans?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    <Flex justifyContent="center" alignItems="center" className="space-x-2 text-tremor-content">
                      <Icon icon={FiCheckCircle} size="sm" />
                      <Text>Belum ada rencana aksi yang dibuat.</Text>
                    </Flex>
                  </TableCell>
                </TableRow>
              ) : (
                plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="max-w-md whitespace-normal break-words font-medium text-tremor-content-strong">{plan.action_description}</TableCell>
                    <TableCell>{plan.assigned_department?.name || "N/A"}</TableCell>
                    <TableCell>{getSourceText(plan)}</TableCell>
                    <TableCell>
                      <Text color={new Date(plan.due_date) < new Date() ? "red" : "inherit"}>{formatDate(plan.due_date)}</Text>
                    </TableCell>
                    <TableCell>
                      <Badge color={getStatusColor(plan.status)}>{plan.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="light" size="xs" onClick={() => openModal(plan)}>
                        Detail / Update
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
      <ActionPlanDetailModal isOpen={isModalOpen} onClose={handleModalClose} plan={selectedPlan} onSaveSuccess={handleSaveSuccess} />
    </>
  );
}

export default ActionPlanMonitorPage;
