// frontend/src/features/risk-management/madya/components/RiskInputCard.jsx
import React, { useState, useMemo, useEffect } from "react";
import { Card, Title, Text, Button, TextInput, Select, SelectItem, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Badge } from "@tremor/react";
import { FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi";
import apiClient from "../../../../api/api";
import RiskInputFormModal from "./RiskInputFormModal";

const getRiskLevelStyle = (score) => {
  if (score === null || score === undefined) return { text: "#N/A", colorClass: "bg-gray-200 text-gray-500" };
  if (score >= 20) return { text: String(score), colorClass: "bg-red-600 text-white" }; // E
  if (score >= 16) return { text: String(score), colorClass: "bg-orange-500 text-white" }; // H
  if (score >= 12) return { text: String(score), colorClass: "bg-yellow-400 text-black" }; // M
  if (score >= 6) return { text: String(score), colorClass: "bg-lime-400 text-black" }; // L
  if (score >= 1) return { text: String(score), colorClass: "bg-green-500 text-white" }; // R
  return { text: "#N/A", colorClass: "bg-gray-200 text-gray-500" };
};

function RiskInputCard({ assessmentId, structureEntries = [], sasaranKPIEntries = [], templateScores = [], onRiskInputSaveSuccess, initialFilters, onFilterChange, initialRiskInputData = [], isDataLoading = false }) {
  console.log("RiskInputCard rendered/updated. Received structureEntries:", structureEntries);
  console.log("RiskInputCard received templateScores:", templateScores);
  // const [organisasi, setOrganisasi] = useState("");
  // const [selectedDirektorat, setSelectedDirektorat] = useState("");
  // const [selectedDivisi, setSelectedDivisi] = useState("");
  // const [selectedDepartemen, setSelectedDepartemen] = useState("");
  const uniqueDirektorat = useMemo(() => [...new Set(structureEntries.map((e) => e.direktorat).filter(Boolean))], [structureEntries]);
  const uniqueDivisi = useMemo(() => [...new Set(structureEntries.map((e) => e.divisi).filter(Boolean))], [structureEntries]);
  const uniqueUnitKerja = useMemo(() => [...new Set(structureEntries.map((e) => e.unit_kerja).filter(Boolean))], [structureEntries]);

  // const [riskInputEntries, setRiskInputEntries] = useState([]);
  // const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRiskData, setEditingRiskData] = useState(null); // Untuk data edit
  const [sasaranOptions, setSasaranOptions] = useState([]);
  const riskInputEntries = initialRiskInputData;
  const isLoading = isDataLoading;

  console.log("Unique Direktorat:", uniqueDirektorat);
  console.log("Unique Divisi:", uniqueDivisi);
  console.log("Unique Unit Kerja:", uniqueUnitKerja);
  console.log("Direktorat disabled?", uniqueDirektorat.length === 0);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const riskResponse = await apiClient.get(`/madya-assessments/${assessmentId}/risk-inputs`);
        setRiskInputEntries(riskResponse.data);
        const validSasaranProps = Array.isArray(sasaranKPIEntries) ? sasaranKPIEntries : [];
        if (validSasaranProps.length > 0) {
          console.log("Menggunakan sasaranKPIEntries dari props:", validSasaranProps);
          setSasaranOptions(validSasaranProps.map((s) => ({ id: s.id, sasaran_kpi: s.sasaran_kpi })));
        } else {
          // Jika props kosong, fetch ulang (sebagai fallback)
          console.log("sasaranKPIEntries dari props kosong/bukan array, fetch ulang...");
          const sasaranResponse = await apiClient.get(`/madya-assessments/${assessmentId}/sasaran-kpi`);
          if (Array.isArray(sasaranResponse.data)) {
            setSasaranOptions(sasaranResponse.data.map((s) => ({ id: s.id, sasaran_kpi: s.sasaran_kpi })));
          } else {
            console.error("API /sasaran-kpi tidak mengembalikan array:", sasaranResponse.data);
            setSasaranOptions([]);
          }
        }
      } catch (error) {
        console.error("Gagal memuat data Risk Input:", error);
        setSasaranOptions([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (assessmentId) {
      fetchData();
    } else {
      setRiskInputEntries([]);
      setSasaranOptions([]);
      setIsLoading(false);
    }
  }, [assessmentId, sasaranKPIEntries]); // Tambahkan sasaranKPIEntries sebagai dependency

  const handleOpenAddModal = () => {
    setEditingRiskData(null); // Pastikan mode tambah
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (riskData) => {
    setEditingRiskData(riskData); // Set data untuk diedit
    setIsModalOpen(true);
  };

  const handleSaveRiskInput = (savedEntry, isUpdate) => {
    console.log("Data diterima di RiskInputCard handleSaveRiskInput:", savedEntry);
    // if (isUpdate) {
    //   setRiskInputEntries((prev) => prev.map((entry) => (entry.id === savedEntry.id ? savedEntry : entry)));
    // } else {
    //   setRiskInputEntries((prev) => [...prev, savedEntry]);
    // }
    setIsModalOpen(false); // Tutup modal otomatis

    if (onRiskInputSaveSuccess) {
      onRiskInputSaveSuccess(); // Panggil callback refresh dari parent
    }
  };

  const handleDeleteRiskInput = async (riskInputId) => {
    if (window.confirm("Anda yakin ingin menghapus data risk input ini?")) {
      // setIsLoading(true);
      try {
        await apiClient.delete(`/risk-inputs/${riskInputId}`);
        // setRiskInputEntries((prev) => prev.filter((entry) => entry.id !== riskInputId));
        alert("Data Risk Input berhasil dihapus.");
        if (onRiskInputSaveSuccess) {
          onRiskInputSaveSuccess(); // Panggil refresh setelah hapus
        }
      } catch (error) {
        alert("Gagal menghapus data: " + (error.response?.data?.msg || "Error"));
      } finally {
        setIsLoading(false);
      }
    }
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
            <TextInput
              value={initialFilters.organisasi || ""} // Gunakan dari props
              onChange={(e) => onFilterChange("organisasi", e.target.value)} // Panggil handler props
              placeholder="Nama Perusahaan..."
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Direktorat</label>
            <Select
              value={initialFilters.direktorat || ""} // Gunakan dari props
              onValueChange={(value) => onFilterChange("direktorat", value)} // Panggil handler props
              className="mt-1"
              disabled={uniqueDirektorat.length === 0}
            >
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
            <Select
              value={initialFilters.divisi || ""} // Gunakan dari props
              onValueChange={(value) => onFilterChange("divisi", value)} // Panggil handler props
              className="mt-1"
              disabled={uniqueDivisi.length === 0}
            >
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
            <Select
              value={initialFilters.departemen || ""} // Gunakan dari props
              onValueChange={(value) => onFilterChange("departemen", value)} // Panggil handler props
              className="mt-1"
              disabled={uniqueUnitKerja.length === 0}
            >
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
          <Table className="min-w-[3000px] mt-4">
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
                <TableHeaderCell>Strategi</TableHeaderCell>
                <TableHeaderCell className="min-w-[300px]">Rencana Penanganan</TableHeaderCell>
                <TableHeaderCell>Status Penanganan</TableHeaderCell>
                <TableHeaderCell>PIC</TableHeaderCell>
                <TableHeaderCell className="text-center">P (Res)</TableHeaderCell>
                <TableHeaderCell className="text-center">I (Res)</TableHeaderCell>
                <TableHeaderCell className="text-center">Skor (Res)</TableHeaderCell>
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
                      <TableCell>{item.strategi}</TableCell>
                      <TableCell className="whitespace-normal">{item.rencana_penanganan}</TableCell>
                      <TableCell>
                        <Badge color={item.status_penanganan === "Done" ? "emerald" : "orange"}>{item.status_penanganan || "-"}</Badge>
                      </TableCell>
                      <TableCell>{item.pic_penanganan}</TableCell>
                      <TableCell className={`text-center font-semibold ${residualStyle.colorClass}`}>{item.residual_probabilitas ?? "-"}</TableCell>
                      <TableCell className={`text-center font-semibold ${residualStyle.colorClass}`}>{item.residual_dampak ?? "-"}</TableCell>
                      <TableCell className={`text-center font-semibold ${residualStyle.colorClass}`}>{residualStyle.text}</TableCell>
                      <TableCell className="flex gap-1">
                        {/* <Button.Group> */}
                        <Button size="xs" variant="light" icon={FiEdit2} color="blue" onClick={() => handleOpenEditModal(item)} />
                        <Button size="xs" variant="light" icon={FiTrash2} color="red" onClick={() => handleDeleteRiskInput(item.id)} loading={isLoading} />
                        {/* </Button.Group> */}
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
