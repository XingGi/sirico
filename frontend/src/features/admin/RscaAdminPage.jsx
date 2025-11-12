import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Title, Text, Button, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Badge, Flex, Icon } from "@tremor/react";
import { FiPlus, FiEdit, FiSettings, FiEye, FiFileText, FiGrid, FiList, FiBriefcase, FiCalendar, FiLoader } from "react-icons/fi";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../api/api";
import CreateCycleModal from "./components/rsca/CreateCycleModal";
import QuestionnaireEditor from "./components/rsca/QuestionnaireEditor";
import EditCycleModal from "./components/rsca/EditCycleModal";

// Fungsi fetcher untuk mengambil siklus
const fetchRscaCycles = async () => {
  const { data } = await apiClient.get("/admin/rsca-cycles");
  return data;
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";

  const date = new Date(dateString + "T00:00:00");

  if (isNaN(date.getTime())) {
    return dateString; // Kembalikan string asli jika formatnya tidak bisa diparsing
  }

  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

function RscaAdminPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [cycleToEdit, setCycleToEdit] = useState(null);
  const [cycleForQuestions, setCycleForQuestions] = useState(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [viewMode, setViewMode] = useState("grid");

  const {
    data: cycles,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["rscaCyclesAdmin"],
    queryFn: fetchRscaCycles,
  });

  const handleCreateModalClose = () => {
    setIsCreateModalOpen(false);
    refetch();
  };

  const handleEditModalClose = () => {
    setIsEditModalOpen(false);
    setCycleToEdit(null);
  };

  const handleOpenEditModal = (cycle) => {
    setCycleToEdit(cycle);
    setIsEditModalOpen(true);
  };

  const handleEditSaveSuccess = (updatedCycle) => {
    // Update data di cache React Query secara manual
    queryClient.setQueryData(["rscaCyclesAdmin"], (oldData) => oldData.map((cycle) => (cycle.id === updatedCycle.id ? updatedCycle : cycle)));
  };

  const handleEditQuestions = (cycle) => {
    setCycleForQuestions(cycle);
  };

  const handleViewResults = (cycle) => {
    // Ini navigasi ke halaman hasil baru
    navigate(`/admin/rsca/results/${cycle.id}`);
  };

  // Jika ada siklus dipilih, tampilkan editor kuesioner
  if (cycleForQuestions) {
    return <QuestionnaireEditor cycle={cycleForQuestions} onBack={() => setCycleForQuestions(null)} />;
  }

  // Tampilan utama (daftar siklus)
  return (
    <div className="p-6 sm:p-10">
      <Flex alignItems="center" className="space-x-3 mb-6">
        <Icon icon={FiFileText} size="lg" variant="light" color="blue" />
        <div>
          <Title>Manajemen Siklus RSCA</Title>
          <Text>Buat, edit, dan tugaskan siklus kuesioner RSCA.</Text>
        </div>
        <div className="flex-grow" /> {/* Spacer */}
        <Button icon={viewMode === "list" ? FiGrid : FiList} variant="light" onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")} aria-label={viewMode === "list" ? "Switch to grid view" : "Switch to list view"} />
        <Button icon={FiPlus} onClick={() => setIsCreateModalOpen(true)}>
          Buat Siklus Baru
        </Button>
      </Flex>

      <div className={`mt-6 ${viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}`}>
        {isLoading ? (
          <div className="col-span-full flex justify-center items-center p-10">
            <FiLoader className="animate-spin h-6 w-6 mr-3 text-tremor-content-emphasis" />
            <Text>Memuat siklus...</Text>
          </div>
        ) : cycles?.length > 0 ? (
          cycles.map((cycle) => (
            <Card key={cycle.id} className="p-0 overflow-hidden hover:shadow-lg transition-shadow duration-200 flex flex-col">
              {/* Bagian Konten Utama */}
              <div className="p-4 flex-grow">
                <Flex>
                  <Title className="mb-2">{cycle.nama_siklus}</Title>
                  <Badge color={cycle.status === "Draft" ? "gray" : "blue"}>{cycle.status}</Badge>
                </Flex>

                {/* Metadata */}
                <div className="space-y-2 mt-2 text-tremor-content">
                  <span className="flex items-center gap-2 text-sm">
                    <Icon icon={FiCalendar} size="sm" />
                    {formatDate(cycle.tanggal_mulai)} - {formatDate(cycle.tanggal_selesai)}
                  </span>
                  <span className="flex items-center gap-2 text-sm">
                    <Icon icon={FiBriefcase} size="sm" />
                    {cycle.departments?.map((dep) => dep.name).join(", ") || "Belum ada departemen"}
                  </span>
                </div>
              </div>

              {/* Bagian Footer Aksi */}
              <div className="border-t p-2 flex justify-end gap-1 bg-tremor-background-muted">
                <Button icon={FiEye} variant="light" color="blue" onClick={() => handleViewResults(cycle)} title="Lihat Hasil & Jawaban" />
                <Button icon={FiEdit} variant="light" color="gray" onClick={() => handleOpenEditModal(cycle)} title="Edit Nama, Tanggal & Departemen" disabled={cycle.status !== "Draft"} />
                <Button icon={FiSettings} variant="light" color="gray" onClick={() => handleEditQuestions(cycle)} title="Edit Pertanyaan & Kuesioner" disabled={cycle.status !== "Draft"} />
              </div>
            </Card>
          ))
        ) : (
          // Tampilan Kosong (Empty State)
          <Card className="col-span-full text-center p-8 border-dashed border-gray-300">
            <FiPlus className="mx-auto h-10 w-10 text-gray-400 mb-2" />
            <Text className="font-medium">Belum ada siklus RSCA.</Text>
            <Text>Klik tombol "Buat Siklus Baru" untuk memulai.</Text>
          </Card>
        )}
      </div>

      <CreateCycleModal isOpen={isCreateModalOpen} onClose={handleCreateModalClose} />
      <EditCycleModal isOpen={isEditModalOpen} onClose={handleEditModalClose} cycleData={cycleToEdit} onSaveSuccess={handleEditSaveSuccess} />
    </div>
  );
}

export default RscaAdminPage;
