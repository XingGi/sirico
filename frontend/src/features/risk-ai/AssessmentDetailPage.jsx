import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { Card, Title, Text, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Grid, Col, Badge, Button, Switch } from "@tremor/react";
import { FiDownload, FiFileText, FiMaximize, FiMinimize, FiAlertTriangle, FiInfo, FiZap } from "react-icons/fi";
import apiClient from "../../api/api"; // <-- PERUBAHAN: path diperbarui
import RiskCriteriaReference from "./components/RiskCriteriaReference"; // <-- PERUBAHAN: path diperbarui
import RiskResultsTable from "./components/RiskResultsTable"; // <-- PERUBAHAN: path diperbarui
import EditRiskItemSidebar from "./components/EditRiskItemSidebar"; // <-- PERUBAHAN: path diperbarui
import RiskMatrix from "./components/RiskMatrix"; // <-- PERUBAHAN: path diperbarui
import RiskSummary from "./components/RiskSummary"; // <-- PERUBAHAN: path diperbarui
import AIGeneratedAnalysis from "./components/AIGeneratedAnalysis";
// import { useAuth } from "../context/AuthContext";

function AssessmentDetailPage() {
  const { assessmentId } = useParams();
  const [assessment, setAssessment] = useState(null);
  const [assetOptions, setAssetOptions] = useState([]); // State untuk menyimpan pilihan asset
  const [industryOptions, setIndustryOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  // const { user } = useAuth();
  const [selectedRisks, setSelectedRisks] = useState([]); // Menyimpan ID risiko yang dipilih
  const [isFullscreen, setIsFullscreen] = useState(false);
  const tableCardRef = useRef(null); // Referensi ke Card tabel
  const [isEditSidebarOpen, setIsEditSidebarOpen] = useState(false);
  const [editingRisk, setEditingRisk] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Ambil data asesmen dan data master aset secara bersamaan
        const [assessmentRes, assetsRes, industryRes] = await Promise.all([apiClient.get(`/assessments/${assessmentId}`), apiClient.get("/master-data?category=COMPANY_ASSETS"), apiClient.get("/master-data?category=INDUSTRY")]);
        setAssessment(assessmentRes.data);
        setAssetOptions(assetsRes.data);
        setIndustryOptions(industryRes.data);
      } catch (error) {
        console.error("Gagal memuat detail asesmen:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [assessmentId]);

  const handleEditClick = (risk) => {
    setEditingRisk(risk); // Set data risiko yang akan di-pass ke sidebar
    setIsEditSidebarOpen(true); // Buka sidebar
  };

  // ↓↓↓ 4. Buat fungsi untuk menutup sidebar ↓↓↓
  const handleCloseSidebar = () => {
    setIsEditSidebarOpen(false);
    setEditingRisk(null); // Kosongkan data
  };

  // ↓↓↓ 5. Buat fungsi untuk mengupdate state setelah menyimpan ↓↓↓
  const handleSaveRisk = (updatedRisk) => {
    // Cari dan ganti data risiko yang lama dengan yang baru di state `assessment`
    setAssessment((prev) => ({
      ...prev,
      risks: prev.risks.map((r) => (r.id === updatedRisk.id ? updatedRisk : r)),
    }));
  };

  const handleSummaryLoaded = (newAnalysisData) => {
    setAssessment((prevData) => ({
      ...prevData,
      ...newAnalysisData, // Gabungkan data asesmen lama dengan data summary baru
    }));
  };

  if (isLoading) return <div className="p-10">Memuat Laporan Asesmen Risiko...</div>;
  if (!assessment) return <div className="p-10">Gagal memuat data asesmen.</div>;

  const formatNumber = (num) => (num ? new Intl.NumberFormat("id-ID").format(num) : "-");

  // Cari nilai 'value' yang sesuai untuk 'key' yang tersimpan di database
  const assetValueDisplay = assetOptions.find((opt) => opt.key === assessment.company_assets)?.value || assessment.company_assets;
  const industryDisplay = industryOptions.find((opt) => opt.key === assessment.company_industry)?.value || assessment.company_industry || "-";

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedRisks(assessment.risks.map((r) => r.id));
    } else {
      setSelectedRisks([]);
    }
  };

  const handleRowSelect = (riskId) => {
    setSelectedRisks((prev) => (prev.includes(riskId) ? prev.filter((id) => id !== riskId) : [...prev, riskId]));
  };

  const handleAddToRegister = async () => {
    if (selectedRisks.length === 0) return;
    try {
      await apiClient.post("/risk-register/import", { risk_ids: selectedRisks });
      alert(`Sukses! ${selectedRisks.length} risiko telah ditambahkan ke Risk Register Utama.`);
      setSelectedRisks([]); // Kosongkan pilihan setelah berhasil
    } catch (error) {
      alert("Gagal menambahkan risiko ke register.");
      console.error("Import error:", error);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      tableCardRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const isAllSelected = assessment?.risks.length > 0 && selectedRisks.length === assessment.risks.length;

  return (
    <>
      <div className="p-6 sm:p-10 bg-slate-50 min-h-full">
        <Title>Risk Assessment Results</Title>
        <Text>AI-powered comprehensive risk analysis and recommendations</Text>

        <Card className="mt-6 rounded-xl shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <Title>Risk Assessment Summary</Title>
              <Text>Assessment overview and key information</Text>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" icon={FiDownload} disabled>
                Download Excel
              </Button>
              <Button variant="secondary" icon={FiFileText} disabled>
                Download PDF
              </Button>
            </div>
          </div>

          <Grid numItemsLg={2} className="gap-x-12 gap-y-6 mt-6 border-t pt-6">
            {/* --- Kolom Kiri --- */}
            <Col>
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Assessment Info</h3>
                  <div className="mt-2 grid grid-cols-3 gap-4">
                    <div>
                      <Text>ID</Text>
                      <Text className="font-medium text-gray-800">RA-{assessment.id.toString().padStart(5, "0")}</Text>
                    </div>
                    <div>
                      <Text>Date</Text>
                      <Text className="font-medium text-gray-800">{assessment.tanggal_mulai}</Text>
                    </div>
                    <div>
                      <Text>Created by</Text>
                      <Text className="font-medium text-gray-800">{assessment.created_by_user_name || "N/A"}</Text>
                      <Text className="text-xs text-gray-500">{assessment.created_by_user_email || ""}</Text>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Project Context</h3>
                  <div className="mt-2 grid grid-cols-1 gap-4">
                    <div>
                      <Text>Objective</Text>
                      <Text className="font-medium text-gray-800">{assessment.project_objective || "-"}</Text>
                    </div>
                    <div>
                      <Text>Involved Units</Text>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {assessment.involved_departments?.split(",").map((unit) => (
                          <Badge key={unit} color="green">
                            {unit.trim()}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Col>

            {/* --- Kolom Kanan --- */}
            <Col>
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Company Info</h3>
                  <div className="mt-2 grid grid-cols-2 gap-4">
                    <div>
                      <Text>Type</Text>
                      <Badge color="blue">{assessment.company_type || "-"}</Badge>
                    </div>
                    <div>
                      <Text>Industry</Text>
                      <Badge color="blue">{industryDisplay}</Badge>
                    </div>
                    <div>
                      <Text>Asset Value</Text>
                      <Badge color="blue">{assetValueDisplay || "-"}</Badge>
                    </div>
                    <div>
                      <Text>Risk Limit</Text>
                      <Text className="font-medium text-gray-800">Rp {formatNumber(assessment.risk_limit)}</Text>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Project Context</h3>
                  <div className="mt-2 grid grid-cols-1 gap-4">
                    <div>
                      <Text>Regulations</Text>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {assessment.relevant_regulations?.split(",").map((reg) => (
                          <Badge key={reg} color="amber">
                            {reg.trim()}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Text>Actions Taken</Text>
                      <Text className="font-medium text-gray-800">{assessment.completed_actions || "-"}</Text>
                    </div>
                  </div>
                </div>
              </div>
            </Col>
          </Grid>

          <div className="mt-6 border-t pt-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Risk Types</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {assessment.risk_categories?.split(",").map((cat) => (
                <Badge key={cat} color="rose">
                  {cat.trim()}
                </Badge>
              ))}
            </div>
          </div>
        </Card>

        <div className="mt-6">
          <RiskCriteriaReference riskLimit={assessment.risk_limit} />
        </div>

        <Card className="mt-6 rounded-xl shadow-lg fullscreen-card" ref={tableCardRef}>
          <div className="flex justify-between items-center">
            <div>
              <Title>Risk Assessment Results</Title>
              <Text>Detailed analysis of identified risks. Total: {assessment.risks?.length || 0} risks.</Text>
            </div>
            {/* === TOMBOL AKSI BARU DI SINI === */}
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Switch id="select-all" checked={isAllSelected} onChange={handleSelectAll} />
                <label htmlFor="select-all" className="text-sm cursor-pointer">
                  Select All ({selectedRisks.length})
                </label>
              </div>
              <Button variant="secondary" onClick={handleAddToRegister} disabled={selectedRisks.length === 0}>
                Add to Risk Register ({selectedRisks.length})
              </Button>
              <Button variant="light" icon={isFullscreen ? FiMinimize : FiMaximize} onClick={toggleFullscreen}>
                {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto mt-11">
            <RiskResultsTable risks={assessment.risks} selectedRisks={selectedRisks} onRowSelect={handleRowSelect} onEditClick={handleEditClick} />
          </div>
        </Card>

        <RiskMatrix risks={assessment.risks} />

        <RiskSummary risks={assessment.risks} />

        <AIGeneratedAnalysis analysisData={assessment} assessmentId={assessment.id} onSummaryLoaded={handleSummaryLoaded} />

        <Card className="mt-6 rounded-xl bg-orange-50 border border-orange-200">
          <div className="flex items-center gap-3">
            <FiAlertTriangle className="w-6 h-6 text-orange-500" />
            <div>
              <Title className="text-orange-800">Important Disclaimer</Title>
              <Text className="text-orange-700">Legal and usage considerations</Text>
            </div>
          </div>

          <Card className="mt-4 rounded-xl shadow-lg">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <FiInfo className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <Title>Assessment Limitations & Recommendations</Title>
                <Text className="mt-2 text-tremor-default text-tremor-content">
                  Assessment ini memberikan gambaran awal mengenai profil risiko organisasi Anda, berdasarkan input yang tersedia saat ini. Namun, setiap organisasi memiliki konteks dan dinamika yang unik. Pastikan untuk mereview kembali
                  hasil ini secara internal, dan lakukan penyesuaian bila diperlukan agar selaras dengan situasi aktual di lapangan. Bila hasil tampak tidak sesuai, evaluasi kembali input yang digunakan untuk mendapatkan gambaran yang lebih
                  akurat.
                </Text>
                <div className="mt-3 p-3 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 rounded-md flex items-start gap-2">
                  <FiZap className="flex-shrink-0 w-5 h-5 mt-1" />
                  <Text className="text-yellow-800">
                    <span className="font-semibold">Pro Tip:</span> Untuk hasil optimal, lakukan review berkala dan update assessment sesuai perubahan kondisi bisnis.
                  </Text>
                </div>
              </div>
            </div>
          </Card>
        </Card>
      </div>
      <EditRiskItemSidebar risk={editingRisk} isOpen={isEditSidebarOpen} onClose={handleCloseSidebar} onSave={handleSaveRisk} />
    </>
  );
}

export default AssessmentDetailPage;
