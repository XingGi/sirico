// frontend/src/features/risk-management/madya/components/RiskMapCard.jsx
import React, { useMemo } from "react";
import { Card, Title, Text, Grid, Badge } from "@tremor/react";
import RiskMapVisualization from "./RiskMapVisualization";

function RiskMapCard({ risks = [], templateData }) {
  // Pastikan templateData ada sebelum mencoba mengakses propertinya
  const hasTemplateData = templateData && templateData.likelihood_labels && templateData.impact_labels;

  // Buat mapping antara index risk input dan nomor urut (atau label unik jika ada)
  const riskLabels = useMemo(() => {
    const labels = {};
    risks.forEach((risk, index) => {
      // Anda bisa menggunakan risk.kode_risiko jika ingin, atau index + 1
      labels[index] = index + 1; // Menggunakan nomor urut 1, 2, 3...
    });
    return labels;
  }, [risks]);

  return (
    <Card>
      <Title as="h3">5. Peta Risiko</Title>
      <Text>Visualisasi pemetaan risiko inheren dan residual berdasarkan template.</Text>

      {!hasTemplateData ? (
        <Text className="text-center text-red-500 mt-4">Memuat data template atau template tidak valid...</Text>
      ) : (
        <Grid numItemsMd={2} className="gap-8 mt-6 items-start">
          {" "}
          {/* items-start agar tidak stretch */}
          {/* Peta Risiko Inheren */}
          <div>
            <Title order={5} className="text-center mb-2">
              Peta Risiko Inheren
            </Title>
            <div className="text-center font-semibold text-gray-600 tracking-wider mb-4 text-sm">DAMPAK</div>
            <div className="flex">
              <div className="flex items-center justify-center mr-2 w-4">
                <span className="font-semibold text-gray-600 tracking-wider text-xs" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
                  PROBABILITAS
                </span>
              </div>
              <div className="flex-1">
                <RiskMapVisualization risks={risks} templateData={templateData} type="inherent" riskLabels={riskLabels} />
                {/* Label Sumbu X di bawah */}
                <div className="grid grid-cols-5 gap-1 mt-1 ml-24">
                  {" "}
                  {/* Sesuaikan ml */}
                  {templateData.impact_labels
                    .sort((a, b) => a.level - b.level)
                    .map((l) => (
                      <div key={l.level} className="font-medium text-xs text-center">
                        {l.label} ({l.level})
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
          {/* Peta Risiko Residual */}
          <div>
            <Title order={5} className="text-center mb-2">
              Peta Risiko Residual
            </Title>
            <div className="text-center font-semibold text-gray-600 tracking-wider mb-4 text-sm">DAMPAK</div>
            <div className="flex">
              <div className="flex items-center justify-center mr-2 w-4">
                <span className="font-semibold text-gray-600 tracking-wider text-xs" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
                  PROBABILITAS
                </span>
              </div>
              <div className="flex-1">
                <RiskMapVisualization risks={risks} templateData={templateData} type="residual" riskLabels={riskLabels} />
                {/* Label Sumbu X di bawah */}
                <div className="grid grid-cols-5 gap-1 mt-1 ml-24">
                  {" "}
                  {/* Sesuaikan ml */}
                  {templateData.impact_labels
                    .sort((a, b) => a.level - b.level)
                    .map((l) => (
                      <div key={l.level} className="font-medium text-xs text-center">
                        {l.label} ({l.level})
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </Grid>
      )}

      {/* Legenda Warna */}
      {hasTemplateData && templateData.level_definitions && (
        <div className="mt-6 border-t pt-4">
          <Text className="font-semibold mb-2 text-gray-600">Legenda Level Risiko:</Text>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {templateData.level_definitions.map((def) => (
              <div key={def.level_name} className="flex items-center space-x-1.5">
                <span className="w-4 h-4 rounded border border-gray-400" style={{ backgroundColor: def.color_hex }}></span>
                <Text className="text-xs text-gray-700">
                  {def.level_name} ({def.min_score} - {def.max_score})
                </Text>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

export default RiskMapCard;
