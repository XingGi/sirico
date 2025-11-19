// frontend/src/features/risk-management/madya/MadyaAssessmentFormPage.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Title, Text, Card, Button, Accordion, AccordionHeader, AccordionBody } from "@tremor/react";
import { debounce } from "lodash";
import { useParams, useNavigate } from "react-router-dom";
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
    console.log(`Fetching details for template ID: ${templateId}`);
    setIsTemplateDetailLoading(true);
    try {
      const response = await apiClient.get(`/risk-maps/${templateId}`);
      setSelectedTemplateData(response.data);
      console.log("Template details fetched:", response.data);
    } catch (error) {
      console.error(`Gagal memuat detail template ${templateId}:`, error);
      setSelectedTemplateData(null);
      alert(`Gagal memuat detail template (ID: ${templateId}). Perhitungan skor mungkin tidak akurat.`);
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

  // Fungsi untuk menyimpan filter ke backend
  const saveFilters = useCallback(
    async (currentFilters) => {
      if (!assessmentId) return;
      console.log("Saving filters:", currentFilters);
      try {
        await apiClient.put(`/madya-assessments/${assessmentId}/filters`, {
          filter_organisasi: currentFilters.organisasi,
          filter_direktorat: currentFilters.direktorat,
          filter_divisi: currentFilters.divisi,
          filter_departemen: currentFilters.departemen,
        });
        console.log("Filters saved successfully.");
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
      console.log("Risk Input data fetched/refreshed:", riskResponse.data);
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
    console.log(`State Sasaran di-update secara manual (action: ${action})`);
  };

  useEffect(() => {
    const loadAssessmentData = async () => {
      setIsLoading(true);
      const parsedId = parseInt(idParam, 10);

      if (isNaN(parsedId)) {
        console.error("ID Asesmen tidak valid di URL:", idParam);
        alert("ID Asesmen tidak valid.");
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
          console.warn(`Asesmen ID ${id} tidak memiliki template peta risiko terkait.`);
          setSelectedTemplateData(null);
          alert("Peringatan: Asesmen ini tidak terhubung dengan template peta risiko. Fungsi skor mungkin tidak bekerja.");
        }
      } catch (error) {
        console.error("Gagal memuat data asesmen madya:", error);
        alert("Gagal memuat data asesmen. Silakan coba lagi.");
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
      console.log("Data kriteria di-refresh.");
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

  // --- 4. Tambahkan fungsi toggle fullscreen ---
  const toggleCriteriaFullscreen = () => {
    if (!document.fullscreenElement) {
      criteriaCardRef.current?.requestFullscreen();
      setIsCriteriaFullscreen(true);
    } else {
      document.exitFullscreen();
    }
  };

  // Handler untuk update state struktur dari child
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

    // 1. Update state Risk Inputs secara manual
    setRiskInputEntries((prevEntries) => {
      if (isUpdate) {
        return prevEntries.map((item) => (item.id === savedEntry.id ? savedEntry : item));
      } else {
        return [...prevEntries, savedEntry];
      }
    });

    // 2. Update state Sasaran KPI jika ada yang berubah
    if (updatedSasaran) {
      setSasaranKPIEntries((prevSasaran) => {
        // Ganti item sasaran yang skornya baru di-update
        return prevSasaran.map((item) => (item.id === updatedSasaran.id ? updatedSasaran : item));
      });
    }

    console.log("State Sasaran & Risk Input di-update secara manual tanpa refresh API.");
  };

  // Fungsi fetch khusus Sasaran/KPI
  const fetchSasaranKPI = useCallback(async (id) => {
    try {
      const sasaranRes = await apiClient.get(`/madya-assessments/${id}/sasaran-kpi`);
      setSasaranKPIEntries(sasaranRes.data || []);
      console.log("Sasaran KPI data refreshed:", sasaranRes.data);
    } catch (error) {
      console.error("Gagal refresh data Sasaran KPI:", error);
    }
  }, []);

  // Kondisi loading gabungan
  const isPageLoading = isLoading || isTemplateDetailLoading || isRiskInputLoading;

  // Tampilan Loading
  if (isPageLoading) {
    return (
      <div className="p-10 text-center">
        <Text>Memuat asesmen madya dan data template...</Text>
      </div>
    );
  }

  if (!assessmentData) {
    return (
      <div className="p-10 text-center">
        <Text className="text-red-600">Gagal memuat data asesmen.</Text>
        <Text>Silakan coba lagi atau kembali ke daftar asesmen.</Text>
        <Button onClick={() => navigate("/risk-management/madya")} className="mt-4">
          Kembali
        </Button>
      </div>
    );
  }

  // Render Form Utama
  return (
    <div className="p-6 sm:p-10 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <Title>{assessmentData?.nama_asesmen ? `Asesmen: ${assessmentData.nama_asesmen}` : "Memuat Asesmen..."}</Title>
          <Text>Lengkapi detail asesmen risiko tingkat madya.</Text>
        </div>
        {/* Tampilkan Nama Template yang Digunakan */}
        <Card className="p-3 w-full sm:max-w-xs shrink-0" decoration="left" decorationColor="blue">
          <Text className="text-xs font-medium text-gray-600">Template Digunakan:</Text>
          <Text className="font-semibold text-tremor-content-strong">
            {selectedTemplateData ? selectedTemplateData.name : "Memuat..."}
            {selectedTemplateData?.is_default ? " (Default)" : ""}
          </Text>
        </Card>
      </div>

      {/* Card 1: Struktur Organisasi */}
      <StrukturOrganisasiCard assessmentId={assessmentId} initialData={currentStructureEntries} initialImageUrl={assessmentData?.structure_image_url} onDataChange={handleStructureEntriesChange} />

      {/* Card 2: Kriteria Risiko */}
      <Card ref={criteriaCardRef} className="fullscreen-card">
        <div className="flex justify-between items-start mb-4">
          <div className="text-left">
            <Title as="h3">2. Kriteria Risiko</Title>
            <Text>Edit kriteria probabilitas dan dampak khusus untuk asesmen ini.</Text>
          </div>
          <Button
            type="button"
            variant="light"
            icon={isCriteriaFullscreen ? FiMinimize : FiMaximize}
            onClick={(e) => {
              toggleCriteriaFullscreen();
            }}
            className="mr-2"
          >
            {isCriteriaFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          </Button>
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

      {/* Tombol Aksi Bawah */}
      <div className="flex justify-end gap-2 mt-6">
        <Button variant="secondary" onClick={() => navigate("/risk-management/madya")}>
          Kembali (Keluar)
        </Button>
        <Button
          onClick={() => {
            console.log("Tombol 'Simpan & Lanjutkan' diklik, user tetap di halaman.");
            toast.success("Progress per bagian tersimpan otomatis. Anda tetap di halaman ini.");
          }}
        >
          Simpan & Lanjutkan (Nanti)
        </Button>
      </div>
    </div>
  );
}

export default MadyaAssessmentFormPage;
