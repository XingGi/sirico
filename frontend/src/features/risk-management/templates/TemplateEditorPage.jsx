// frontend/src/features/risk-management/templates/TemplateEditorPage.jsx
import React, { useState, useEffect } from "react";
import { Card, Title, Text, Button, TextInput, Textarea, Grid, Dialog, DialogPanel, NumberInput } from "@tremor/react";
import { FiSave, FiPlus, FiTrash2 } from "react-icons/fi";
import { useNavigate, useParams } from "react-router-dom";
import apiClient from "../../../api/api";

// Komponen untuk satu sel di matriks
const MatrixCellInput = ({ likelihood, impact, score, color, onScoreChange }) => (
  <div className="h-16 rounded-md flex items-center justify-center p-1" style={{ backgroundColor: color || "#E5E7EB" }}>
    <NumberInput value={score} onValueChange={(value) => onScoreChange(likelihood, impact, value)} className="text-center font-bold [&_input]:text-center" />
  </div>
);

const generateInitialState = () => {
  const scores = [];
  for (let l = 1; l <= 5; l++) {
    for (let i = 1; i <= 5; i++) {
      scores.push({ likelihood_level: l, impact_level: i, score: l * i });
    }
  }
  return {
    name: "",
    description: "",
    likelihood_labels: [
      { level: 5, label: "Hampir Pasti Terjadi" },
      { level: 4, label: "Sangat Mungkin Terjadi" },
      { level: 3, label: "Bisa Terjadi" },
      { level: 2, label: "Jarang Terjadi" },
      { level: 1, label: "Sangat Jarang Terjadi" },
    ],
    impact_labels: [
      { level: 1, label: "Sangat Rendah" },
      { level: 2, label: "Rendah" },
      { level: 3, label: "Moderat" },
      { level: 4, label: "Tinggi" },
      { level: 5, label: "Sangat Tinggi" },
    ],
    level_definitions: [
      { level_name: "Sangat Rendah", color_hex: "#00B050", min_score: 1, max_score: 2 },
      { level_name: "Rendah", color_hex: "#92D050", min_score: 3, max_score: 6 },
      { level_name: "Moderat", color_hex: "#FFFF00", min_score: 7, max_score: 12 },
      { level_name: "Tinggi", color_hex: "#FFC000", min_score: 13, max_score: 19 },
      { level_name: "Sangat Tinggi", color_hex: "#FF0000", min_score: 20, max_score: 25 },
    ],
    scores: scores,
  };
};

