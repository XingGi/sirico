import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Title, Text, Button, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Badge, Flex, Icon } from "@tremor/react";
import { FiPlus, FiEdit, FiSettings, FiEye, FiFileText, FiGrid, FiList, FiBriefcase, FiCalendar, FiLoader } from "react-icons/fi";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../api/api";
import CreateCycleModal from "./components/rsca/CreateCycleModal";
import QuestionnaireEditor from "./components/rsca/QuestionnaireEditor";
import EditCycleModal from "./components/rsca/EditCycleModal";
import CycleCard from "./components/rsca/CycleCard";

// Fungsi fetcher untuk mengambil siklus
const fetchRscaCycles = async () => {
  const { data } = await apiClient.get("/admin/rsca-cycles");
  return data;
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
    queryClient.setQueryData(["rscaCyclesAdmin"], (oldData) => oldData.map((cycle) => (cycle.id === updatedCycle.id ? updatedCycle : cycle)));
  };

  const handleEditQuestions = (cycle) => {
    setCycleForQuestions(cycle);
  };

  const handleViewResults = (cycle) => {
    navigate(`/admin/rsca/results/${cycle.id}`);
  };

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
          cycles.map((cycle) => <CycleCard key={cycle.id} cycle={cycle} onViewResults={handleViewResults} onEdit={handleOpenEditModal} onEditQuestions={handleEditQuestions} />)
        ) : (
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
