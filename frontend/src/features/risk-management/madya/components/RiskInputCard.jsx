// frontend/src/features/risk-management/madya/components/RiskInputCard.jsx
import React, { useState, useMemo, useEffect } from "react";
import { Card, Title, Text, Button, TextInput, Select, SelectItem, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Badge } from "@tremor/react";
import { FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi";
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
    return date.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (e) {
    console.error("Error formatting date:", dateString, e);
    return "-";
  }
};

const getRiskLevelStyle = (score) => {
  if (score === null || score === undefined) return { text: "#N/A", colorClass: "bg-gray-200 text-gray-500" };
  if (score >= 20) return { text: String(score), colorClass: "bg-red-600 text-white" }; // E
  if (score >= 16) return { text: String(score), colorClass: "bg-orange-500 text-white" }; // H
  if (score >= 12) return { text: String(score), colorClass: "bg-yellow-400 text-black" }; // M
  if (score >= 6) return { text: String(score), colorClass: "bg-lime-400 text-black" }; // L
  if (score >= 1) return { text: String(score), colorClass: "bg-green-500 text-white" }; // R
  return { text: "#N/A", colorClass: "bg-gray-200 text-gray-500" };
};

const statusPenangananColors = {
  Open: "gray",
  "In Progress": "orange",
  Done: "emerald",
  Cancelled: "rose",
  "-": "gray", // Default
};

