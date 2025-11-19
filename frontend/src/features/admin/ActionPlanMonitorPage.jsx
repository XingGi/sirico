// frontend/src/features/admin/ActionPlanMonitorPage.jsx

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../api/api";
import { Card, Title, Text, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Badge, Flex, Icon, Button } from "@tremor/react";
import { FiActivity, FiLoader, FiAlertTriangle, FiCheckCircle } from "react-icons/fi";
import ActionPlanDetailModal from "./components/rsca/ActionPlanDetailModal";
import { formatDate, getStatusColor } from "../../utils/formatters";
import AppResourceTable from "../../components/common/AppResourceTable";

// Fungsi fetcher
const fetchActionPlans = async () => {
  const { data } = await apiClient.get("/admin/action-plans");
  return data;
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

  const columns = [
    {
      key: "description",
      header: "Deskripsi Rencana Aksi",
      cell: (plan) => <Text className="max-w-md whitespace-normal break-words font-medium text-tremor-content-strong">{plan.action_description}</Text>,
      cellClassName: "max-w-md whitespace-normal break-words",
    },
    {
      key: "assignee",
      header: "Penanggung Jawab (Dept)",
      cell: (plan) => <Text>{plan.assigned_department?.name || "N/A"}</Text>,
    },
    {
      key: "source",
      header: "Sumber Masalah",
      cell: (plan) => <Text>{getSourceText(plan)}</Text>,
    },
    {
      key: "due_date",
      header: "Tenggat Waktu",
      cell: (plan) => <Text color={plan.due_date && new Date(plan.due_date) < new Date() ? "red" : "inherit"}>{formatDate(plan.due_date)}</Text>,
    },
    {
      key: "status",
      header: "Status",
      cell: (plan) => <Badge color={getStatusColor(plan.status)}>{plan.status}</Badge>,
    },
    {
      key: "actions",
      header: "Aksi",
      cell: (plan) => (
        <Button variant="light" size="xs" onClick={() => openModal(plan)}>
          Detail / Update
        </Button>
      ),
      className: "text-right",
      cellClassName: "text-right",
    },
  ];

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
          <AppResourceTable data={plans} isLoading={isLoading} columns={columns} emptyMessage="Belum ada rencana aksi yang dibuat." />
        </Card>
      </div>
      <ActionPlanDetailModal isOpen={isModalOpen} onClose={handleModalClose} plan={selectedPlan} onSaveSuccess={handleSaveSuccess} />
    </>
  );
}

export default ActionPlanMonitorPage;
