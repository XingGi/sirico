// frontend/src/components/AIGeneratedAnalysis.jsx

import React from "react";
import { Card, Title, Text, Accordion, AccordionHeader, AccordionBody } from "@tremor/react";
import { FiCpu, FiAlertOctagon, FiChevronsRight, FiZap, FiClipboard, FiTrendingUp, FiArrowRight } from "react-icons/fi";

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

function AIGeneratedAnalysis({ analysisData }) {
  // Destructuring semua data dari prop
  const { ai_executive_summary, ai_risk_profile_analysis, ai_immediate_priorities, ai_critical_risks_discussion, ai_implementation_plan, ai_next_steps } = analysisData || {};

  // Jangan tampilkan apa-apa jika data utama tidak ada
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