function RiskInputCard({ assessmentId, structureEntries = [], sasaranKPIEntries = [], templateScores = [], onRiskInputSaveSuccess, initialFilters, onFilterChange, initialRiskInputData = [], isDataLoading = false }) {
  console.log("RiskInputCard rendered/updated. Received structureEntries:", structureEntries);
  console.log("RiskInputCard received templateScores:", templateScores);
  const uniqueDirektorat = useMemo(() => [...new Set(structureEntries.map((e) => e.direktorat).filter(Boolean))], [structureEntries]);
  const uniqueDivisi = useMemo(() => [...new Set(structureEntries.map((e) => e.divisi).filter(Boolean))], [structureEntries]);
  const uniqueUnitKerja = useMemo(() => [...new Set(structureEntries.map((e) => e.unit_kerja).filter(Boolean))], [structureEntries]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRiskData, setEditingRiskData] = useState(null);
  const [sasaranOptions, setSasaranOptions] = useState([]);
  const riskInputEntries = initialRiskInputData;
  const isLoading = isDataLoading;

  console.log("Unique Direktorat:", uniqueDirektorat);
  console.log("Unique Divisi:", uniqueDivisi);
  console.log("Unique Unit Kerja:", uniqueUnitKerja);
  console.log("Direktorat disabled?", uniqueDirektorat.length === 0);

  useEffect(() => {
    // Logika untuk mengisi sasaranOptions dari props sasaranKPIEntries
    const validSasaranProps = Array.isArray(sasaranKPIEntries) ? sasaranKPIEntries : [];
    if (validSasaranProps.length > 0) {
      setSasaranOptions(validSasaranProps.map((s) => ({ id: s.id, sasaran_kpi: s.sasaran_kpi })));
    } else {
      setSasaranOptions([]);
    }
  }, [sasaranKPIEntries]);

  const handleOpenAddModal = () => {
    setEditingRiskData(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (riskData) => {
    setEditingRiskData(riskData);
    setIsModalOpen(true);
  };

  const handleSaveRiskInput = (responseData, isUpdate) => {
    console.log("Data diterima di RiskInputCard handleSaveRiskInput:", responseData);
    setIsModalOpen(false);

    if (onRiskInputSaveSuccess) {
      onRiskInputSaveSuccess(responseData, isUpdate);
    }
  };

  const handleDeleteRiskInput = async (riskInputId) => {
    if (window.confirm("Anda yakin ingin menghapus data risk input ini?")) {
      try {
        await apiClient.delete(`/risk-inputs/${riskInputId}`);
        alert("Data Risk Input berhasil dihapus.");
        if (onRiskInputSaveSuccess) {
          onRiskInputSaveSuccess();
        }
      } catch (error) {
        alert("Gagal menghapus data: " + (error.response?.data?.msg || "Error"));
      } finally {
        setIsLoading(false);
      }
    }
  };

  const getSasaranText = (sasaranId) => {
    const found = sasaranOptions.find((s) => s.id === sasaranId);
    return found?.sasaran_kpi || "-";
  };

  return (
    <>
      <Card>
        <div className="flex justify-between items-center mb-4">
          <div>
            <Title as="h3">4. Risk Input</Title>
            <Text>Identifikasi dan analisis detail risiko untuk unit kerja terpilih.</Text>
          </div>
          <Button icon={FiPlus} onClick={handleOpenAddModal} loading={isLoading}>
            Tambah Risk Input
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 border rounded-lg bg-slate-50">
          <div>
            <label className="text-sm font-medium text-gray-700">Organisasi</label>
            <TextInput value={initialFilters.organisasi || ""} onChange={(e) => onFilterChange("organisasi", e.target.value)} placeholder="Nama Perusahaan..." className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Direktorat</label>
            <Select value={initialFilters.direktorat || ""} onValueChange={(value) => onFilterChange("direktorat", value)} className="mt-1" disabled={uniqueDirektorat.length === 0}>
              <SelectItem value="">Pilih Direktorat...</SelectItem>
              {uniqueDirektorat.map((dir) => (
                <SelectItem key={dir} value={dir}>
                  {dir}
                </SelectItem>
              ))}
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Divisi</label>
            <Select value={initialFilters.divisi || ""} onValueChange={(value) => onFilterChange("divisi", value)} className="mt-1" disabled={uniqueDivisi.length === 0}>
              <SelectItem value="">Pilih Divisi...</SelectItem>
              {uniqueDivisi.map((div) => (
                <SelectItem key={div} value={div}>
                  {div}
                </SelectItem>
              ))}
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Departemen</label>
            <Select value={initialFilters.departemen || ""} onValueChange={(value) => onFilterChange("departemen", value)} className="mt-1" disabled={uniqueUnitKerja.length === 0}>
              <SelectItem value="">Pilih Unit Kerja...</SelectItem>
              {uniqueUnitKerja.map((unit) => (
                <SelectItem key={unit} value={unit}>
                  {unit}
                </SelectItem>
              ))}
            </Select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table className="min-w-[4500px] mt-4">
            <TableHead>
              <TableRow className="bg-gray-100 text-xs">
                {/* Header Kolom Lengkap */}
                <TableHeaderCell className="w-12">No</TableHeaderCell>
                <TableHeaderCell>Kode Risiko</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Ancaman/Peluang</TableHeaderCell>
                <TableHeaderCell>Kategori Risiko</TableHeaderCell>
                <TableHeaderCell>Unit Kerja</TableHeaderCell>
                <TableHeaderCell className="min-w-[200px]">Sasaran</TableHeaderCell>
                <TableHeaderCell>Tgl Identifikasi</TableHeaderCell>
                <TableHeaderCell className="min-w-[300px]">Deskripsi Risiko</TableHeaderCell>
                <TableHeaderCell className="min-w-[250px]">Akar Penyebab</TableHeaderCell>
                <TableHeaderCell className="min-w-[200px]">Indikator</TableHeaderCell>
                <TableHeaderCell className="min-w-[250px]">Kontrol Internal</TableHeaderCell>
                <TableHeaderCell className="min-w-[250px]">Deskripsi Dampak</TableHeaderCell>
                <TableHeaderCell className="text-center">P (In)</TableHeaderCell>
                <TableHeaderCell className="text-center">I (In)</TableHeaderCell>
                <TableHeaderCell className="text-center">Skor (In)</TableHeaderCell>
                <TableHeaderCell className="text-center">Prob Kualitatif (%) In</TableHeaderCell>
                <TableHeaderCell className="text-center">Dampak Finansial (Rp) In</TableHeaderCell>
                <TableHeaderCell className="text-center">Nilai Bersih (Rp) In</TableHeaderCell>
                <TableHeaderCell>Pemilik Risiko</TableHeaderCell>
                <TableHeaderCell>Jabatan Pemilik</TableHeaderCell>
                <TableHeaderCell>Kontak HP</TableHeaderCell>
                <TableHeaderCell>Kontak Email</TableHeaderCell>
                <TableHeaderCell>Strategi</TableHeaderCell>
                <TableHeaderCell className="min-w-[300px]">Rencana Penanganan</TableHeaderCell>
                <TableHeaderCell className="text-center">Biaya Penanganan (Rp)</TableHeaderCell>
                <TableHeaderCell className="min-w-[250px]">Penanganan Dilakukan</TableHeaderCell>
                <TableHeaderCell>Status Penanganan</TableHeaderCell>
                <TableHeaderCell>Jadwal Mulai</TableHeaderCell>
                <TableHeaderCell>Jadwal Selesai</TableHeaderCell>
                <TableHeaderCell>PIC Penanganan</TableHeaderCell>
                <TableHeaderCell className="text-center">P (Res)</TableHeaderCell>
                <TableHeaderCell className="text-center">I (Res)</TableHeaderCell>
                <TableHeaderCell className="text-center">Skor (Res)</TableHeaderCell>
                <TableHeaderCell className="text-center">Prob Kualitatif (%) Res</TableHeaderCell>
                <TableHeaderCell className="text-center">Dampak Finansial (Rp) Res</TableHeaderCell>
                <TableHeaderCell className="text-center">Nilai Bersih (Rp) Res</TableHeaderCell>
                <TableHeaderCell>Tgl Review</TableHeaderCell>
                <TableHeaderCell>Aksi</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={24} className="text-center py-5">
                    <Text>Memuat data...</Text>
                  </TableCell>
                </TableRow>
              ) : riskInputEntries.length > 0 ? (
                riskInputEntries.map((item, index) => {
                  const inherentStyle = getRiskLevelStyle(item.inherent_skor);
                  const residualStyle = getRiskLevelStyle(item.residual_skor);
                  const sasaranLinked = Array.isArray(sasaranOptions) ? sasaranOptions.find((s) => s.id === item.sasaran_id) : null;
                  const kategoriDisplay = item.kategori_risiko === "Risiko Lainnya" && item.kategori_risiko_lainnya ? item.kategori_risiko_lainnya : item.kategori_risiko;
                  const statusPenangananColor = statusPenangananColors[item.status_penanganan || "-"] || "gray";

                  return (
                    <TableRow key={item.id} className="text-xs [&>td]:py-1 [&>td]:px-2">
                      <TableCell className="text-center">{index + 1}</TableCell>
                      <TableCell>{item.kode_risiko}</TableCell>
                      <TableCell>
                        <Badge color={item.status_risiko === "Risiko Aktif" ? "blue" : "gray"}>{item.status_risiko}</Badge>
                      </TableCell>
                      <TableCell>{item.peluang_ancaman}</TableCell>
                      <TableCell>{item.kategori_risiko === "Risiko Lainnya" ? item.kategori_risiko_lainnya : item.kategori_risiko}</TableCell>
                      <TableCell>{item.unit_kerja}</TableCell>
                      <TableCell className="whitespace-normal">{sasaranLinked?.sasaran_kpi || "-"}</TableCell>
                      <TableCell>{item.tanggal_identifikasi ? new Date(item.tanggal_identifikasi).toLocaleDateString("id-ID") : "-"}</TableCell>
                      <TableCell className="whitespace-normal">{item.deskripsi_risiko}</TableCell>
                      <TableCell className="whitespace-normal">{item.akar_penyebab}</TableCell>
                      <TableCell className="whitespace-normal">{item.indikator_risiko}</TableCell>
                      <TableCell className="whitespace-normal">{item.internal_control}</TableCell>
                      <TableCell className="whitespace-normal">{item.deskripsi_dampak}</TableCell>
                      <TableCell className={`text-center font-semibold ${inherentStyle.colorClass}`}>{item.inherent_probabilitas}</TableCell>
                      <TableCell className={`text-center font-semibold ${inherentStyle.colorClass}`}>{item.inherent_dampak}</TableCell>
                      <TableCell className={`text-center font-semibold ${inherentStyle.colorClass}`}>{inherentStyle.text}</TableCell>
                      <TableCell className="text-right">{item.inherent_prob_kualitatif !== null ? `${item.inherent_prob_kualitatif}%` : "-"}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">{formatCurrency(item.inherent_dampak_finansial)}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">{formatCurrency(item.inherent_nilai_bersih)}</TableCell>
                      <TableCell>{item.pemilik_risiko || "-"}</TableCell>
                      <TableCell>{item.jabatan_pemilik || "-"}</TableCell>
                      <TableCell>{item.kontak_pemilik_hp || "-"}</TableCell>
                      <TableCell>{item.kontak_pemilik_email || "-"}</TableCell>
                      <TableCell>{item.strategi}</TableCell>
                      <TableCell className="whitespace-normal">{item.rencana_penanganan}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">{formatCurrency(item.biaya_penanganan)}</TableCell>
                      <TableCell className="whitespace-normal">{item.penanganan_dilakukan || "-"}</TableCell>
                      <TableCell>
                        <Badge color={item.status_penanganan === "Done" ? "emerald" : "orange"}>{item.status_penanganan || "-"}</Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{formatDate(item.jadwal_mulai_penanganan)}</TableCell>
                      <TableCell className="whitespace-nowrap">{formatDate(item.jadwal_selesai_penanganan)}</TableCell>
                      <TableCell>{item.pic_penanganan}</TableCell>
                      <TableCell className={`text-center font-semibold ${residualStyle.colorClass}`}>{item.residual_probabilitas ?? "-"}</TableCell>
                      <TableCell className={`text-center font-semibold ${residualStyle.colorClass}`}>{item.residual_dampak ?? "-"}</TableCell>
                      <TableCell className={`text-center font-semibold ${residualStyle.colorClass}`}>{residualStyle.text}</TableCell>
                      <TableCell className="text-right">{item.residual_prob_kualitatif !== null ? `${item.residual_prob_kualitatif}%` : "-"}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">{formatCurrency(item.residual_dampak_finansial)}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">{formatCurrency(item.residual_nilai_bersih)}</TableCell>
                      <TableCell className="whitespace-nowrap">{formatDate(item.tanggal_review)}</TableCell>
                      <TableCell className="sticky right-0 bg-white z-10 flex gap-1 p-1">
                        <Button size="xs" variant="light" icon={FiEdit2} color="blue" onClick={() => handleOpenEditModal(item)} />
                        <Button size="xs" variant="light" icon={FiTrash2} color="red" onClick={() => handleDeleteRiskInput(item.id)} loading={isLoading} />
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={24} className="text-center py-5">
                    <Text>Belum ada data risk input yang ditambahkan.</Text>
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
