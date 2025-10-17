// frontend/src/pages/AssessmentListPage.jsx

import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Title, Text, TextInput, Select, SelectItem, Button, Switch, Grid } from "@tremor/react";
import { FiPlus, FiGrid, FiList, FiSearch } from "react-icons/fi"; // Tambahkan FiList
import apiClient from "../api";
import AssessmentItem from "../components/AssessmentItem";

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
  const [selectedAssessments, setSelectedAssessments] = useState([]);

  // --- STATE BARU UNTUK FILTER & VIEW ---
  const [selectedRiskLevel, setSelectedRiskLevel] = useState("all");
  const [viewMode, setViewMode] = useState("list"); // 'list' atau 'grid'

  useEffect(() => {
    // ... (useEffect untuk fetch data tidak berubah)
    const fetchData = async () => {
      try {
        const [assessmentRes, industryRes] = await Promise.all([apiClient.get("/assessments"), apiClient.get("/master-data?category=INDUSTRY")]);
        setAssessments(assessmentRes.data);
        setIndustryOptions(industryRes.data);
      } catch (error) {
        console.error("Gagal memuat data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

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
          <div className="flex items-center gap-2 mt-2">
            <Switch id="selectAll" checked={isAllSelected} onChange={handleSelectAll} />
            <label htmlFor="selectAll" className="text-sm text-tremor-content">
              Select All ({selectedAssessments.length})
            </label>
          </div>
          <Text className="mt-1">
            Showing {filteredAssessments.length} of {assessments.length} assessments
          </Text>
        </div>
        <div className="flex items-center gap-2">
          {/* Tombol View Toggle */}
          <Button icon={viewMode === "list" ? FiGrid : FiList} variant="light" onClick={() => setViewMode((prev) => (prev === "list" ? "grid" : "list"))} />
          <Button icon={FiPlus} onClick={() => navigate("/assessment-studio")}>
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
                industryName={industryName} // Kirim nama lengkap sebagai prop
              />
            );
          })
        ) : (
          <Card className="mt-4 text-center">
            <Text>No assessments found matching your criteria.</Text>
          </Card>
        )}
      </div>
    </div>
  );
}

export default AssessmentListPage;
