// frontend/src/pages/AssessmentListPage.jsx

import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Title, Text, TextInput, Select, SelectItem, Button, Switch, Grid } from "@tremor/react";
import { FiPlus, FiGrid, FiList, FiSearch, FiTrash2, FiAlertTriangle, FiLoader } from "react-icons/fi";
import apiClient from "../../api/api";
import AssessmentItem from "./components/AssessmentItem";
import NotificationModal from "../../components/common/NotificationModal";
import ConfirmationDialog from "../../components/common/ConfirmationDialog";

// --- FUNGSI HELPER BARU (diambil dari RiskSummary.jsx) ---
const getLevelKeyByScore = (score) => {
  if (score >= 15) return "High";
  if (score >= 8) return "Moderate to High";
  if (score >= 4) return "Moderate";
  if (score >= 2) return "Low to Moderate";
  if (score > 0) return "Low";
  return null;
};

// --- DATA STATIS UNTUK FILTER ---
const riskLevelOptions = ["High", "Moderate to High", "Moderate", "Low to Moderate", "Low"];

function AssessmentListPage() {
  const [assessments, setAssessments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [industryOptions, setIndustryOptions] = useState([]);
  const [selectedIndustry, setSelectedIndustry] = useState("all");
  const [userLimits, setUserLimits] = useState(null);
  const [limitModal, setLimitModal] = useState({ isOpen: false, message: "" });
  const [selectedAssessments, setSelectedAssessments] = useState([]);

  // --- STATE BARU UNTUK FILTER & VIEW ---
  const [selectedRiskLevel, setSelectedRiskLevel] = useState("all");
  const [viewMode, setViewMode] = useState("list");

  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    isBulk: false,
    assessmentId: null,
    assessmentName: "",
    count: 0,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAssessmentsAndLimits = async () => {
    // Kita set isLoading di sini agar bisa dipanggil untuk refresh
    setIsLoading(true);
    try {
      const [assessmentRes, industryRes, limitsRes] = await Promise.all([apiClient.get("/assessments"), apiClient.get("/master-data?category=INDUSTRY"), apiClient.get("/account/details")]);
      setAssessments(assessmentRes.data);
      setIndustryOptions(industryRes.data);
      setUserLimits(limitsRes.data.assessment_limits);
    } catch (error) {
      console.error("Gagal memuat data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessmentsAndLimits();
  }, []);

  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       const [assessmentRes, industryRes, limitsRes] = await Promise.all([apiClient.get("/assessments"), apiClient.get("/master-data?category=INDUSTRY"), apiClient.get("/account/details")]);
  //       setAssessments(assessmentRes.data);
  //       setIndustryOptions(industryRes.data);
  //       setUserLimits(limitsRes.data.assessment_limits);
  //     } catch (error) {
  //       console.error("Gagal memuat data:", error);
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };
  //   fetchData();
  // }, []);

  // --- LOGIKA FILTER DIPERBARUI ---
  const filteredAssessments = useMemo(() => {
    // Fungsi untuk menghitung level risiko tertinggi dari sebuah assessment
    const getHighestRiskLevel = (assessment) => {
      if (!assessment.risks || assessment.risks.length === 0) return null;
      const maxScore = Math.max(...assessment.risks.map((r) => (r.inherent_likelihood || 0) * (r.inherent_impact || 0)));
      return getLevelKeyByScore(maxScore);
    };

    return assessments.filter((assessment) => {
      const matchesSearch = assessment.nama_asesmen.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesIndustry = selectedIndustry === "all" || assessment.company_industry === selectedIndustry;
      const matchesRiskLevel = selectedRiskLevel === "all" || getHighestRiskLevel(assessment) === selectedRiskLevel;
      return matchesSearch && matchesIndustry && matchesRiskLevel;
    });
  }, [assessments, searchTerm, selectedIndustry, selectedRiskLevel]);

  // ... (Handler untuk checkbox tidak berubah)
  const handleSelect = (id) => {
    setSelectedAssessments((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedAssessments(filteredAssessments.map((a) => a.id));
    } else {
      setSelectedAssessments([]);
    }
  };
  const isAllSelected = filteredAssessments.length > 0 && selectedAssessments.length === filteredAssessments.length;

  const handleNewAssessmentClick = () => {
    if (!userLimits) {
      alert("Sedang memuat data limit, silakan coba lagi sesaat.");
      return;
    }

    const currentCount = assessments.length;
    const limit = userLimits.ai?.limit;

    if (limit !== null && currentCount >= limit) {
      setLimitModal({
        isOpen: true,
        message: `Batas pembuatan Asesmen AI Anda telah tercapai (${currentCount}/${limit}). Hubungi admin untuk menambah kuota.`,
      });
    } else {
      navigate("/risk-ai/assessment-studio");
    }
  };

  const openSingleDeleteConfirm = (id, name) => {
    setDeleteConfirm({ isOpen: true, isBulk: false, assessmentId: id, assessmentName: name, count: 1 });
  };

  const openBulkDeleteConfirm = () => {
    setDeleteConfirm({
      isOpen: true,
      isBulk: true,
      assessmentId: null,
      assessmentName: "",
      count: selectedAssessments.length,
    });
  };

  const closeDeleteConfirm = () => {
    setDeleteConfirm({ isOpen: false, assessmentId: null, assessmentName: "" });
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);

    if (deleteConfirm.isBulk) {
      try {
        const response = await apiClient.post("/assessments/bulk-delete", {
          risk_ids: selectedAssessments,
        });
        alert(response.data.msg || "Asesmen terpilih berhasil dihapus.");
        closeDeleteConfirm();
        setSelectedAssessments([]); // <-- Kosongkan pilihan
        fetchAssessmentsAndLimits(); // <-- Refresh data
      } catch (error) {
        console.error("Gagal bulk delete:", error);
        alert(error.response?.data?.msg || "Gagal menghapus asesmen.");
      }
    } else {
      if (!deleteConfirm.assessmentId) {
        setIsDeleting(false);
        return;
      }
      try {
        const response = await apiClient.delete(`/assessments/${deleteConfirm.assessmentId}`);
        alert(response.data.msg || "Asesmen berhasil dihapus.");
        closeDeleteConfirm();
        fetchAssessmentsAndLimits();
      } catch (error) {
        console.error("Gagal menghapus asesmen:", error);
        alert(error.response?.data?.msg || "Gagal menghapus asesmen.");
      }
    }

    setIsDeleting(false);
  };

  return (
    <div className="p-6 sm:p-10">
      <Title>Risk Assessment</Title>
      <Text>Manage and monitor all risk assessments</Text>

      {/* --- Filter Bar Diperbarui --- */}
      <Card className="mt-6">
        <Grid numItemsSm={1} numItemsMd={3} className="gap-6">
          <TextInput icon={FiSearch} placeholder="Search assessments..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
            <SelectItem value="all">All Industries</SelectItem>
            {industryOptions.map((opt) => (
              <SelectItem key={opt.key} value={opt.key}>
                {opt.value}
              </SelectItem>
            ))}
          </Select>
          {/* Filter Risk Level sekarang aktif */}
          <Select value={selectedRiskLevel} onValueChange={setSelectedRiskLevel}>
            <SelectItem value="all">All Risk Levels</SelectItem>
            {riskLevelOptions.map((level) => (
              <SelectItem key={level} value={level}>
                {level}
              </SelectItem>
            ))}
          </Select>
        </Grid>
      </Card>

      {/* --- Header Daftar Asesmen Diperbarui --- */}
      <div className="mt-6 flex justify-between items-center">
        <div>
          <Title as="h3">All Risk Assessments</Title>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center space-x-2">
              <Switch id="selectAll" checked={isAllSelected} onChange={handleSelectAll} />
              <label htmlFor="selectAll" className="text-sm cursor-pointer">
                Select All ({selectedAssessments.length})
              </label>
            </div>

            {selectedAssessments.length > 0 && (
              <Button
                icon={FiTrash2}
                color="rose"
                variant="light"
                size="xs"
                onClick={openBulkDeleteConfirm} // <-- Panggil handler baru
                loading={isDeleting && deleteConfirm.isBulk} // <-- Loading jika bulk
                disabled={isDeleting}
              >
                Delete Selected ({selectedAssessments.length})
              </Button>
            )}
          </div>
          <Text className="mt-1">
            Showing {filteredAssessments.length} of {assessments.length} assessments
          </Text>
        </div>
        <div className="flex items-center gap-2">
          {/* Tombol View Toggle */}
          <Button icon={viewMode === "list" ? FiGrid : FiList} variant="light" onClick={() => setViewMode((prev) => (prev === "list" ? "grid" : "list"))} />
          <Button icon={FiPlus} onClick={handleNewAssessmentClick} disabled={isLoading || !userLimits}>
            New Assessment
          </Button>
        </div>
      </div>

      {/* --- Daftar Asesmen Diperbarui dengan Tampilan Dinamis --- */}
      <div className={`mt-4 ${viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : ""}`}>
        {isLoading ? (
          <Text>Loading data...</Text>
        ) : filteredAssessments.length > 0 ? (
          filteredAssessments.map((assessment) => {
            // Cari nama industri yang sesuai
            const industry = industryOptions.find((opt) => opt.key === assessment.company_industry);
            const industryName = industry ? industry.value : assessment.company_industry;

            return (
              <AssessmentItem
                key={assessment.id}
                assessment={assessment}
                isSelected={selectedAssessments.includes(assessment.id)}
                onSelect={handleSelect}
                industryName={industryName}
                onDelete={() => openSingleDeleteConfirm(assessment.id, assessment.nama_asesmen)}
                isDeleting={isDeleting && !deleteConfirm.isBulk && deleteConfirm.assessmentId === assessment.id}
              />
            );
          })
        ) : (
          <Card className="mt-4 text-center">
            <Text>No assessments found matching your criteria.</Text>
          </Card>
        )}
      </div>
      <NotificationModal isOpen={limitModal.isOpen} onClose={() => setLimitModal({ isOpen: false, message: "" })} title="Batas Kuota Tercapai" message={limitModal.message} />
      <ConfirmationDialog
        isOpen={deleteConfirm.isOpen}
        onClose={closeDeleteConfirm}
        onConfirm={handleConfirmDelete}
        // Judul dan pesan dinamis berdasarkan mode (bulk atau single)
        title={deleteConfirm.isBulk ? "Konfirmasi Hapus Massal" : "Konfirmasi Hapus Asesmen"}
        message={
          deleteConfirm.isBulk
            ? `Apakah Anda yakin ingin menghapus ${deleteConfirm.count} asesmen terpilih? Tindakan ini tidak dapat dibatalkan.`
            : `Apakah Anda yakin ingin menghapus asesmen "${deleteConfirm.assessmentName}"? Semua data risiko di dalamnya akan ikut terhapus.`
        }
        isLoading={isDeleting}
      />
    </div>
  );
}

export default AssessmentListPage;
