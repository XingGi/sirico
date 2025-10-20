// frontend/src/features/risk-management/madya/MadyaAssessmentFormPage.jsx
import React, { useState, useEffect } from "react";
import { Title, Text, Card, Button, Accordion, AccordionHeader, AccordionBody } from "@tremor/react";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "../../../api/api";
import StrukturOrganisasiCard from "./components/StrukturOrganisasiCard";
import MadyaCriteriaReference from "./components/MadyaCriteriaReference";
import SasaranKPIAppetiteCard from "./components/SasaranKPIAppetiteCard";

function MadyaAssessmentFormPage() {
  const { assessmentId: idParam } = useParams(); // 'new' atau ID angka
  const navigate = useNavigate();
  const [assessmentId, setAssessmentId] = useState(null);
  const [assessmentData, setAssessmentData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sasaranKPIEntries, setSasaranKPIEntries] = useState([]);

  useEffect(() => {
    const initializeAssessment = async () => {
      if (idParam === "new") {
        try {
          const response = await apiClient.post("/madya-assessments");
          const newId = response.data.id;
          setAssessmentId(newId);
          // Ganti URL tanpa reload halaman
          navigate(`/risk-management/madya/form/${newId}`, { replace: true });
          // Fetch data awal (kosong)
          fetchData(newId);
        } catch (error) {
          console.error("Gagal memulai asesmen madya baru:", error);
          alert("Gagal memulai asesmen baru.");
          navigate("/risk-management/madya");
        }
      } else {
        setAssessmentId(parseInt(idParam));
        fetchData(parseInt(idParam));
      }
    };

    const fetchData = async (id) => {
      setIsLoading(true);
      try {
        // --- Modifikasi: Fetch data sasaran KPI juga ---
        const [assessmentRes, sasaranRes] = await Promise.all([
          apiClient.get(`/madya-assessments/${id}`),
          apiClient.get(`/madya-assessments/${id}/sasaran-kpi`), // <-- Panggil API GET sasaran
        ]);
        setAssessmentData(assessmentRes.data);
        setSasaranKPIEntries(sasaranRes.data); // <-- Simpan data sasaran ke state baru
      } catch (error) {
        console.error("Gagal memuat data asesmen madya:", error);
        alert("Gagal memuat data asesmen.");
        // Handle error (e.g., redirect)
      } finally {
        setIsLoading(false);
      }
    };

    initializeAssessment();
  }, [idParam, navigate]);

  const refreshData = () => {
    if (assessmentId) {
      // Kita bisa buat fungsi fetch terpisah atau panggil ulang fetchData
      const fetchDataAgain = async (id) => {
        setIsLoading(true); // Tampilkan loading lagi saat refresh
        try {
          const [assessmentRes, sasaranRes] = await Promise.all([apiClient.get(`/madya-assessments/${id}`), apiClient.get(`/madya-assessments/${id}/sasaran-kpi`)]);
          setAssessmentData(assessmentRes.data);
          setSasaranKPIEntries(sasaranRes.data);
        } catch (error) {
          console.error("Gagal refresh data:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchDataAgain(assessmentId);
    }
  };

  if (isLoading || !assessmentData) {
    return (
      <div className="p-10">
        <Text>Memuat asesmen madya...</Text>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-10 space-y-6">
      <Title>Form Asesmen Madya</Title>
      <Text>Lengkapi detail asesmen risiko tingkat madya.</Text>

      {/* Card 1: Struktur Organisasi */}
      <StrukturOrganisasiCard
        assessmentId={assessmentId}
        initialData={assessmentData.structure_entries || []}
        initialImageUrl={assessmentData.structure_image_url}
        onDataChange={refreshData} // Fungsi untuk memuat ulang data setelah perubahan
      />

      <Card>
        <Accordion>
          <AccordionHeader>
            <div className="flex-1 text-left">
              <Title as="h3">2. Kriteria Risiko</Title>
              <Text>Klik untuk melihat acuan penilaian probabilitas dan dampak.</Text>
            </div>
          </AccordionHeader>
          <AccordionBody>
            <MadyaCriteriaReference />
          </AccordionBody>
        </Accordion>
      </Card>

      <SasaranKPIAppetiteCard
        assessmentId={assessmentId}
        initialData={sasaranKPIEntries} // <-- Pass data dari state
        onDataChange={refreshData} // <-- Pass fungsi refresh
      />

      {/* Card 4, dst. akan ditambahkan di sini nanti */}

      <div className="flex justify-end gap-2 mt-6">
        <Button variant="secondary" onClick={() => navigate("/risk-management/madya")}>
          Kembali
        </Button>
        <Button onClick={() => navigate("/risk-management/madya")}>Simpan & Lanjutkan (Nanti)</Button>
      </div>
    </div>
  );
}

export default MadyaAssessmentFormPage;
