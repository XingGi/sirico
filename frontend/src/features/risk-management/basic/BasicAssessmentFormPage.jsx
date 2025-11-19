// frontend/src/features/risk-management/basic/BasicAssessmentFormPage.jsx

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, Title, Text, Button, TextInput, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Dialog, DialogPanel, Flex } from "@tremor/react";
import { FiBriefcase, FiHome, FiSave, FiPlus, FiTrash2, FiEdit2, FiHelpCircle, FiMaximize, FiMinimize, FiAlertTriangle } from "react-icons/fi";
import apiClient from "../../../api/api";
import { toast } from "sonner";

// 🔽 Import Komponen Baru (Pastikan path-nya sesuai dengan tempat Anda menyimpan file tadi)
import BasicContextModal from "./components/BasicContextModal";
import BasicRiskModal from "./components/BasicRiskModal";
import BasicAnalysisModal from "./components/BasicAnalysisModal";

// --- Helper Functions ---
const formatCurrency = (value) => {
  if (value === null || value === undefined || isNaN(value)) return "Rp 0";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(value);
};

const Tooltip = ({ children }) => (
  <div className="relative flex items-center group">
    {children}
    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 p-2 bg-slate-700 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50">
      <h4 className="font-bold mb-1">Kategori Risiko:</h4>
      <ul className="list-disc list-inside">
        <li>Operasional</li>
        <li>Keuangan</li>
        <li>Kepatuhan</li>
        <li>Strategis</li>
      </ul>
    </div>
  </div>
);

// Komponen Konfirmasi Hapus (Tetap disini karena kecil & spesifik)
const ConfirmationDialog = ({ isOpen, onClose, onConfirm, title, message }) => (
  <Dialog open={isOpen} onClose={onClose} static={true}>
    <DialogPanel>
      <div className="text-center">
        <FiAlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <Title>{title}</Title>
        <Text className="mt-2">{message}</Text>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Batal
        </Button>
        <Button color="red" onClick={onConfirm}>
          Hapus
        </Button>
      </div>
    </DialogPanel>
  </Dialog>
);

