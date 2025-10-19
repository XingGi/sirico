// frontend/src/features/risk-management/madya/MadyaAssessmentListPage.jsx
import React from "react";
import { Title, Text, Button } from "@tremor/react";
import { FiPlus } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

function MadyaAssessmentListPage() {
  const navigate = useNavigate();

  const handleNewAssessment = () => {
    // Nanti kita panggil API POST /madya-assessments dulu di sini
    // Untuk sekarang, kita arahkan langsung ke form (dengan ID dummy)
    navigate(`/risk-management/madya/form/new`); // Atau gunakan ID dari API nanti
  };

  return (
    <div className="p-6 sm:p-10">
      <div className="flex justify-between items-center">
        <div>
          <Title>Asesmen Madya</Title>
          <Text>Daftar asesmen risiko tingkat madya.</Text>
        </div>
        <Button icon={FiPlus} onClick={handleNewAssessment}>
          Asesmen Baru
        </Button>
      </div>
      {/* Nanti di sini kita tampilkan list asesmen yang sudah ada */}
      <div className="mt-6">
        <Text>Belum ada asesmen madya.</Text>
      </div>
    </div>
  );
}

export default MadyaAssessmentListPage;
