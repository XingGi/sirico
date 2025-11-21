// frontend/src/features/risk-management/madya/components/RiskInputCard.jsx
import React, { useState, useMemo, useEffect, useRef } from "react";
import { Card, Title, Text, Button, TextInput, Select, SelectItem, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Badge } from "@tremor/react";
import { FiPlus, FiEdit2, FiTrash2, FiList, FiMaximize, FiMinimize, FiFilter } from "react-icons/fi";
import apiClient from "../../../../api/api";
import RiskInputFormModal from "./RiskInputFormModal";

const formatCurrency = (value) => {
  const num = parseFloat(String(value).replace(/[^0-9.-]+/g, ""));
  if (value === null || value === undefined || isNaN(num)) return "Rp 0";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);
};

const formatDate = (dateString) => {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("id-ID", { year: "numeric", month: "short", day: "numeric" });
  } catch (e) {
    return "-";
  }
};

const getRiskLevelStyle = (score) => {
  if (score === null || score === undefined) return { text: "#N/A", colorClass: "bg-gray-200 text-gray-500" };
  if (score >= 20) return { text: String(score), colorClass: "bg-red-600 text-white" };
  if (score >= 16) return { text: String(score), colorClass: "bg-orange-500 text-white" };
  if (score >= 12) return { text: String(score), colorClass: "bg-yellow-400 text-black" };
  if (score >= 6) return { text: String(score), colorClass: "bg-lime-400 text-black" };
  if (score >= 1) return { text: String(score), colorClass: "bg-green-500 text-white" };
  return { text: "#N/A", colorClass: "bg-gray-200 text-gray-500" };
};

