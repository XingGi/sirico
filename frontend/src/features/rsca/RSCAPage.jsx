// frontend/src/features/rsca/RSCAPage.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../api/api";
import { Card, Title, Text, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Badge, Button, Flex, Icon } from "@tremor/react";
import { FiFileText, FiEye, FiCheckCircle, FiLoader, FiGrid, FiList, FiCalendar } from "react-icons/fi";

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

function RSCAPage() {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid");
  const navigate = useNavigate();

  useEffect(() => {
    setIsLoading(true);
    apiClient
      .get("/my-rsca-tasks") // Endpoint ini sudah kita perbaiki
      .then((response) => {
        setTasks(response.data);
      })
      .catch((error) => {
        console.error("Gagal memuat tugas RSCA:", error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

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
        <div className="flex-grow" /> {/* Spacer */}
        <Button icon={viewMode === "list" ? FiGrid : FiList} variant="light" onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")} aria-label={viewMode === "list" ? "Switch to grid view" : "Switch to list view"} />
      </Flex>

      <div className={`mt-6 ${viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}`}>
        {isLoading ? (
          <div className="col-span-full flex justify-center items-center p-10">
            <FiLoader className="animate-spin h-6 w-6 mr-3 text-tremor-content-emphasis" />
            <Text>Memuat tugas...</Text>
          </div>
        ) : tasks.length === 0 ? (
          <Card className="col-span-full text-center p-8 border-dashed border-gray-300">
            <FiCheckCircle className="mx-auto h-10 w-10 text-gray-400 mb-2" />
            <Text className="font-medium">Tidak ada tugas RSCA.</Text>
            <Text>Saat ini tidak ada kuesioner yang aktif untuk departemen Anda.</Text>
          </Card>
        ) : (
          tasks.map((task) => (
            <Card key={task.id} className="p-0 overflow-hidden hover:shadow-lg transition-shadow duration-200 flex flex-col">
              {/* Bagian Konten Utama */}
              <div className="p-4 flex-grow">
                <Flex>
                  <Title className="mb-2">{task.nama_siklus}</Title>
                  <Badge color={getStatusColor(task.status)}>{task.status}</Badge>
                </Flex>

                {/* Metadata */}
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

              {/* Bagian Footer Aksi */}
              <div className="border-t p-2 flex justify-end bg-tremor-background-muted">
                <Button
                  icon={FiEye}
                  variant="secondary" // Tombol aksi utama
                  color="blue"
                  onClick={() => handleViewTask(task.id)}
                >
                  Lihat & Isi Kuesioner
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

export default RSCAPage;
