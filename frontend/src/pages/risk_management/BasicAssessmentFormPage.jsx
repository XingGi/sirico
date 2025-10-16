import React, { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, Title, Text, Button, TextInput, Textarea, NumberInput, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Dialog, DialogPanel, Select, SelectItem } from "@tremor/react";
import { FiBriefcase, FiHome, FiSave, FiPlus, FiTrash2, FiEdit2, FiHelpCircle, FiMaximize, FiMinimize, FiAlertTriangle } from "react-icons/fi";
import apiClient from "../../api";

const formatCurrency = (value) => {
  if (value === null || value === undefined || isNaN(value)) return "Rp 0";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(value);
};

const parseCurrency = (value) => {
  return Number(String(value).replace(/[^0-9]/g, ""));
};

// Komponen Tooltip (tidak berubah)
const Tooltip = ({ children }) => {
  return (
    <div className="relative flex items-center group">
      {children}
      {/* --- PERBAIKAN DI SINI --- */}
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
};

// Komponen baru untuk Popup Konfirmasi Hapus
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
  const [formData, setFormData] = useState({ nama_unit_kerja: "", nama_perusahaan: "" });

  // State untuk Konteks
  const [contexts, setContexts] = useState([]);
  const [isContextModalOpen, setIsContextModalOpen] = useState(false);
  const [currentContext, setCurrentContext] = useState({ external: "", internal: "" });
  const [editingContextIndex, setEditingContextIndex] = useState(null);

  // State untuk Risiko
  const [risks, setRisks] = useState([]);
  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);
  const initialRiskState = {
    kode_risiko: "",
    kategori_risiko: "",
    unit_kerja: "",
    sasaran: "",
    tanggal_identifikasi: new Date().toISOString().split("T")[0],
    deskripsi_risiko: "",
    akar_penyebab: "",
    indikator_risiko: "",
    internal_control: "",
    deskripsi_dampak: "",
  };
  const [currentRisk, setCurrentRisk] = useState(initialRiskState);
  const [editingRiskIndex, setEditingRiskIndex] = useState(null);

  // State baru untuk Analisis Risiko (Card 4)
  const [analyses, setAnalyses] = useState([]);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const initialAnalysisState = { risk_identification_id: "", probabilitas: 1, dampak: 1, probabilitas_kualitatif: 0, dampak_finansial: 0 };
  const [currentAnalysis, setCurrentAnalysis] = useState(initialAnalysisState);
  const [editingAnalysisIndex, setEditingAnalysisIndex] = useState(null);

  // State untuk Konfirmasi Hapus dan Fullscreen
  const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, title: "", message: "", onConfirm: null });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const riskTableCardRef = useRef(null);

  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Handlers untuk input form
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleContextChange = (e) => setCurrentContext({ ...currentContext, [e.target.name]: e.target.value });
  const handleRiskChange = (e) => setCurrentRisk({ ...currentRisk, [e.target.name]: e.target.value });
  const handleRiskSelectChange = (value) => setCurrentRisk({ ...currentRisk, kategori_risiko: value });

  // --- Logika CRUD untuk Konteks (Card 2) ---
  const handleOpenEditContext = (index) => {
    setEditingContextIndex(index);
    setCurrentContext(contexts[index]);
    setIsContextModalOpen(true);
  };

  const handleSaveContext = () => {
    if (!currentContext.external || !currentContext.internal) {
      alert("Konteks tidak boleh kosong.");
      return;
    }
    if (editingContextIndex !== null) {
      const updatedContexts = [...contexts];
      updatedContexts[editingContextIndex] = currentContext;
      setContexts(updatedContexts);
    } else {
      setContexts([...contexts, currentContext]);
    }
    setCurrentContext({ external: "", internal: "" });
    setEditingContextIndex(null);
    setIsContextModalOpen(false);
  };

  const handleDeleteContext = (indexToDelete) => {
    setDeleteConfirmation({
      isOpen: true,
      title: "Konfirmasi Hapus Konteks",
      message: "Apakah Anda yakin ingin menghapus item konteks ini?",
      onConfirm: () => {
        setContexts(contexts.filter((_, index) => index !== indexToDelete));
        setDeleteConfirmation({ isOpen: false });
      },
    });
  };

  // --- Logika CRUD untuk Risiko (Card 3) ---
  const handleOpenEditRisk = (index) => {
    setEditingRiskIndex(index);
    setCurrentRisk(risks[index]);
    setIsRiskModalOpen(true);
  };

  const handleSaveRisk = () => {
    if (!currentRisk.kategori_risiko || !currentRisk.unit_kerja || !currentRisk.deskripsi_risiko) {
      alert("Kategori, Unit Kerja, dan Deskripsi wajib diisi.");
      return;
    }
    if (editingRiskIndex !== null) {
      const updatedRisks = [...risks];
      updatedRisks[editingRiskIndex] = currentRisk;
      setRisks(updatedRisks);
    } else {
      setRisks([...risks, currentRisk]);
    }
    setCurrentRisk(initialRiskState);
    setEditingRiskIndex(null);
    setIsRiskModalOpen(false);
  };

  const handleDeleteRisk = (indexToDelete) => {
    setDeleteConfirmation({
      isOpen: true,
      title: "Konfirmasi Hapus Risiko",
      message: "Apakah Anda yakin ingin menghapus item identifikasi risiko ini?",
      onConfirm: () => {
        setRisks(risks.filter((_, index) => index !== indexToDelete));
        setDeleteConfirmation({ isOpen: false });
      },
    });
  };

  // --- Logika Fullscreen ---
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      riskTableCardRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
    }
  };

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) setIsFullscreen(false);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

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
          alert("Gagal memuat data asesmen untuk diedit.");
          console.error(err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false); // Mode 'new'
    }
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    // Cleanup function
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [assessmentId, isEditMode]);

  // Logika CRUD baru untuk Analisis Risiko (Card 4)
  const handleAnalysisChange = (name, value) => setCurrentAnalysis((prev) => ({ ...prev, [name]: value }));

  const handleSaveAnalysis = () => {
    if (currentAnalysis.risk_identification_id === "") {
      alert("Deskripsi Risiko wajib dipilih.");
      return;
    }
    if (editingAnalysisIndex !== null) {
      const updatedAnalyses = [...analyses];
      updatedAnalyses[editingAnalysisIndex] = currentAnalysis;
      setAnalyses(updatedAnalyses);
    } else {
      setAnalyses([...analyses, currentAnalysis]);
    }
    setCurrentAnalysis(initialAnalysisState);
    setEditingAnalysisIndex(null);
    setIsAnalysisModalOpen(false);
  };

  const handleOpenEditAnalysis = (index) => {
    setEditingAnalysisIndex(index);
    setCurrentAnalysis(analyses[index]);
    setIsAnalysisModalOpen(true);
  };

  const handleDeleteAnalysis = (indexToDelete) => {
    setDeleteConfirmation({
      isOpen: true,
      title: "Konfirmasi Hapus Analisis",
      message: "Apakah Anda yakin ingin menghapus item analisis risiko ini?",
      onConfirm: () => {
        setAnalyses(analyses.filter((_, index) => index !== indexToDelete));
        setDeleteConfirmation({ isOpen: false });
      },
    });
  };

  const availableRisksForAnalysis = useMemo(() => {
    const usedRiskIds = analyses.map((a) => a.risk_identification_id);
    return risks
      .map((risk, index) => ({ ...risk, originalIndex: index }))
      .filter((risk) => !usedRiskIds.includes(risk.originalIndex) || (editingAnalysisIndex !== null && analyses[editingAnalysisIndex].risk_identification_id === risk.originalIndex));
  }, [risks, analyses, editingAnalysisIndex]);

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
        alert("Asesmen Dasar berhasil diperbarui!");
      } else {
        await apiClient.post("/basic-assessments", payload);
        alert("Asesmen Dasar berhasil disimpan!");
      }
      navigate("/risk-management/dasar");
    } catch (error) {
      alert("Gagal menyimpan: " + (error.response?.data?.msg || "Terjadi kesalahan."));
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && isEditMode) {
    return (
      <div className="p-6 sm:p-10">
        <Title>Memuat Data Asesmen...</Title>
        <Text>Mohon tunggu sebentar.</Text>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-10">
      <Title>{isEditMode ? "Edit" : "New"} Basic Assessment</Title>
      <Text>{isEditMode ? "Perbarui detail asesmen di bawah ini." : "Isi detail untuk asesmen dasar baru."}</Text>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
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

        <Card>
          <div className="flex justify-between items-center">
            <div>
              <Title as="h3">Tugas 1 - Penetapan Konteks Organisasi</Title>
              <Text>Tambahkan konteks internal dan eksternal yang relevan.</Text>
            </div>
            <Button type="button" icon={FiPlus} onClick={() => setIsContextModalOpen(true)}>
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
                      <Button icon={FiEdit2} variant="light" color="blue" onClick={() => handleOpenEditContext(index)} />
                      <Button icon={FiTrash2} variant="light" color="red" onClick={() => handleDeleteContext(index)} />
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

        <Card className="fullscreen-card" ref={riskTableCardRef}>
          <div className="flex justify-between items-center">
            <div>
              <Title as="h3">Tugas 2 - Identifikasi Risiko</Title>
              <Text>Tambahkan daftar risiko yang teridentifikasi.</Text>
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" icon={FiPlus} onClick={() => setIsRiskModalOpen(true)}>
                Tambah Identifikasi Risiko
              </Button>
              <Button type="button" variant="light" icon={isFullscreen ? FiMinimize : FiMaximize} onClick={toggleFullscreen} />
            </div>
          </div>
          <div className="overflow-x-auto mt-4 pt-8 -mt-4">
            <Table className="min-w-[1600px]">
              <TableHead className="sticky top-0 z-10 bg-white">
                <TableRow>
                  <TableHeaderCell className="w-12">No</TableHeaderCell>
                  <TableHeaderCell>Kode Risiko</TableHeaderCell>
                  <TableHeaderCell>
                    <div className="flex items-center gap-1">
                      Kategori Risiko
                      <Tooltip>
                        <FiHelpCircle className="h-4 w-4 text-gray-400" />
                      </Tooltip>
                    </div>
                  </TableHeaderCell>
                  <TableHeaderCell>Unit Kerja / Fungsi</TableHeaderCell>
                  <TableHeaderCell>Sasaran</TableHeaderCell>
                  <TableHeaderCell>Tgl. Identifikasi</TableHeaderCell>
                  <TableHeaderCell>Deskripsi atau Kejadian Risiko</TableHeaderCell>
                  <TableHeaderCell>Akar Penyebab</TableHeaderCell>
                  <TableHeaderCell>Indikator Risiko</TableHeaderCell>
                  <TableHeaderCell>Faktor Positif / Internal Control</TableHeaderCell>
                  <TableHeaderCell>Deskripsi Dampak</TableHeaderCell>
                  <TableHeaderCell className="text-right">Aksi</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {risks.length > 0 ? (
                  risks.map((risk, index) => (
                    <TableRow key={index}>
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
                        <Button icon={FiEdit2} variant="light" color="blue" onClick={() => handleOpenEditRisk(index)} />
                        <Button icon={FiTrash2} variant="light" color="red" onClick={() => handleDeleteRisk(index)} />
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

        <Card>
          <div className="flex justify-between items-center">
            <div>
              <Title as="h3">Tugas 3 - Analisis Risiko</Title>
              <Text>Lakukan analisis terhadap risiko yang telah diidentifikasi.</Text>
            </div>
            <Button type="button" icon={FiPlus} onClick={() => setIsAnalysisModalOpen(true)} disabled={availableRisksForAnalysis.length === 0 && editingAnalysisIndex === null}>
              Tambah Analisis Risiko
            </Button>
          </div>
          <div className="overflow-x-auto mt-4">
            <Table className="min-w-[1200px]">
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Deskripsi atau Kejadian Risiko</TableHeaderCell>
                  <TableHeaderCell>Probabilitas (P)</TableHeaderCell>
                  <TableHeaderCell>Dampak (I)</TableHeaderCell>
                  <TableHeaderCell>Skor Risiko Inherent (W)</TableHeaderCell>
                  <TableHeaderCell>Probabilitas Risiko Inherent Kualitatif (%)</TableHeaderCell>
                  <TableHeaderCell>Dampak Finansial Risiko Inherent (Rp)</TableHeaderCell>
                  <TableHeaderCell>Nilai Bersih Risiko Inherent</TableHeaderCell>
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
                        <TableCell className="whitespace-normal">{riskInfo?.deskripsi_risiko}</TableCell>
                        <TableCell>{analysis.probabilitas}</TableCell>
                        <TableCell>{analysis.dampak}</TableCell>
                        <TableCell>{skor}</TableCell>
                        <TableCell>{analysis.probabilitas_kualitatif}%</TableCell>
                        <TableCell>{formatCurrency(analysis.dampak_finansial)}</TableCell>
                        <TableCell>{formatCurrency(nilaiBersih)}</TableCell>
                        <TableCell className="text-right">
                          <Button icon={FiEdit2} variant="light" color="blue" onClick={() => handleOpenEditAnalysis(index)} />
                          <Button icon={FiTrash2} variant="light" color="red" onClick={() => handleDeleteAnalysis(index)} />
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

      {/* Modal Konteks dengan logika reset */}
      <Dialog
        open={isContextModalOpen}
        onClose={() => {
          setIsContextModalOpen(false);
          setEditingContextIndex(null);
          setCurrentContext({ external: "", internal: "" });
        }}
        static={true}
      >
        <DialogPanel>
          <Title>{editingContextIndex !== null ? "Edit" : "Tambah"} Konteks Organisasi</Title>
          <div className="mt-6 space-y-4">
            <div>
              <label>Konteks Eksternal</label>
              <Textarea name="external" value={currentContext.external} onChange={handleContextChange} rows={4} className="mt-1" />
            </div>
            <div>
              <label>Konteks Internal</label>
              <Textarea name="internal" value={currentContext.internal} onChange={handleContextChange} rows={4} className="mt-1" />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setIsContextModalOpen(false);
                setEditingContextIndex(null);
                setCurrentContext({ external: "", internal: "" });
              }}
            >
              Batal
            </Button>
            <Button onClick={handleSaveContext}>OK</Button>
          </div>
        </DialogPanel>
      </Dialog>

      {/* Modal Risiko dengan logika reset */}
      <Dialog open={isRiskModalOpen} onClose={() => setIsRiskModalOpen(false)} static={true}>
        <DialogPanel className="max-w-3xl">
          <Title>Tambah Identifikasi Risiko Baru</Title>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <div>
              <label>Kode Risiko</label>
              <TextInput name="kode_risiko" value={currentRisk.kode_risiko} onChange={handleRiskChange} placeholder="Otomatis atau manual..." />
            </div>
            <div>
              <label>Kategori Risiko *</label>
              <Select name="kategori_risiko" value={currentRisk.kategori_risiko} onValueChange={handleRiskSelectChange} required>
                <SelectItem value="Operasional">Operasional</SelectItem>
                <SelectItem value="Keuangan">Keuangan</SelectItem>
                <SelectItem value="Kepatuhan">Kepatuhan</SelectItem>
                <SelectItem value="Strategis">Strategis</SelectItem>
              </Select>
            </div>
            <div className="md:col-span-2">
              <label>Unit Kerja / Fungsi *</label>
              <TextInput name="unit_kerja" value={currentRisk.unit_kerja} onChange={handleRiskChange} required />
            </div>
            <div className="md:col-span-2">
              <label>Sasaran</label>
              <Textarea name="sasaran" value={currentRisk.sasaran} onChange={handleRiskChange} rows={2} />
            </div>
            <div>
              <label>Tanggal Identifikasi Risiko</label>
              <TextInput type="date" name="tanggal_identifikasi" value={currentRisk.tanggal_identifikasi} onChange={handleRiskChange} />
            </div>
            <div className="md:col-span-2">
              <label>Deskripsi atau Kejadian Risiko *</label>
              <Textarea name="deskripsi_risiko" value={currentRisk.deskripsi_risiko} onChange={handleRiskChange} required rows={3} />
            </div>
            <div className="md:col-span-2">
              <label>Akar Penyebab</label>
              <Textarea name="akar_penyebab" value={currentRisk.akar_penyebab} onChange={handleRiskChange} rows={3} />
            </div>
            <div className="md:col-span-2">
              <label>Indikator Risiko</label>
              <Textarea name="indikator_risiko" value={currentRisk.indikator_risiko} onChange={handleRiskChange} rows={3} />
            </div>
            <div className="md:col-span-2">
              <label>Faktor Positif / Internal Control Yang Ada Saat Ini</label>
              <Textarea name="internal_control" value={currentRisk.internal_control} onChange={handleRiskChange} rows={3} />
            </div>
            <div className="md:col-span-2">
              <label>Deskripsi Dampak</label>
              <Textarea name="deskripsi_dampak" value={currentRisk.deskripsi_dampak} onChange={handleRiskChange} rows={3} />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsRiskModalOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSaveRisk}>OK</Button>
          </div>
        </DialogPanel>
      </Dialog>

      {/* Modal untuk Analisis Risiko */}
      <Dialog
        open={isAnalysisModalOpen}
        onClose={() => {
          setIsAnalysisModalOpen(false);
          setEditingAnalysisIndex(null);
          setCurrentAnalysis(initialAnalysisState);
        }}
        static={true}
      >
        <DialogPanel className="max-w-2xl">
          <Title>{editingAnalysisIndex !== null ? "Edit" : "Tambah"} Analisis Risiko</Title>
          <div className="mt-6 space-y-4">
            <div>
              <label>Deskripsi atau Kejadian Risiko *</label>
              <Select value={String(currentAnalysis.risk_identification_id)} onValueChange={(val) => handleAnalysisChange("risk_identification_id", Number(val))} required>
                <SelectItem value="">Pilih Risiko...</SelectItem>
                {availableRisksForAnalysis.map((risk) => (
                  <SelectItem key={risk.originalIndex} value={String(risk.originalIndex)}>
                    {risk.deskripsi_risiko}
                  </SelectItem>
                ))}
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label>Probabilitas (1-5)</label>
                <NumberInput value={currentAnalysis.probabilitas} onValueChange={(val) => handleAnalysisChange("probabilitas", val)} min={1} max={5} />
              </div>
              <div>
                <label>Dampak (1-5)</label>
                <NumberInput value={currentAnalysis.dampak} onValueChange={(val) => handleAnalysisChange("dampak", val)} min={1} max={5} />
              </div>
              <div>
                <label>Skor Risiko (W)</label>
                <TextInput value={(currentAnalysis.probabilitas || 0) * (currentAnalysis.dampak || 0)} disabled />
              </div>
            </div>
            <div>
              <label>Probabilitas Kualitatif (%)</label>
              <NumberInput icon={() => <span>%</span>} value={currentAnalysis.probabilitas_kualitatif} onValueChange={(val) => handleAnalysisChange("probabilitas_kualitatif", val)} min={0} max={100} />
            </div>
            <div>
              <label>Dampak Finansial (Rp)</label>
              <TextInput
                icon={() => <span className="text-gray-500">Rp</span>}
                value={currentAnalysis.dampak_finansial.toLocaleString("id-ID")}
                onChange={(e) => handleAnalysisChange("dampak_finansial", parseCurrency(e.target.value))}
                placeholder="1.000.000"
              />
            </div>
            <div>
              <label>Nilai Bersih Risiko</label>
              <TextInput icon={() => <span className="text-gray-500">Rp</span>} value={formatCurrency((currentAnalysis.dampak_finansial || 0) * ((currentAnalysis.probabilitas_kualitatif || 0) / 100)).replace("Rp", "")} disabled />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setIsAnalysisModalOpen(false);
                setEditingAnalysisIndex(null);
                setCurrentAnalysis(initialAnalysisState);
              }}
            >
              Batal
            </Button>
            <Button onClick={handleSaveAnalysis}>OK</Button>
          </div>
        </DialogPanel>
      </Dialog>

      {/* Dialog Konfirmasi Hapus */}
      <ConfirmationDialog isOpen={deleteConfirmation.isOpen} onClose={() => setDeleteConfirmation({ isOpen: false })} onConfirm={deleteConfirmation.onConfirm} title={deleteConfirmation.title} message={deleteConfirmation.message} />
    </div>
  );
}

export default BasicAssessmentFormPage;