function BasicAssessmentFormPage() {
  const { assessmentId } = useParams();
  const isEditMode = Boolean(assessmentId);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  // --- State Data Utama ---
  const [formData, setFormData] = useState({ nama_unit_kerja: "", nama_perusahaan: "" });
  const [contexts, setContexts] = useState([]);
  const [risks, setRisks] = useState([]);
  const [analyses, setAnalyses] = useState([]);

  // --- State Modal Control ---
  // Kita HANYA perlu menyimpan index yang sedang diedit.
  // Data formnya sendiri sekarang ada di dalam component Modal masing-masing.
  const [isContextModalOpen, setIsContextModalOpen] = useState(false);
  const [editingContextIndex, setEditingContextIndex] = useState(null);

  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);
  const [editingRiskIndex, setEditingRiskIndex] = useState(null);

  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [editingAnalysisIndex, setEditingAnalysisIndex] = useState(null);

  const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, title: "", message: "", onConfirm: null });

  // Fullscreen logic
  const [isFullscreen, setIsFullscreen] = useState(false);
  const riskTableCardRef = useRef(null);

  // --- Fetch Data (Initial Load) ---
  useEffect(() => {
    if (isEditMode) {
      setIsLoading(true);
      apiClient
        .get(`/basic-assessments/${assessmentId}`)
        .then((response) => {
          const data = response.data;
          setFormData({ nama_unit_kerja: data.nama_unit_kerja, nama_perusahaan: data.nama_perusahaan });
          setContexts(data.contexts || []);
          setRisks(data.risks || []);
          setAnalyses(data.analyses || []);
        })
        .catch((err) => {
          toast.error("Gagal memuat data asesmen.");
          console.error(err);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [assessmentId, isEditMode]);

  // --- Handlers: Form Data Utama ---
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  // --- Handlers: Konteks ---
  const handleOpenAddContext = () => {
    setEditingContextIndex(null); // Mode tambah
    setIsContextModalOpen(true);
  };

  const handleOpenEditContext = (index) => {
    setEditingContextIndex(index); // Mode edit index ke-i
    setIsContextModalOpen(true);
  };

  // Fungsi ini dipanggil oleh BasicContextModal saat tombol Simpan diklik
  const handleSaveContext = (contextData) => {
    if (editingContextIndex !== null) {
      // Update
      const updated = [...contexts];
      updated[editingContextIndex] = contextData;
      setContexts(updated);
    } else {
      // Tambah baru
      setContexts([...contexts, contextData]);
    }
    setIsContextModalOpen(false);
  };

  const handleDeleteContext = (index) => {
    setDeleteConfirmation({
      isOpen: true,
      title: "Hapus Konteks",
      message: "Yakin ingin menghapus item konteks ini?",
      onConfirm: () => {
        setContexts(contexts.filter((_, i) => i !== index));
        setDeleteConfirmation({ isOpen: false });
      },
    });
  };

  // --- Handlers: Risiko ---
  const handleOpenAddRisk = () => {
    setEditingRiskIndex(null);
    setIsRiskModalOpen(true);
  };

  const handleOpenEditRisk = (index) => {
    setEditingRiskIndex(index);
    setIsRiskModalOpen(true);
  };

  // Fungsi ini dipanggil oleh BasicRiskModal
  const handleSaveRisk = (riskData) => {
    if (editingRiskIndex !== null) {
      const updated = [...risks];
      updated[editingRiskIndex] = riskData;
      setRisks(updated);
    } else {
      setRisks([...risks, riskData]);
    }
    setIsRiskModalOpen(false);
  };

  const handleDeleteRisk = (index) => {
    setDeleteConfirmation({
      isOpen: true,
      title: "Hapus Risiko",
      message: "Yakin ingin menghapus risiko ini? Analisis terkait mungkin akan menjadi tidak valid.",
      onConfirm: () => {
        setRisks(risks.filter((_, i) => i !== index));
        // Opsional: Anda bisa menambahkan logika untuk menghapus analisis yang terkait di sini
        setDeleteConfirmation({ isOpen: false });
      },
    });
  };

  // --- Handlers: Analisis ---
  const availableRisksForAnalysis = useMemo(() => {
    const usedRiskIndices = analyses.map((a) => a.risk_identification_id);
    // Kita perlu memetakan risiko dengan index aslinya agar dropdown bisa memilih referensi yang benar
    return risks
      .map((risk, index) => ({ ...risk, originalIndex: index }))
      .filter(
        (risk) =>
          // Tampilkan jika belum dipakai ATAU jika sedang diedit (biar bisa pilih dirinya sendiri)
          !usedRiskIndices.includes(risk.originalIndex) || (editingAnalysisIndex !== null && analyses[editingAnalysisIndex].risk_identification_id === risk.originalIndex)
      );
  }, [risks, analyses, editingAnalysisIndex]);

  const handleOpenAddAnalysis = () => {
    setEditingAnalysisIndex(null);
    setIsAnalysisModalOpen(true);
  };

  const handleOpenEditAnalysis = (index) => {
    setEditingAnalysisIndex(index);
    setIsAnalysisModalOpen(true);
  };

  // Fungsi ini dipanggil oleh BasicAnalysisModal
  const handleSaveAnalysis = (analysisData) => {
    if (editingAnalysisIndex !== null) {
      const updated = [...analyses];
      updated[editingAnalysisIndex] = analysisData;
      setAnalyses(updated);
    } else {
      setAnalyses([...analyses, analysisData]);
    }
    setIsAnalysisModalOpen(false);
  };

  const handleDeleteAnalysis = (index) => {
    setDeleteConfirmation({
      isOpen: true,
      title: "Hapus Analisis",
      message: "Yakin ingin menghapus analisis ini?",
      onConfirm: () => {
        setAnalyses(analyses.filter((_, i) => i !== index));
        setDeleteConfirmation({ isOpen: false });
      },
    });
  };

  // --- Submit ke API ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const payload = {
      ...formData,
      contexts: contexts.map((c) => ({ external: c.external, internal: c.internal })),
      risks,
      analyses,
    };

    try {
      if (isEditMode) {
        await apiClient.put(`/basic-assessments/${assessmentId}`, payload);
        toast.success("Asesmen berhasil diperbarui!");
      } else {
        await apiClient.post("/basic-assessments", payload);
        toast.success("Asesmen berhasil disimpan!");
      }
      navigate("/risk-management/dasar");
    } catch (error) {
      toast.error("Gagal menyimpan: " + (error.response?.data?.msg || "Terjadi kesalahan."));
    } finally {
      setIsLoading(false);
    }
  };

  // --- Fullscreen Logic ---
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      riskTableCardRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleChange);
    return () => document.removeEventListener("fullscreenchange", handleChange);
  }, []);

  if (isLoading && isEditMode)
    return (
      <div className="p-10">
        <Title>Memuat...</Title>
      </div>
    );

  return (
    <div className="p-6 sm:p-10">
      <Title>{isEditMode ? "Edit" : "New"} Basic Assessment</Title>
      <Text>{isEditMode ? "Perbarui detail asesmen di bawah ini." : "Isi detail untuk asesmen dasar baru."}</Text>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {/* CARD 1: Identitas */}
        <Card>
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium text-gray-700">Nama Unit Kerja</label>
              <TextInput icon={FiBriefcase} name="nama_unit_kerja" value={formData.nama_unit_kerja} onChange={handleChange} placeholder="Contoh: Divisi Keuangan" required className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Nama Perusahaan</label>
              <TextInput icon={FiHome} name="nama_perusahaan" value={formData.nama_perusahaan} onChange={handleChange} placeholder="Contoh: PT. Sirico Jaya Abadi" required className="mt-1" />
            </div>
          </div>
        </Card>

        {/* CARD 2: Konteks */}
        <Card>
          <div className="flex justify-between items-center">
            <div>
              <Title as="h3">Tugas 1 - Penetapan Konteks Organisasi</Title>
              <Text>Tambahkan konteks internal dan eksternal yang relevan.</Text>
            </div>
            <Button type="button" icon={FiPlus} onClick={handleOpenAddContext}>
              Tambah Konteks
            </Button>
          </div>
          <Table className="mt-4">
            <TableHead>
              <TableRow>
                <TableHeaderCell>Konteks Eksternal</TableHeaderCell>
                <TableHeaderCell>Konteks Internal</TableHeaderCell>
                <TableHeaderCell className="text-right">Aksi</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {contexts.length > 0 ? (
                contexts.map((ctx, index) => (
                  <TableRow key={index}>
                    <TableCell className="whitespace-normal">{ctx.external}</TableCell>
                    <TableCell className="whitespace-normal">{ctx.internal}</TableCell>
                    <TableCell className="text-right">
                      <Flex justifyContent="end" className="gap-2">
                        <Button type="button" icon={FiEdit2} size="xs" variant="light" color="blue" onClick={() => handleOpenEditContext(index)} />
                        <Button type="button" icon={FiTrash2} size="xs" variant="light" color="red" onClick={() => handleDeleteContext(index)} />
                      </Flex>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-gray-500 py-4">
                    Belum ada konteks ditambahkan.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>

        {/* CARD 3: Identifikasi Risiko */}
        <Card className="fullscreen-card" ref={riskTableCardRef}>
          <div className="flex justify-between items-center">
            <div>
              <Title as="h3">Tugas 2 - Identifikasi Risiko</Title>
              <Text>Tambahkan daftar risiko yang teridentifikasi.</Text>
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" icon={FiPlus} onClick={handleOpenAddRisk}>
                Tambah Identifikasi Risiko
              </Button>
              <Button type="button" variant="light" icon={isFullscreen ? FiMinimize : FiMaximize} onClick={toggleFullscreen} />
            </div>
          </div>
          <div className="overflow-x-auto mt-4 pt-8">
            <Table className="min-w-[1600px]">
              <TableHead className="sticky top-0 z-10 bg-white shadow-sm">
                <TableRow>
                  <TableHeaderCell className="w-12">No</TableHeaderCell>
                  <TableHeaderCell>Kode</TableHeaderCell>
                  <TableHeaderCell>
                    <div className="flex items-center gap-1">
                      Kategori{" "}
                      <Tooltip>
                        <FiHelpCircle className="h-4 w-4 text-gray-400" />
                      </Tooltip>
                    </div>
                  </TableHeaderCell>
                  <TableHeaderCell>Unit Kerja</TableHeaderCell>
                  <TableHeaderCell>Sasaran</TableHeaderCell>
                  <TableHeaderCell>Tgl Identifikasi</TableHeaderCell>
                  <TableHeaderCell>Deskripsi / Kejadian</TableHeaderCell>
                  <TableHeaderCell>Akar Penyebab</TableHeaderCell>
                  <TableHeaderCell>Indikator</TableHeaderCell>
                  <TableHeaderCell>Internal Control</TableHeaderCell>
                  <TableHeaderCell>Dampak</TableHeaderCell>
                  <TableHeaderCell className="text-right">Aksi</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {risks.length > 0 ? (
                  risks.map((risk, index) => (
                    <TableRow key={index} className="hover:bg-gray-50">
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{risk.kode_risiko}</TableCell>
                      <TableCell>{risk.kategori_risiko}</TableCell>
                      <TableCell>{risk.unit_kerja}</TableCell>
                      <TableCell className="whitespace-normal">{risk.sasaran}</TableCell>
                      <TableCell>{risk.tanggal_identifikasi}</TableCell>
                      <TableCell className="whitespace-normal">{risk.deskripsi_risiko}</TableCell>
                      <TableCell className="whitespace-normal">{risk.akar_penyebab}</TableCell>
                      <TableCell className="whitespace-normal">{risk.indikator_risiko}</TableCell>
                      <TableCell className="whitespace-normal">{risk.internal_control}</TableCell>
                      <TableCell className="whitespace-normal">{risk.deskripsi_dampak}</TableCell>
                      <TableCell className="text-right">
                        <Flex justifyContent="end" className="gap-2">
                          <Button type="button" icon={FiEdit2} size="xs" variant="light" color="blue" onClick={() => handleOpenEditRisk(index)} />
                          <Button type="button" icon={FiTrash2} size="xs" variant="light" color="red" onClick={() => handleDeleteRisk(index)} />
                        </Flex>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center text-gray-500 py-10">
                      Belum ada risiko yang diidentifikasi.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* CARD 4: Analisis Risiko */}
        <Card>
          <div className="flex justify-between items-center">
            <div>
              <Title as="h3">Tugas 3 - Analisis Risiko</Title>
              <Text>Lakukan analisis terhadap risiko yang telah diidentifikasi.</Text>
            </div>
            <Button type="button" icon={FiPlus} onClick={handleOpenAddAnalysis} disabled={availableRisksForAnalysis.length === 0 && editingAnalysisIndex === null}>
              Tambah Analisis Risiko
            </Button>
          </div>
          <div className="overflow-x-auto mt-4">
            <Table className="min-w-[1200px]">
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Deskripsi Risiko</TableHeaderCell>
                  <TableHeaderCell>Prob (P)</TableHeaderCell>
                  <TableHeaderCell>Dampak (I)</TableHeaderCell>
                  <TableHeaderCell>Skor (W)</TableHeaderCell>
                  <TableHeaderCell>Prob Kualitatif (%)</TableHeaderCell>
                  <TableHeaderCell>Dampak Finansial (Rp)</TableHeaderCell>
                  <TableHeaderCell>Nilai Bersih</TableHeaderCell>
                  <TableHeaderCell className="text-right">Aksi</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {analyses.length > 0 ? (
                  analyses.map((analysis, index) => {
                    const riskInfo = risks[analysis.risk_identification_id];
                    const skor = (analysis.probabilitas || 0) * (analysis.dampak || 0);
                    const nilaiBersih = (analysis.dampak_finansial || 0) * ((analysis.probabilitas_kualitatif || 0) / 100);
                    return (
                      <TableRow key={index}>
                        <TableCell className="whitespace-normal max-w-md">{riskInfo?.deskripsi_risiko || "(Risiko Dihapus)"}</TableCell>
                        <TableCell>{analysis.probabilitas}</TableCell>
                        <TableCell>{analysis.dampak}</TableCell>
                        <TableCell>{skor}</TableCell>
                        <TableCell>{analysis.probabilitas_kualitatif}%</TableCell>
                        <TableCell>{formatCurrency(analysis.dampak_finansial)}</TableCell>
                        <TableCell>{formatCurrency(nilaiBersih)}</TableCell>
                        <TableCell className="text-right">
                          <Flex justifyContent="end" className="gap-2">
                            <Button type="button" icon={FiEdit2} size="xs" variant="light" color="blue" onClick={() => handleOpenEditAnalysis(index)} />
                            <Button type="button" icon={FiTrash2} size="xs" variant="light" color="red" onClick={() => handleDeleteAnalysis(index)} />
                          </Flex>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-4 text-gray-500">
                      Belum ada analisis risiko.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" size="lg" icon={FiSave} loading={isLoading}>
            Simpan Keseluruhan Asesmen
          </Button>
        </div>
      </form>

      {/* --- MODALS --- */}
      {/* Perhatikan betapa bersihnya bagian ini sekarang! */}

      <BasicContextModal isOpen={isContextModalOpen} onClose={() => setIsContextModalOpen(false)} onSave={handleSaveContext} initialData={editingContextIndex !== null ? contexts[editingContextIndex] : null} />

      <BasicRiskModal isOpen={isRiskModalOpen} onClose={() => setIsRiskModalOpen(false)} onSave={handleSaveRisk} initialData={editingRiskIndex !== null ? risks[editingRiskIndex] : null} />

      <BasicAnalysisModal
        isOpen={isAnalysisModalOpen}
        onClose={() => setIsAnalysisModalOpen(false)}
        onSave={handleSaveAnalysis}
        initialData={editingAnalysisIndex !== null ? analyses[editingAnalysisIndex] : null}
        availableRisks={availableRisksForAnalysis}
      />

      <ConfirmationDialog
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ ...deleteConfirmation, isOpen: false })}
        onConfirm={deleteConfirmation.onConfirm}
        title={deleteConfirmation.title}
        message={deleteConfirmation.message}
      />
    </div>
  );
}

export default BasicAssessmentFormPage;