function TemplateEditorPage() {
  const navigate = useNavigate();
  const { templateId } = useParams();
  const isEditMode = Boolean(templateId);
  const [isLoading, setIsLoading] = useState(false);
  const [template, setTemplate] = useState(generateInitialState()); // <-- PERBAIKAN: Menggunakan satu fungsi inisialisasi

  useEffect(() => {
    if (isEditMode) {
      setIsLoading(true);
      apiClient
        .get(`/risk-maps/${templateId}`)
        .then((response) => {
          // Safety check jika data skor kosong dari API
          if (!response.data.scores || response.data.scores.length === 0) {
            response.data.scores = generateInitialState().scores;
          }
          setTemplate(response.data);
        })
        .catch((error) => {
          console.error("Gagal memuat data template:", error);
          alert("Gagal memuat template untuk diedit.");
          navigate("/risk-management/templates");
        })
        .finally(() => setIsLoading(false));
    }
  }, [templateId, isEditMode, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTemplate((prev) => ({ ...prev, [name]: value }));
  };

  const handleLabelChange = (type, level, value) => {
    setTemplate((prev) => ({
      ...prev,
      [type]: prev[type].map((item) => (item.level === level ? { ...item, label: value } : item)),
    }));
  };

  const handleScoreChange = (likelihood, impact, newScore) => {
    setTemplate((prev) => ({
      ...prev,
      scores: prev.scores.map((s) => (s.likelihood_level === likelihood && s.impact_level === impact ? { ...s, score: newScore } : s)),
    }));
  };

  const handleDefinitionChange = (index, field, value) => {
    setTemplate((prev) => ({
      ...prev,
      level_definitions: prev.level_definitions.map((def, i) => (i === index ? { ...def, [field]: value } : def)),
    }));
  };

  // --- PERBAIKAN: Implementasi logika tambah dan hapus ---
  const addLevelDefinition = () => {
    setTemplate((prev) => ({
      ...prev,
      level_definitions: [...prev.level_definitions, { level_name: "", color_hex: "#cccccc", min_score: 0, max_score: 0 }],
    }));
  };

  const removeLevelDefinition = (indexToRemove) => {
    setTemplate((prev) => ({
      ...prev,
      level_definitions: prev.level_definitions.filter((_, index) => index !== indexToRemove),
    }));
  };

  const handleSaveTemplate = async () => {
    setIsLoading(true);
    try {
      if (isEditMode) {
        await apiClient.put(`/risk-maps/${templateId}`, template); // <-- PERBAIKAN: Path API
        alert("Template berhasil diperbarui!");
      } else {
        await apiClient.post("/risk-maps", template); // <-- PERBAIKAN: Path API
        alert("Template berhasil dibuat!");
      }
      navigate("/risk-management/templates");
    } catch (error) {
      alert("Gagal menyimpan template: " + (error.response?.data?.msg || "Terjadi kesalahan"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 sm:p-10">
      <div className="flex justify-between items-center">
        <div>
          <Title>{isEditMode ? "Edit" : "Buat"} Template Peta Risiko</Title>
          <Text>Desain matriks risiko kustom Anda.</Text>
        </div>
        <Button icon={FiSave} onClick={handleSaveTemplate} loading={isLoading}>
          {isEditMode ? "Perbarui Template" : "Simpan Template"}
        </Button>
      </div>

      <Card className="mt-6">
        <Title as="h3">Informasi Dasar</Title>
        <Grid numItemsMd={2} className="gap-6 mt-4">
          <div>
            <label>Nama Template</label>
            <TextInput name="name" value={template.name} onChange={handleInputChange} placeholder="e.g., Peta Risiko Finansial" required />
          </div>
          <div>
            <label>Deskripsi</label>
            <Textarea name="description" value={template.description} onChange={handleInputChange} placeholder="Deskripsi singkat tentang template ini..." />
          </div>
        </Grid>
      </Card>

      <Card className="mt-6">
        <Grid numItemsMd={2} className="gap-x-12">
          <div>
            <Title as="h3">Label Probabilitas (Sumbu Y)</Title>
            <div className="space-y-3 mt-4">
              {template.likelihood_labels
                .sort((a, b) => b.level - a.level)
                .map(({ level, label }) => (
                  <div key={level}>
                    {" "}
                    <label>Level {level}</label> <TextInput value={label} onChange={(e) => handleLabelChange("likelihood_labels", level, e.target.value)} />{" "}
                  </div>
                ))}
            </div>
          </div>
          <div>
            <Title as="h3">Label Dampak (Sumbu X)</Title>
            <div className="space-y-3 mt-4">
              {template.impact_labels
                .sort((a, b) => a.level - b.level)
                .map(({ level, label }) => (
                  <div key={level}>
                    {" "}
                    <label>Level {level}</label> <TextInput value={label} onChange={(e) => handleLabelChange("impact_labels", level, e.target.value)} />{" "}
                  </div>
                ))}
            </div>
          </div>
        </Grid>
      </Card>

      <Card className="mt-6">
        <Title as="h3">Peta Skor Risiko</Title>
        <Text>Ubah nilai di dalam setiap sel sesuai kebutuhan template Anda.</Text>

        <div className="flex items-stretch mt-6">
          {" "}
          {/* Main flex container */}
          {/* Label Sumbu Y (Probabilitas) */}
          <div className="flex items-center justify-center mr-4 w-6">
            {" "}
            {/* Adjusted width */}
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
              {template.impact_labels
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
                {" "}
                {/* Adjusted width */}
                {template.likelihood_labels
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
                    const cell = template.scores?.find((s) => s.likelihood_level === l_level && s.impact_level === i_level);
                    const def = template.level_definitions.find((d) => cell?.score >= d.min_score && cell?.score <= d.max_score);
                    return <MatrixCellInput key={`${l_level}-${i_level}`} likelihood={l_level} impact={i_level} score={cell?.score || 0} color={def?.color_hex} onScoreChange={handleScoreChange} />;
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

      <Card className="mt-6">
        <div className="flex justify-between items-center">
          <Title as="h3">Definisi Level Risiko</Title>
          <Button icon={FiPlus} onClick={addLevelDefinition}>
            Tambah Level
          </Button>
        </div>
        <Text>Definisikan rentang skor untuk setiap nama level dan warnanya.</Text>
        <div className="mt-4 space-y-3">
          {template.level_definitions.map((def, index) => (
            <Grid key={index} numItems={10} className="gap-2 items-center">
              <div className="col-span-3">
                {" "}
                <TextInput value={def.level_name} onChange={(e) => handleDefinitionChange(index, "level_name", e.target.value)} placeholder="Nama Level" />{" "}
              </div>
              <div className="col-span-2">
                {" "}
                <TextInput value={def.color_hex} onChange={(e) => handleDefinitionChange(index, "color_hex", e.target.value)} placeholder="Warna Hex" />{" "}
              </div>
              <div className="col-span-2">
                {" "}
                <NumberInput value={def.min_score} onValueChange={(v) => handleDefinitionChange(index, "min_score", v)} placeholder="Skor Min" />{" "}
              </div>
              <div className="col-span-2">
                {" "}
                <NumberInput value={def.max_score} onValueChange={(v) => handleDefinitionChange(index, "max_score", v)} placeholder="Skor Max" />{" "}
              </div>
              <div className="col-span-1">
                {" "}
                <Button icon={FiTrash2} variant="light" color="red" onClick={() => removeLevelDefinition(index)} />{" "}
              </div>
            </Grid>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default TemplateEditorPage;
