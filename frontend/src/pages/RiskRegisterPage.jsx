// frontend/src/pages/RiskRegisterPage.jsx

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Card, Title, Text as TremorText, Badge, Button, TextInput, Select, SelectItem } from "@tremor/react";
import { FiSearch, FiUpload, FiDownload, FiMaximize, FiMinimize, FiTrash2 } from "react-icons/fi";
import apiClient from "../api";
import MainRiskRegisterTable from "../components/MainRiskRegisterTable";
import EditRiskItemSidebar from "../components/EditRiskItemSidebar";

function RiskRegisterPage() {
  const [risks, setRisks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("date-desc");

  const [selectedRisks, setSelectedRisks] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const tableCardRef = useRef(null);
  const [isEditSidebarOpen, setIsEditSidebarOpen] = useState(false);
  const [editingRisk, setEditingRisk] = useState(null);

  const fetchData = () => {
    setIsLoading(true);
    apiClient
      .get("/risk-register")
      .then((response) => {
        setRisks(response.data);
      })
      .catch((error) => console.error("Gagal memuat risk register:", error))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchData();
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) setIsFullscreen(false);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const sortedAndFilteredRisks = useMemo(() => {
    let filtered = risks.filter((risk) => risk.deskripsi_risiko.toLowerCase().includes(searchTerm.toLowerCase()) || risk.kode_risiko.toLowerCase().includes(searchTerm.toLowerCase()));

    switch (sortOption) {
      case "level-desc":
        return filtered.sort((a, b) => b.inherent_likelihood * b.inherent_impact - a.inherent_likelihood * a.inherent_impact);
      case "level-asc":
        return filtered.sort((a, b) => a.inherent_likelihood * a.inherent_impact - b.inherent_likelihood * b.inherent_impact);
      case "date-asc":
        return filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      case "title-asc":
        return filtered.sort((a, b) => (a.objective || "").localeCompare(b.objective || ""));
      case "title-desc":
        return filtered.sort((a, b) => (b.objective || "").localeCompare(a.objective || ""));
      // case 'date-desc' adalah default
      default:
        return filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
  }, [risks, searchTerm, sortOption]);

  const handleSelectRow = (id) => {
    setSelectedRisks((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedRisks(sortedAndFilteredRisks.map((r) => r.id));
    } else {
      setSelectedRisks([]);
    }
  };

  const isAllSelected = sortedAndFilteredRisks.length > 0 && selectedRisks.length === sortedAndFilteredRisks.length;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      tableCardRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
    }
  };

  const handleEdit = (risk) => {
    setEditingRisk(risk);
    setIsEditSidebarOpen(true);
  };

  const handleDelete = (riskId) => {
    if (window.confirm("Anda yakin ingin menghapus risiko ini dari Register Utama?")) {
      apiClient
        .delete(`/risk-register/${riskId}`)
        .then(() => {
          alert("Risiko berhasil dihapus.");
          fetchData(); // Muat ulang data
        })
        .catch((error) => alert("Gagal menghapus risiko."));
    }
  };

  const handleDeleteSelected = () => {
    if (window.confirm(`Anda yakin ingin menghapus ${selectedRisks.length} risiko terpilih?`)) {
      apiClient.post("/risk-register/bulk-delete", { risk_ids: selectedRisks }).then(() => {
        alert("Risiko terpilih berhasil dihapus.");
        setSelectedRisks([]);
        fetchData();
      });
    }
  };

  const handleSave = (updatedRisk) => {
    apiClient
      .put(`/risk-register/${updatedRisk.id}`, updatedRisk)
      .then(() => {
        fetchData(); // Muat ulang semua data untuk konsistensi
        setIsEditSidebarOpen(false);
      })
      .catch((err) => alert("Gagal menyimpan perubahan."));
  };

  return (
    <>
      <div className="p-6 sm:p-10 fullscreen-card" ref={tableCardRef}>
        <Title>Risk Register</Title>
        <TremorText>Centralized database for all identified risks</TremorText>

        <Card className="mt-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              {selectedRisks.length > 0 ? (
                <>
                  <Badge color="blue">{selectedRisks.length} selected</Badge>
                  <Button icon={FiTrash2} color="red" onClick={handleDeleteSelected}>
                    Delete ({selectedRisks.length})
                  </Button>
                </>
              ) : (
                <Badge color="blue">{sortedAndFilteredRisks.length} Items</Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <TextInput icon={FiSearch} placeholder="Search Risk..." className="w-60" value={searchTerm} onValueChange={setSearchTerm} />
              <Select className="w-52" value={sortOption} onValueChange={setSortOption}>
                {/* Options */}
              </Select>
              <Button variant="secondary" disabled>
                Projects
              </Button>
              <Button variant="secondary" icon={FiUpload} disabled>
                Import
              </Button>
              <Button variant="secondary" icon={FiDownload} disabled>
                Export
              </Button>
              <Button variant="light" icon={isFullscreen ? FiMinimize : FiMaximize} onClick={toggleFullscreen} />
            </div>
          </div>
        </Card>

        <Card className="mt-6">
          <div className="overflow-x-auto">
            {isLoading ? (
              <TremorText className="text-center p-4">Loading...</TremorText>
            ) : (
              <MainRiskRegisterTable risks={sortedAndFilteredRisks} selectedRisks={selectedRisks} onSelectRow={handleSelectRow} onEdit={handleEdit} onDelete={handleDelete} isAllSelected={isAllSelected} onSelectAll={handleSelectAll} />
            )}
          </div>
        </Card>
      </div>

      <EditRiskItemSidebar isOpen={isEditSidebarOpen} onClose={() => setIsEditSidebarOpen(false)} risk={editingRisk} onSave={handleSave} />
    </>
  );
}

export default RiskRegisterPage;
