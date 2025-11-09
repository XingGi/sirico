// frontend/src/components/AIGeneratedAnalysis.jsx

import React, { useState, useEffect } from "react";
import { Card, Title, Text, Accordion, AccordionHeader, AccordionBody, Flex, Icon } from "@tremor/react";
import { FiCpu, FiAlertOctagon, FiChevronsRight, FiZap, FiClipboard, FiTrendingUp, FiArrowRight, FiLoader, FiAlertCircle } from "react-icons/fi";
import apiClient from "../../../api/api";

// Komponen kecil untuk setiap seksi agar lebih rapi
const AnalysisSection = ({ icon, title, children }) => (
  <div className="py-4">
    <div className="flex items-center gap-3">
      <div className="flex-shrink-0 text-gray-500">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
    </div>
    <div className="mt-2 pl-8 text-tremor-default text-tremor-content">{children}</div>
  </div>
);

function AIGeneratedAnalysis({ analysisData, assessmentId, onSummaryLoaded }) {
  // const [analysis, setAnalysis] = useState(analysisData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Cek apakah data summary *belum* ada
    if (analysisData && !analysisData.ai_executive_summary) {
      console.log("Summary tidak ditemukan. Memulai fetch summary untuk Asesmen ID:", assessmentId);
      setIsLoading(true);
      setError(null);

      const fetchSummary = async () => {
        try {
          // Panggil API baru yang kita buat di backend
          const response = await apiClient.post(`/assessments/${assessmentId}/generate-summary`);
          // Update state lokal dengan data summary yang baru diterima
          onSummaryLoaded(response.data);
        } catch (err) {
          console.error("Gagal memuat AI Summary:", err);
          setError(err.response?.data?.msg || "AI gagal membuat ringkasan eksekutif.");
        } finally {
          setIsLoading(false);
        }
      };

      fetchSummary();
    }
  }, [assessmentId, analysisData, onSummaryLoaded]);

  const { ai_executive_summary, ai_risk_profile_analysis, ai_immediate_priorities, ai_critical_risks_discussion, ai_implementation_plan, ai_next_steps } = analysisData || {};

  // --- Tampilan saat Loading (Panggilan AI ke-2) ---
  if (isLoading) {
    return (
      <Card className="mt-6 rounded-xl shadow-lg">
        <Flex justifyContent="center" alignItems="center" className="space-x-3 py-10">
          <Icon icon={FiLoader} className="animate-spin" size="lg" color="blue" />
          <div className="text-left">
            <Title className="text-tremor-content-strong">AI Sedang Bekerja</Title>
            <Text>Menulis ringkasan eksekutif dan rekomendasi... (Ini bisa memakan waktu hingga 30 detik)</Text>
          </div>
        </Flex>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mt-6 rounded-xl shadow-lg bg-rose-50 border-rose-200">
        <Flex justifyContent="center" alignItems="center" className="space-x-3 py-10">
          <Icon icon={FiAlertCircle} size="lg" color="rose" />
          <div className="text-left">
            <Title className="text-rose-800">Gagal Membuat Ringkasan</Title>
            <Text className="text-rose-700">{error}</Text>
          </div>
        </Flex>
      </Card>
    );
  }

  if (!ai_executive_summary) {
    return null;
  }

  return (
    <Card className="mt-6 rounded-xl shadow-lg">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
          <FiCpu className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <Title>AI-Generated Analysis</Title>
          <Text>Intelligent risk assessment conclusions and recommendations.</Text>
        </div>
      </div>

      <Accordion className="mt-4">
        <AccordionHeader>
          <div className="flex items-center gap-2">
            <FiAlertOctagon className="w-5 h-5 text-gray-500" />
            <span className="font-semibold">AI Analysis & Conclusion</span>
          </div>
        </AccordionHeader>
        <AccordionBody>
          <div className="divide-y divide-gray-200">
            <AnalysisSection icon={<FiChevronsRight />} title="Kesimpulan Risk Assessment">
              <p className="prose prose-sm max-w-none">{ai_executive_summary}</p>
            </AnalysisSection>

            <AnalysisSection icon={<FiClipboard />} title="Analisis Profil Risiko">
              <p className="prose prose-sm max-w-none mb-3">{ai_risk_profile_analysis?.summary}</p>
              <ul className="list-disc list-inside space-y-1">
                {ai_risk_profile_analysis?.distribution &&
                  Object.entries(ai_risk_profile_analysis.distribution).map(([level, count]) => (
                    <li key={level}>
                      Risiko tingkat '{level}': <span className="font-semibold">{count} risiko</span>
                    </li>
                  ))}
              </ul>
            </AnalysisSection>

            <AnalysisSection icon={<FiZap />} title="Prioritas Tindakan Segera">
              <ul className="list-disc list-inside space-y-1">
                {ai_immediate_priorities?.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </AnalysisSection>

            <AnalysisSection icon={<FiTrendingUp />} title="Pembahasan Risiko Kritis">
              <div className="space-y-4">
                {ai_critical_risks_discussion?.map((item, index) => (
                  <div key={index} className="p-3 bg-slate-50 rounded-md border">
                    <p className="font-semibold text-tremor-content-strong">
                      {item.risk_code}: {item.discussion}
                    </p>
                    <p className="text-xs mt-1">
                      <span className="font-medium">Target Mitigasi:</span> {item.mitigation_target}
                    </p>
                  </div>
                ))}
              </div>
            </AnalysisSection>

            <AnalysisSection icon={<FiArrowRight />} title="Rencana Implementasi">
              <ul className="list-disc list-inside space-y-1">
                {ai_implementation_plan?.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </AnalysisSection>

            <AnalysisSection icon={<FiChevronsRight />} title="Langkah Selanjutnya">
              <p className="prose prose-sm max-w-none">{ai_next_steps}</p>
            </AnalysisSection>
          </div>
        </AccordionBody>
      </Accordion>
    </Card>
  );
}

export default AIGeneratedAnalysis;
