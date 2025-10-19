// frontend/src/features/risk-management/templates/components/TemplateViewModal.jsx
import React from "react";
import { Card, Title, Text, Button, Grid, Badge, Dialog, DialogPanel } from "@tremor/react";
import { FiX } from "react-icons/fi";

const MatrixCell = ({ score, color, name }) => (
  <div className="h-16 rounded-md flex flex-col items-center justify-center text-center p-1" style={{ backgroundColor: color || "#E5E7EB" }}>
    <span className="font-bold text-gray-800 text-lg">{score}</span>
    <span className="text-xs text-gray-600 truncate">{name}</span>
  </div>
);

function TemplateViewModal({ isOpen, onClose, templateData }) {
  if (!isOpen || !templateData) return null;

  //   const matrixScores = Array.from({ length: 5 }, (_, i) => 5 - i).flatMap((prob) => Array.from({ length: 5 }, (_, j) => (j + 1) * prob));

  return (
    <Dialog open={isOpen} onClose={onClose} static={true}>
      <DialogPanel className="max-w-5xl">
        <div className="flex justify-between items-start">
          <div>
            <Title>Detail Template: {templateData.name}</Title>
            {templateData.is_default && (
              <Badge color="blue" className="mt-1">
                Default Sistem
              </Badge>
            )}
          </div>
          <Button icon={FiX} variant="light" onClick={onClose} />
        </div>

        <div className="mt-6 p-5 space-y-6 max-h-[70vh] overflow-y-auto pr-4">
          <Card>
            <Title as="h3">Deskripsi</Title>
            <Text className="mt-2">{templateData.description || "Tidak ada deskripsi."}</Text>
          </Card>

          <Card>
            <Grid numItemsMd={2} className="gap-x-12">
              <div>
                <Title as="h3">Label Probabilitas (Sumbu Y)</Title>
                <ul className="mt-4 space-y-2">
                  {templateData.likelihood_labels
                    .sort((a, b) => b.level - a.level)
                    .map((item) => (
                      <li key={item.level}>
                        <Text>
                          <b>Level {item.level}:</b> {item.label}
                        </Text>
                      </li>
                    ))}
                </ul>
              </div>
              <div>
                <Title as="h3">Label Dampak (Sumbu X)</Title>
                <ul className="mt-4 space-y-2">
                  {templateData.impact_labels
                    .sort((a, b) => a.level - b.level)
                    .map((item) => (
                      <li key={item.level}>
                        <Text>
                          <b>Level {item.level}:</b> {item.label}
                        </Text>
                      </li>
                    ))}
                </ul>
              </div>
            </Grid>
          </Card>

          <Card className="mt-6">
            <Title as="h3">Peta Risiko</Title>
            <div className="flex items-stretch mt-6">
              {" "}
              {/* Main flex container */}
              {/* Label Sumbu Y (Probabilitas) */}
              <div className="flex items-center justify-center mr-4 w-6">
                <span className="font-semibold text-gray-600 tracking-wider text-sm" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
                  PROBABILITAS
                </span>
              </div>
              {/* Kontainer untuk Sumbu X dan Matriks */}
              <div className="flex-1">
                {/* Label Sumbu X (Dampak) - di atas */}
                <div className="grid grid-cols-5 gap-2 ml-[8rem]">
                  {" "}
                  {/* Offset for Y labels */}
                  {templateData.impact_labels
                    .sort((a, b) => a.level - b.level)
                    .map((l) => (
                      <div key={l.level} className="font-medium text-sm text-center pb-2">
                        {l.label}
                      </div>
                    ))}
                </div>

                {/* Kontainer untuk Label Y dan Matriks */}
                <div className="flex items-stretch">
                  {/* Label Level Y (Probabilitas) */}
                  <div className="flex flex-col justify-around w-32 text-right pr-2">
                    {templateData.likelihood_labels
                      .sort((a, b) => b.level - a.level)
                      .map((l) => (
                        <div key={l.level} className="h-16 flex items-center justify-end font-medium text-sm">
                          {" "}
                          {/* Match cell height */}
                          {l.label}
                        </div>
                      ))}
                  </div>

                  {/* Grid Matriks 5x5 */}
                  <div className="flex-1 grid grid-cols-5 gap-2">
                    {Array.from({ length: 5 }, (_, i) => 5 - i).flatMap((l_level) =>
                      Array.from({ length: 5 }, (_, j) => j + 1).map((i_level) => {
                        const cell = templateData.scores?.find((s) => s.likelihood_level === l_level && s.impact_level === i_level);
                        const def = templateData.level_definitions.find((d) => cell?.score >= d.min_score && cell?.score <= d.max_score);
                        return <MatrixCell key={`${l_level}-${i_level}`} score={cell?.score || 0} color={def?.color_hex} name={def?.level_name} />;
                      })
                    )}
                  </div>
                </div>

                {/* Label Sumbu X (Dampak) - di bawah */}
                <div className="mt-4 text-center font-semibold text-gray-600 tracking-wider ml-[8rem]">
                  {" "}
                  {/* Offset for Y labels */}
                  DAMPAK
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex justify-end mt-6">
          <Button onClick={onClose}>Tutup</Button>
        </div>
      </DialogPanel>
    </Dialog>
  );
}

export default TemplateViewModal;
