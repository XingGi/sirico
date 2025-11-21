// frontend/src/features/risk-management/madya/MadyaAssessmentFormPage.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Title, Text, Card, Button, Badge } from "@tremor/react";
import { debounce } from "lodash";
import { useParams, useNavigate } from "react-router-dom";
import { FiShield, FiArrowLeft, FiSave, FiLoader } from "react-icons/fi";
import apiClient from "../../../api/api";
import StrukturOrganisasiCard from "./components/StrukturOrganisasiCard";
import MadyaCriteriaReference from "./components/MadyaCriteriaReference";
import SasaranKPIAppetiteCard from "./components/SasaranKPIAppetiteCard";
import RiskInputCard from "./components/RiskInputCard";
import RiskMapCard from "./components/RiskMapCard";
import { FiMaximize, FiMinimize } from "react-icons/fi";
import { toast } from "sonner";

function MadyaAssessmentFormPage() {
  const { assessmentId: idParam } = useParams();
  const navigate = useNavigate();
  const [assessmentId, setAssessmentId] = useState(null);
  const [assessmentData, setAssessmentData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sasaranKPIEntries, setSasaranKPIEntries] = useState([]);
  const [currentStructureEntries, setCurrentStructureEntries] = useState([]);
  const [selectedTemplateData, setSelectedTemplateData] = useState(null);
  const [isTemplateDetailLoading, setIsTemplateDetailLoading] = useState(false);
  const [riskInputEntries, setRiskInputEntries] = useState([]);
  const [isRiskInputLoading, setIsRiskInputLoading] = useState(true);
  const criteriaCardRef = useRef(null);
  const [isCriteriaFullscreen, setIsCriteriaFullscreen] = useState(false);
  const [probabilityCriteria, setProbabilityCriteria] = useState([]);
  const [impactCriteria, setImpactCriteria] = useState([]);

  // Fungsi untuk fetch detail template berdasarkan ID
  const fetchTemplateDetails = useCallback(async (templateId) => {
    if (!templateId) {
      setSelectedTemplateData(null);
      return;
    }
    setIsTemplateDetailLoading(true);
    try {
      const response = await apiClient.get(`/risk-maps/${templateId}`);
      setSelectedTemplateData(response.data);
    } catch (error) {
      console.error(`Gagal memuat detail template ${templateId}:`, error);
      setSelectedTemplateData(null);
      toast.error(`Gagal memuat detail template.`);
    } finally {
      setIsTemplateDetailLoading(false);
    }
  }, []);

  const [filters, setFilters] = useState({
    organisasi: "",
    direktorat: "",
    divisi: "",
    departemen: "",
  });

  const debouncedSaveFilters = useRef(null);

  const saveFilters = useCallback(
    async (currentFilters) => {
      if (!assessmentId) return;
      try {
        await apiClient.put(`/madya-assessments/${assessmentId}/filters`, {
          filter_organisasi: currentFilters.organisasi,
          filter_direktorat: currentFilters.direktorat,
          filter_divisi: currentFilters.divisi,
          filter_departemen: currentFilters.departemen,
        });
      } catch (error) {
        console.error("Gagal menyimpan filter:", error);
      }
    },
    [assessmentId]
  );

  useEffect(() => {
    debouncedSaveFilters.current = debounce((currentFilters) => saveFilters(currentFilters), 1500);
  }, [saveFilters]);

  const handleFilterChange = useCallback((name, value) => {
    setFilters((prevFilters) => {
      const newFilters = { ...prevFilters, [name]: value };
      debouncedSaveFilters.current(newFilters);
      return newFilters;
    });
  }, []);

  const fetchRiskInputs = useCallback(async (id) => {
    setIsRiskInputLoading(true);
    try {
      const riskResponse = await apiClient.get(`/madya-assessments/${id}/risk-inputs`);
      setRiskInputEntries(riskResponse.data || []);
    } catch (error) {
      console.error("Gagal memuat data Risk Input:", error);
      setRiskInputEntries([]);
    } finally {
      setIsRiskInputLoading(false);
    }
  }, []);

  const handleSasaranChange = (data, action) => {
    setSasaranKPIEntries((prevEntries) => {
      if (action === "add") {
        toast.success("Sasaran/KPI berhasil ditambahkan.");
        return [...prevEntries, data];
      }
      if (action === "update") {
        toast.success("Target level berhasil diperbarui.");
        return prevEntries.map((item) => (item.id === data.id ? data : item));
      }
      if (action === "delete") {
        toast.success("Sasaran/KPI berhasil dihapus.");
        return prevEntries.filter((item) => item.id !== data.id);
      }
      return prevEntries;
    });
  };

  useEffect(() => {
    const loadAssessmentData = async () => {
      setIsLoading(true);
      const parsedId = parseInt(idParam, 10);

      if (isNaN(parsedId)) {
        toast.error("ID Asesmen tidak valid.");
        navigate("/risk-management/madya");
        setIsLoading(false);
        return;
      }
      setAssessmentId(parsedId);
      await fetchData(parsedId);
    };

    const fetchData = async (id) => {
      try {
        const [assessmentRes] = await Promise.all([apiClient.get(`/madya-assessments/${id}`)]);
        setAssessmentData(assessmentRes.data);
        setCurrentStructureEntries(assessmentRes.data.structure_entries || []);

        setProbabilityCriteria(assessmentRes.data.probability_criteria || []);
        setImpactCriteria(assessmentRes.data.impact_criteria || []);

        await fetchSasaranKPI(id);
        await fetchRiskInputs(id);

        setFilters({
          organisasi: assessmentRes.data.filter_organisasi || "",
          direktorat: assessmentRes.data.filter_direktorat || "",
          divisi: assessmentRes.data.filter_divisi || "",
          departemen: assessmentRes.data.filter_departemen || "",
        });

        const templateIdFromAssessment = assessmentRes.data.risk_map_template_id;
        if (templateIdFromAssessment) {
          await fetchTemplateDetails(templateIdFromAssessment);
        } else {
          setSelectedTemplateData(null);
          toast.warning("Asesmen ini tidak terhubung dengan template peta risiko.");
        }
      } catch (error) {
        console.error("Gagal memuat data asesmen madya:", error);
        toast.error("Gagal memuat data asesmen.");
        setAssessmentData(null);
        setSasaranKPIEntries([]);
        setCurrentStructureEntries([]);
        setSelectedTemplateData(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadAssessmentData();
  }, [idParam, navigate, fetchTemplateDetails, fetchRiskInputs]);

  const refreshCriteriaData = async () => {
    if (!assessmentId) return;
    try {
      const assessmentRes = await apiClient.get(`/madya-assessments/${assessmentId}`);
      setProbabilityCriteria(assessmentRes.data.probability_criteria || []);
      setImpactCriteria(assessmentRes.data.impact_criteria || []);
    } catch (error) {
      console.error("Gagal me-refresh kriteria:", error);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsCriteriaFullscreen(false);
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleCriteriaFullscreen = () => {
    if (!document.fullscreenElement) {
      criteriaCardRef.current?.requestFullscreen();
      setIsCriteriaFullscreen(true);
    } else {
      document.exitFullscreen();
    }
  };

  const handleStructureEntriesChange = (newEntries) => {
    setCurrentStructureEntries(newEntries);
  };

  const handleRiskInputSave = (responseData, isUpdate) => {
    if (!responseData || !responseData.entry) {
      fetchRiskInputs(assessmentId);
      fetchSasaranKPI(assessmentId);
      toast.success(isUpdate ? "Risk Input berhasil diperbarui." : "Risk Input berhasil ditambahkan.");
      return;
    }

    const savedEntry = responseData.entry;
    const updatedSasaran = responseData.updated_sasaran;

    setRiskInputEntries((prevEntries) => {
      if (isUpdate) {
        return prevEntries.map((item) => (item.id === savedEntry.id ? savedEntry : item));
      } else {
        return [...prevEntries, savedEntry];
      }
    });

    if (updatedSasaran) {
      setSasaranKPIEntries((prevSasaran) => {
        return prevSasaran.map((item) => (item.id === updatedSasaran.id ? updatedSasaran : item));
      });
    }
  };

  const fetchSasaranKPI = useCallback(async (id) => {
    try {
      const sasaranRes = await apiClient.get(`/madya-assessments/${id}/sasaran-kpi`);
      setSasaranKPIEntries(sasaranRes.data || []);
    } catch (error) {
      console.error("Gagal refresh data Sasaran KPI:", error);
    }
  }, []);

  const isPageLoading = isLoading || isTemplateDetailLoading || isRiskInputLoading;

  if (isPageLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen gap-4">
        <FiLoader className="animate-spin h-10 w-10 text-blue-600" />
        <Text>Memuat data asesmen madya...</Text>
      </div>
    );
  }

  if (!assessmentData) {
    return (
      <div className="p-10 text-center">
        <Text className="text-red-600">Gagal memuat data asesmen.</Text>
        <Button onClick={() => navigate("/risk-management/madya")} className="mt-4">
          Kembali
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-10 mx-auto space-y-8 bg-slate-50 min-h-screen">
      {/* --- HEADER SECTION (Updated Style) --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-6">
        <div className="flex items-center gap-4">
          <Button variant="light" icon={FiArrowLeft} onClick={() => navigate("/risk-management/madya")} title="Kembali ke daftar" />
          <div>
            <div className="flex items-center gap-2">
              <Title className="text-2xl text-slate-800">{assessmentData?.nama_asesmen || "Asesmen Madya"}</Title>
              <Badge className="rounded-md" color="blue">
                Mode Edit
              </Badge>
            </div>
            <Text className="text-slate-500 mt-1">Lengkapi detail asesmen risiko tingkat madya.</Text>
          </div>
        </div>
        <div className="flex gap-3 items-center">
          {/* Tampilkan Nama Template yang Digunakan */}
          <div className="hidden md:block bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 mr-2">
            <Text className="text-xs text-blue-600 font-medium">Template: {selectedTemplateData ? selectedTemplateData.name : "..."}</Text>
          </div>
          <Button variant="secondary" color="slate" onClick={() => navigate("/risk-management/madya")} className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors">
            Tutup
          </Button>
          <Button icon={FiSave} onClick={() => toast.success("Data tersimpan otomatis.")} className="rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all transform hover:-translate-y-0.5">
            Simpan
          </Button>
        </div>
      </div>

      <div className="space-y-8">
        {/* Card 1: Struktur Organisasi */}
        <StrukturOrganisasiCard assessmentId={assessmentId} initialData={currentStructureEntries} initialImageUrl={assessmentData?.structure_image_url} onDataChange={handleStructureEntriesChange} />

        {/* Card 2: Kriteria Risiko */}
        <Card ref={criteriaCardRef} className={`border-l-4 border-purple-500 shadow-md ring-1 ring-gray-100 bg-slate-50 ${isCriteriaFullscreen ? "fixed inset-0 z-50 h-screen overflow-auto m-0 rounded-none" : "relative"}`}>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                <FiShield size={24} /> {/* Bisa diganti ikon lain jika mau */}
              </div>
              <div>
                <Title>2. Kriteria Risiko</Title>
                <Text>Kriteria probabilitas dan dampak khusus asesmen ini.</Text>
              </div>
            </div>
            <Button type="button" variant="light" icon={isCriteriaFullscreen ? FiMinimize : FiMaximize} onClick={toggleCriteriaFullscreen} title={isCriteriaFullscreen ? "Exit Fullscreen" : "Fullscreen"} />
          </div>
          <MadyaCriteriaReference probabilityCriteria={probabilityCriteria} impactCriteria={impactCriteria} onCriteriaSave={refreshCriteriaData} readOnly={false} />
        </Card>

        {/* Card 3: Sasaran/KPI */}
        {assessmentId && <SasaranKPIAppetiteCard assessmentId={assessmentId} initialData={sasaranKPIEntries || []} onSasaranChange={handleSasaranChange} />}

        {/* Card 4: Risk Input */}
        {assessmentId && (
          <RiskInputCard
            assessmentId={assessmentId}
            structureEntries={currentStructureEntries}
            sasaranKPIEntries={sasaranKPIEntries || []}
            templateScores={selectedTemplateData?.scores || []}
            onRiskInputSaveSuccess={handleRiskInputSave}
            initialFilters={filters}
            onFilterChange={handleFilterChange}
            initialRiskInputData={riskInputEntries}
            isDataLoading={isRiskInputLoading}
          />
        )}

        {/* Card 5: Peta Risiko */}
        {assessmentId && !isPageLoading && <RiskMapCard risks={riskInputEntries} templateData={selectedTemplateData} />}
      </div>
    </div>
  );
}

export default MadyaAssessmentFormPage;