function RiskInputCard({ assessmentId, structureEntries = [], sasaranKPIEntries = [], templateScores = [], onRiskInputSaveSuccess, initialFilters, onFilterChange, initialRiskInputData = [], isDataLoading = false }) {
  const uniqueDirektorat = useMemo(() => [...new Set(structureEntries.map((e) => e.direktorat).filter(Boolean))], [structureEntries]);
  const uniqueDivisi = useMemo(() => [...new Set(structureEntries.map((e) => e.divisi).filter(Boolean))], [structureEntries]);
  const uniqueUnitKerja = useMemo(() => [...new Set(structureEntries.map((e) => e.unit_kerja).filter(Boolean))], [structureEntries]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRiskData, setEditingRiskData] = useState(null);
  const [sasaranOptions, setSasaranOptions] = useState([]);
  const riskInputEntries = initialRiskInputData;
  const isLoading = isDataLoading;

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    const validSasaranProps = Array.isArray(sasaranKPIEntries) ? sasaranKPIEntries : [];
    if (validSasaranProps.length > 0) setSasaranOptions(validSasaranProps.map((s) => ({ id: s.id, sasaran_kpi: s.sasaran_kpi })));
    else setSasaranOptions([]);
  }, [sasaranKPIEntries]);

  const filteredRiskInputs = useMemo(() => {
    return riskInputEntries.filter((risk) => {
      // 1. Filter Departemen/Unit Kerja (Pencocokan Langsung)
      // 'departemen' di filter mapping ke 'unit_kerja' di data risiko
      if (initialFilters.departemen && risk.unit_kerja !== initialFilters.departemen) {
        return false;
      }

      // 2. Filter Hierarki (Organisasi, Direktorat, Divisi)
      // Karena data risiko hanya menyimpan 'unit_kerja', kita harus mencari parent-nya (Dir/Div)
      // dengan mencocokkan 'unit_kerja' ke 'structureEntries'.
      const structure = structureEntries.find((s) => s.unit_kerja === risk.unit_kerja);

      const filterOrg = initialFilters.organisasi ? initialFilters.organisasi.toLowerCase() : "";
      const filterDir = initialFilters.direktorat;
      const filterDiv = initialFilters.divisi;

      // Jika ada filter hierarki yang aktif
      if (filterOrg || filterDir || filterDiv) {
        // Jika tidak ditemukan data struktur untuk unit kerja ini,
        // maka kita tidak bisa memvalidasi hierarkinya -> exclude (kecuali logic bisnis berkata lain)
        if (!structure) return false;

        if (filterOrg && !structure.organisasi?.toLowerCase().includes(filterOrg)) return false;
        if (filterDir && structure.direktorat !== filterDir) return false;
        if (filterDiv && structure.divisi !== filterDiv) return false;
      }

      return true;
    });
  }, [riskInputEntries, initialFilters, structureEntries]);

  const handleOpenAddModal = () => {
    setEditingRiskData(null);
    setIsModalOpen(true);
  };
  const handleOpenEditModal = (riskData) => {
    setEditingRiskData(riskData);
    setIsModalOpen(true);
  };
  const handleSaveRiskInput = (responseData, isUpdate) => {
    setIsModalOpen(false);
    if (onRiskInputSaveSuccess) onRiskInputSaveSuccess(responseData, isUpdate);
  };

  const handleDeleteRiskInput = async (riskInputId) => {
    if (window.confirm("Anda yakin ingin menghapus data risk input ini?")) {
      try {
        await apiClient.delete(`/risk-inputs/${riskInputId}`);
        if (onRiskInputSaveSuccess) onRiskInputSaveSuccess();
      } catch (error) {
        alert("Gagal menghapus data.");
      }
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      cardRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else document.exitFullscreen();
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  return (
    <>
      <Card className={`border-l-4 border-rose-500 shadow-md ring-1 ring-gray-100 bg-slate-50 ${isFullscreen ? "fixed inset-0 z-50 h-screen overflow-auto m-0 rounded-none" : "relative"}`} ref={cardRef}>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
              <FiList size={24} />
            </div>
            <div>
              <Title>4. Risk Input</Title>
              <Text>Identifikasi dan analisis detail risiko.</Text>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button icon={FiPlus} onClick={handleOpenAddModal} loading={isLoading} variant="secondary" color="rose">
              Tambah Risk Input
            </Button>
            <Button variant="light" icon={isFullscreen ? FiMinimize : FiMaximize} onClick={toggleFullscreen} />
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 border border-rose-100 rounded-xl bg-rose-50/30">
          <div className="col-span-1 md:col-span-4 flex items-center gap-2 text-rose-700 mb-1">
            <FiFilter size={14} />
            <span className="text-xs font-bold uppercase tracking-wider">Filter Data</span>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Organisasi</label>
            <TextInput value={initialFilters.organisasi || ""} onChange={(e) => onFilterChange("organisasi", e.target.value)} placeholder="Filter..." className="mt-1" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Direktorat</label>
            <Select value={initialFilters.direktorat || ""} onValueChange={(value) => onFilterChange("direktorat", value)} className="mt-1">
              <SelectItem value="">Semua</SelectItem>
              {uniqueDirektorat.map((dir) => (
                <SelectItem key={dir} value={dir}>
                  {dir}
                </SelectItem>
              ))}
            </Select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Divisi</label>
            <Select value={initialFilters.divisi || ""} onValueChange={(value) => onFilterChange("divisi", value)} className="mt-1">
              <SelectItem value="">Semua</SelectItem>
              {uniqueDivisi.map((div) => (
                <SelectItem key={div} value={div}>
                  {div}
                </SelectItem>
              ))}
            </Select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Departemen</label>
            <Select value={initialFilters.departemen || ""} onValueChange={(value) => onFilterChange("departemen", value)} className="mt-1">
              <SelectItem value="">Semua</SelectItem>
              {uniqueUnitKerja.map((unit) => (
                <SelectItem key={unit} value={unit}>
                  {unit}
                </SelectItem>
              ))}
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto pb-2">
          <Table className="min-w-[4500px]">
            <TableHead className="text-sm">
              <TableRow className="border-b border-rose-200">
                <TableHeaderCell className="bg-rose-50 text-rose-900 font-bold w-12">No</TableHeaderCell>
                <TableHeaderCell className="bg-rose-50 text-rose-900 font-bold">Kode</TableHeaderCell>
                <TableHeaderCell className="bg-rose-50 text-rose-900 font-bold">Status</TableHeaderCell>
                <TableHeaderCell className="bg-rose-50 text-rose-900 font-bold">Kategori</TableHeaderCell>
                <TableHeaderCell className="bg-rose-50 text-rose-900 font-bold">Unit Kerja</TableHeaderCell>
                <TableHeaderCell className="bg-rose-50 text-rose-900 font-bold min-w-[200px]">Sasaran</TableHeaderCell>
                <TableHeaderCell className="bg-rose-50 text-rose-900 font-bold min-w-[300px]">Kejadian Risiko</TableHeaderCell>
                <TableHeaderCell className="bg-rose-50 text-rose-900 font-bold min-w-[250px]">Akar Penyebab</TableHeaderCell>
                <TableHeaderCell className="bg-rose-50 text-rose-900 font-bold min-w-[200px]">Indikator</TableHeaderCell>
                <TableHeaderCell className="bg-rose-50 text-rose-900 font-bold min-w-[250px]">Kontrol Internal</TableHeaderCell>
                <TableHeaderCell className="bg-rose-50 text-rose-900 font-bold min-w-[250px]">Dampak</TableHeaderCell>
                {/* Inherent */}
                <TableHeaderCell className="bg-rose-100 text-rose-900 font-bold text-center border-l border-rose-200">P (In)</TableHeaderCell>
                <TableHeaderCell className="bg-rose-100 text-rose-900 font-bold text-center">I (In)</TableHeaderCell>
                <TableHeaderCell className="bg-rose-100 text-rose-900 font-bold text-center">Skor</TableHeaderCell>
                {/* Residual */}
                <TableHeaderCell className="bg-blue-50 text-blue-900 font-bold text-center border-l border-blue-200">P (Res)</TableHeaderCell>
                <TableHeaderCell className="bg-blue-50 text-blue-900 font-bold text-center">I (Res)</TableHeaderCell>
                <TableHeaderCell className="bg-blue-50 text-blue-900 font-bold text-center">Skor</TableHeaderCell>
                {/* Lainnya */}
                <TableHeaderCell className="bg-rose-50 text-rose-900 font-bold">Pemilik Risiko</TableHeaderCell>
                <TableHeaderCell className="bg-rose-50 text-rose-900 font-bold min-w-[300px]">Rencana Penanganan</TableHeaderCell>
                <TableHeaderCell className="bg-rose-50 text-rose-900 font-bold sticky right-0 shadow-[-5px_0_10px_-5px_rgba(0,0,0,0.1)] z-10">Aksi</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRiskInputs.length > 0 ? (
                filteredRiskInputs.map((item, index) => {
                  const inherentStyle = getRiskLevelStyle(item.inherent_skor);
                  const residualStyle = getRiskLevelStyle(item.residual_skor);
                  const sasaranLinked = sasaranOptions.find((s) => s.id === item.sasaran_id);

                  return (
                    <TableRow key={item.id} className="hover:bg-rose-50/20 transition-colors text-xs group">
                      <TableCell className="text-center font-medium text-slate-500">{index + 1}</TableCell>
                      <TableCell className="font-mono">{item.kode_risiko}</TableCell>
                      <TableCell>
                        <Badge size="xs" color={item.status_risiko === "Risiko Aktif" ? "blue" : "gray"}>
                          {item.status_risiko}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.kategori_risiko}</TableCell>
                      <TableCell>{item.unit_kerja}</TableCell>
                      <TableCell className="whitespace-normal">{sasaranLinked?.sasaran_kpi || "-"}</TableCell>
                      <TableCell className="whitespace-normal font-medium text-slate-800">{item.deskripsi_risiko}</TableCell>
                      <TableCell className="whitespace-normal">{item.akar_penyebab}</TableCell>
                      <TableCell className="whitespace-normal">{item.indikator_risiko}</TableCell>
                      <TableCell className="whitespace-normal">{item.internal_control}</TableCell>
                      <TableCell className="whitespace-normal">{item.deskripsi_dampak}</TableCell>
                      {/* Inherent */}
                      <TableCell className={`text-center font-semibold border-l border-rose-100 ${inherentStyle.colorClass}`}>{inherentStyle.text}</TableCell>
                      <TableCell className={`text-center font-semibold ${inherentStyle.colorClass}`}>{item.inherent_dampak}</TableCell>
                      <TableCell className={`text-center font-semibold ${inherentStyle.colorClass}`}>{item.inherent_skor}</TableCell>
                      {/* Residual */}
                      <TableCell className={`text-center font-semibold border-l border-blue-100 ${residualStyle.colorClass}`}>{residualStyle.text}</TableCell>
                      <TableCell className={`text-center font-semibold ${residualStyle.colorClass}`}>{item.residual_dampak}</TableCell>
                      <TableCell className={`text-center font-semibold ${residualStyle.colorClass}`}>{item.residual_skor}</TableCell>

                      <TableCell>{item.pemilik_risiko}</TableCell>
                      <TableCell className="whitespace-normal">{item.rencana_penanganan}</TableCell>

                      <TableCell className="sticky right-0 bg-white group-hover:bg-rose-50/20 transition-colors shadow-[-5px_0_10px_-5px_rgba(0,0,0,0.1)] z-10">
                        <div className="flex gap-1">
                          <Button size="xs" variant="light" icon={FiEdit2} color="blue" onClick={() => handleOpenEditModal(item)} />
                          <Button size="xs" variant="light" icon={FiTrash2} color="red" onClick={() => handleDeleteRiskInput(item.id)} />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={25} className="text-center py-8 text-gray-400 italic">
                    Belum ada data.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
      <RiskInputFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaveSuccess={handleSaveRiskInput}
        assessmentId={assessmentId}
        initialData={editingRiskData}
        sasaranOptions={sasaranOptions || []}
        unitKerjaOptions={uniqueUnitKerja || []}
        templateScores={templateScores}
      />
    </>
  );
}

export default RiskInputCard;
