// frontend/src/features/rsca/RSCAPage.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../api/api";
import { Card, Title, Text, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Badge, Button, Flex, Icon, Tab, TabGroup, TabList, TabPanel, TabPanels } from "@tremor/react";
import { FiFileText, FiEye, FiCheckCircle, FiLoader, FiGrid, FiList, FiCalendar, FiArchive } from "react-icons/fi";
import { useQuery } from "@tanstack/react-query";

// Helper untuk format tanggal (kita pinjam dari RscaAdminPage)
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString + "T00:00:00");
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

// Helper untuk warna status
const getStatusColor = (status) => {
  if (status === "Selesai") return "green";
  if (status === "Draft" || status === "Berjalan") return "blue";
  return "gray";
};

const getCycleStatusColor = (status) => {
  if (status === "Selesai") return "green";
  if (status === "Draft" || status === "Berjalan") return "blue";
  return "gray";
};

// Helper untuk warna status Ajuan
const getStatusBadgeColor = (status) => {
  if (status === "Disetujui") return "green";
  if (status === "Ditolak") return "red";
  if (status === "Menunggu Persetujuan") return "amber";
  return "gray";
};

const fetchMyTasks = async () => {
  const { data } = await apiClient.get("/my-rsca-tasks");
  return data;
};

const fetchMySubmissions = async () => {
  // Panggil endpoint baru yang kita buat di Langkah 8A
  const { data } = await apiClient.get("/my-submitted-risks");
  return data;
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
  const isLoading = isLoadingTasks || isLoadingSubmissions;

  const handleViewTask = (taskId) => {
    navigate(`/addons/rsca/cycle/${taskId}`);
  };

  return (
    <div className="p-6 sm:p-10">
      <Flex alignItems="center" className="space-x-3 mb-6">
        <Icon icon={FiFileText} size="lg" variant="light" color="blue" />
        <div>
          <Title>Tugas Kuesioner RSCA</Title>
          <Text>Daftar tugas kuesioner yang ditugaskan ke departemen Anda.</Text>
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
        </TabList>
        <TabPanels>
          {/* --- PANEL 1: TUGAS KUESIONER (KODE LAMA MILIKMU) --- */}
          <TabPanel>
            <Flex justifyContent="end" className="mt-6">
              <Button icon={viewMode === "list" ? FiGrid : FiList} variant="light" onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")} aria-label={viewMode === "list" ? "Switch to grid view" : "Switch to list view"} />
            </Flex>

            {/* Ini adalah kode layout grid/list milikmu, tidak diubah */}
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
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Siklus</TableHeaderCell>
                    <TableHeaderCell>Ajuan Risiko</TableHeaderCell>
                    <TableHeaderCell>Tanggal Diajukan</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {isLoadingSubmissions ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-10">
                        <Flex justifyContent="center" alignItems="center" className="space-x-2 text-tremor-content">
                          <Icon icon={FiLoader} className="animate-spin" size="sm" />
                          <Text>Memuat ajuan...</Text>
                        </Flex>
                      </TableCell>
                    </TableRow>
                  ) : submissions?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-10">
                        <Flex justifyContent="center" alignItems="center" className="space-x-2 text-tremor-content">
                          <Icon icon={FiCheckCircle} size="sm" />
                          <Text>Anda belum pernah mengajukan risiko baru.</Text>
                        </Flex>
                      </TableCell>
                    </TableRow>
                  ) : (
                    submissions.map((risk) => (
                      <TableRow key={risk.id}>
                        <TableCell>{risk.cycle_name}</TableCell>
                        <TableCell className="max-w-md whitespace-normal break-words">
                          <Text className="font-medium text-tremor-content-strong">{risk.risk_description}</Text>
                          <Text className="italic text-gray-500">Penyebab: {risk.potential_cause || "-"}</Text>
                        </TableCell>
                        <TableCell>{formatDate(risk.created_at)}</TableCell>
                        <TableCell>
                          <Badge color={getStatusBadgeColor(risk.status)}>{risk.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  );
}

export default RSCAPage;
