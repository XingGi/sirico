// frontend/src/features/rsca/RSCAPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../../api/api";
import { Card, Title, Text, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Badge, Button, Flex, Icon, Tab, TabGroup, TabList, TabPanel, TabPanels } from "@tremor/react";
import { FiFileText, FiEye, FiCheckCircle, FiLoader, FiGrid, FiList, FiCalendar, FiArchive, FiActivity } from "react-icons/fi";
import { useQuery } from "@tanstack/react-query";
import { formatDate, getStatusColor, getStatusBadgeColor } from "../../../utils/formatters";
import AppResourceTable from "../../../components/common/AppResourceTable";

const fetchMyTasks = async () => {
  const { data } = await apiClient.get("/my-rsca-tasks");
  return data;
};

const fetchMySubmissions = async () => {
  const { data } = await apiClient.get("/my-submitted-risks");
  return data;
};

const fetchMyActionPlans = async () => {
  const { data } = await apiClient.get("/my-action-plan-tasks");
  return data;
};

const getCycleStatusColor = (status) => {
  if (status === "Selesai") return "green";
  if (status === "Draft" || status === "Berjalan") return "blue";
  return "gray";
};

function RSCAPage() {
  const [viewMode, setViewMode] = useState("grid");
  const navigate = useNavigate();
  const { data: tasks, isLoading: isLoadingTasks } = useQuery({
    queryKey: ["myRscaTasks"],
    queryFn: fetchMyTasks,
  });

  // 2. Query untuk "Ajuan Risiko Saya"
  const { data: submissions, isLoading: isLoadingSubmissions } = useQuery({
    queryKey: ["mySubmittedRisks"],
    queryFn: fetchMySubmissions,
  });

  const { data: actionPlans, isLoading: isLoadingActionPlans } = useQuery({
    queryKey: ["myActionPlanTasks"],
    queryFn: fetchMyActionPlans,
  });

  const isLoading = isLoadingTasks || isLoadingSubmissions || isLoadingActionPlans;

  const handleViewTask = (taskId) => {
    navigate(`/addons/rsca/cycle/${taskId}`);
  };

  const submissionColumns = [
    {
      key: "cycle",
      header: "Siklus",
      cell: (risk) => <Text>{risk.cycle_name}</Text>,
    },
    {
      key: "description",
      header: "Ajuan Risiko",
      cell: (risk) => (
        <div className="max-w-md whitespace-normal break-words">
          <Text className="font-medium text-tremor-content-strong">{risk.risk_description}</Text>
          <Text className="italic text-gray-500">Penyebab: {risk.potential_cause || "-"}</Text>
        </div>
      ),
    },
    {
      key: "date",
      header: "Tanggal Diajukan",
      cell: (risk) => <Text>{formatDate(risk.created_at)}</Text>,
    },
    {
      key: "status",
      header: "Status",
      cell: (risk) => <Badge color={getStatusBadgeColor(risk.status)}>{risk.status}</Badge>,
    },
  ];

  // Definisi Kolom untuk TAB 3 (Tugas Mitigasi)
  const actionPlanColumns = [
    {
      key: "description",
      header: "Deskripsi Tugas Mitigasi",
      cell: (plan) => <Text className="max-w-md whitespace-normal break-words font-medium text-tremor-content-strong">{plan.action_description}</Text>,
    },
    {
      key: "source",
      header: "Sumber Masalah",
      cell: (plan) => <Text>{plan.source_text}</Text>,
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
  ];

  return (
    <div className="p-6 sm:p-10">
      <Flex alignItems="center" className="space-x-3 mb-6">
        <Icon icon={FiFileText} size="lg" variant="light" color="blue" />
        <div>
          <Title>Tugas Kuesioner RSCA</Title>
          <Text>Daftar tugas kuesioner, ajuan risiko, dan mitigasi untuk departemen Anda.</Text>
        </div>
      </Flex>

      <TabGroup>
        <TabList variant="line" defaultValue="1">
          <Tab value="1" icon={FiFileText}>
            Tugas Kuesioner ({tasks?.length || 0})
          </Tab>
          <Tab value="2" icon={FiArchive}>
            Ajuan Risiko Saya ({submissions?.length || 0})
          </Tab>
          <Tab value="3" icon={FiActivity}>
            Tugas Mitigasi Saya ({actionPlans?.length || 0})
          </Tab>
        </TabList>
        <TabPanels>
          {/* --- PANEL 1: TUGAS KUESIONER (KODE LAMA MILIKMU) --- */}
          <TabPanel>
            <Flex justifyContent="end" className="mt-6">
              <Button icon={viewMode === "list" ? FiGrid : FiList} variant="light" onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")} aria-label={viewMode === "list" ? "Switch to grid view" : "Switch to list view"} />
            </Flex>

            <div className={`mt-6 ${viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}`}>
              {isLoadingTasks ? (
                <div className="col-span-full flex justify-center items-center p-10">
                  <FiLoader className="animate-spin h-6 w-6 mr-3 text-tremor-content-emphasis" />
                  <Text>Memuat tugas...</Text>
                </div>
              ) : tasks?.length === 0 ? (
                <Card className="col-span-full text-center p-8 border-dashed border-gray-300">
                  <FiCheckCircle className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                  <Text className="font-medium">Tidak ada tugas RSCA.</Text>
                  <Text>Saat ini tidak ada kuesioner yang aktif untuk departemen Anda.</Text>
                </Card>
              ) : (
                tasks.map((task) => (
                  <Card key={task.id} className="p-0 overflow-hidden hover:shadow-lg transition-shadow duration-200 flex flex-col">
                    <div className="p-4 flex-grow">
                      <Flex>
                        <Title className="mb-2">{task.nama_siklus}</Title>
                        <Badge color={getCycleStatusColor(task.status)}>{task.status}</Badge>
                      </Flex>
                      <div className="space-y-2 mt-2 text-tremor-content">
                        <span className="flex items-center gap-2 text-sm">
                          <Icon icon={FiCalendar} size="sm" />
                          Mulai: {formatDate(task.tanggal_mulai)}
                        </span>
                        <span className="flex items-center gap-2 text-sm">
                          <Icon icon={FiCalendar} size="sm" color={new Date(task.tanggal_selesai) < new Date() ? "red" : "inherit"} />
                          Selesai: {formatDate(task.tanggal_selesai)}
                        </span>
                      </div>
                    </div>
                    <div className="border-t p-2 flex justify-end bg-tremor-background-muted">
                      <Button icon={FiEye} variant="secondary" color="blue" onClick={() => handleViewTask(task.id)}>
                        Lihat & Isi Kuesioner
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </TabPanel>

          {/* --- PANEL 2: AJUAN RISIKO SAYA (BARU) --- */}
          <TabPanel>
            <Card className="mt-6">
              <AppResourceTable data={submissions} isLoading={isLoadingSubmissions} columns={submissionColumns} emptyMessage="Anda belum pernah mengajukan risiko baru." />
            </Card>
          </TabPanel>

          {/* --- PANEL 3: TUGAS MITIGASI --- */}
          <TabPanel>
            <Card className="mt-6">
              <AppResourceTable data={actionPlans} isLoading={isLoadingActionPlans} columns={actionPlanColumns} emptyMessage="Tidak ada tugas mitigasi yang ditugaskan ke departemen Anda." />
            </Card>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  );
}

export default RSCAPage;
