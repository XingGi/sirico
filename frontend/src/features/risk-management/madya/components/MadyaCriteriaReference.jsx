// frontend/src/features/risk-management/madya/components/MadyaCriteriaReference.jsx
import React, { useState, useEffect } from "react";
import { TabGroup, TabList, Tab, TabPanels, TabPanel, Title, Text, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Button, Dialog, DialogPanel, TextInput, Textarea } from "@tremor/react";
import { FiEdit, FiEye } from "react-icons/fi";
import apiClient from "../../../../api/api";
import { toast } from "sonner";

import { initialProbabilityData, initialImpactData, criteriaStyles } from "../../../../data/madyaCriteriaData";

// --- Tambah kelas CSS untuk perataan ---
const cellClassName = "align-middle text-center whitespace-normal border border-slate-300";
const headerClassName = "align-middle text-center whitespace-normal border border-slate-300";
const columnStyle = "w-[220px]";

function MadyaCriteriaReference({ probabilityCriteria = [], impactCriteria = [], onCriteriaSave, readOnly = false }) {
  const [criteriaData, setCriteriaData] = useState(initialProbabilityData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    level: 0,
    parameter: "",
    kemungkinan: "",
    frekuensi: "",
    persentase: "",
  });

  const [impactData, setImpactData] = useState(initialImpactData);
  const [isImpactModalOpen, setIsImpactModalOpen] = useState(false);
  const [impactFormData, setImpactFormData] = useState(null);

  useEffect(() => {
    // setCriteriaData(probabilityCriteria);
    if (probabilityCriteria.length > 0) setCriteriaData(probabilityCriteria);
  }, [probabilityCriteria]);

  useEffect(() => {
    setImpactData(impactCriteria);
  }, [impactCriteria]);

  const handleEditClick = (item) => {
    setFormData(item);
    setIsModalOpen(true);
  };
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const handleSave = async () => {
    if (!formData.id) return;
    try {
      // Panggil API PUT baru kita
      await apiClient.put(`/madya-assessments/criteria/probability/${formData.id}`, formData);
      setIsModalOpen(false);
      if (onCriteriaSave) onCriteriaSave(); // Panggil refresh parent
      toast.success("Kriteria probabilitas berhasil diperbarui.");
    } catch (error) {
      toast.error("Gagal menyimpan: " + (error.response?.data?.msg || "Error"));
    }
  };

  const handleImpactEditClick = (item) => {
    setImpactFormData(item);
    setIsImpactModalOpen(true);
  };

  const handleImpactInputChange = (e) => {
    const { name, value } = e.target;
    setImpactFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImpactSave = async () => {
    if (!impactFormData || !impactFormData.id) return;
    try {
      // Panggil API PUT baru kita
      await apiClient.put(`/madya-assessments/criteria/impact/${impactFormData.id}`, impactFormData);
      setIsImpactModalOpen(false);
      setImpactFormData(null);
      if (onCriteriaSave) onCriteriaSave(); // Panggil refresh parent
      toast.success("Kriteria dampak berhasil diperbarui.");
    } catch (error) {
      toast.error("Gagal menyimpan: " + (error.response?.data?.msg || "Error"));
    }
  };

  return (
    <div className="space-y-6 text-xs">
      {/* --- TABEL PROBABILITAS --- */}
      <div>
        <Title className="text-xl">Kriteria Probabilitas</Title>
        <Table className="mt-2">
          <TableHead>
            <TableRow className="bg-slate-100">
              <TableHeaderCell rowSpan={2} className="align-middle w-16">
                Skala
              </TableHeaderCell>
              <TableHeaderCell rowSpan={2} className="align-middle max-w-xs">
                Parameter
              </TableHeaderCell>
              <TableHeaderCell colSpan={3} className="text-center bg-slate-300">
                Parameter
              </TableHeaderCell>
            </TableRow>
            <TableRow className="bg-slate-100">
              <TableHeaderCell className="max-w-xs">Kemungkinan terjadi</TableHeaderCell>
              <TableHeaderCell className="max-w-xs">Frekuensi kejadian</TableHeaderCell>
              <TableHeaderCell className="max-w-xs">Persentase</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {criteriaData
              .sort((a, b) => b.level - a.level) // Urutkan dari 5 ke 1
              .map((item) => (
                <TableRow key={item.level}>
                  <TableCell className={`font-semibold align-top ${criteriaStyles[`level${item.level}`]}`}>{item.level}</TableCell>
                  <TableCell className="align-top whitespace-normal max-w-xs">
                    <Text>{item.parameter}</Text>
                    {!readOnly && <Button size="xs" variant="light" icon={FiEdit} onClick={() => handleEditClick(item)} className="mt-2 -ml-2 p-1" />}
                  </TableCell>
                  <TableCell className="align-top whitespace-normal max-w-xs">{item.kemungkinan}</TableCell>
                  <TableCell className="align-top whitespace-normal max-w-xs">{item.frekuensi}</TableCell>
                  <TableCell className="align-top whitespace-normal max-w-xs">{item.persentase}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
      <hr className="border-4 border-double" />

      {/* --- TABEL DAMPAK --- */}
      <div>
        <Title className="text-xl">Kriteria Dampak</Title>
        <div className="mt-3 overflow-x-auto">
          <Table className="min-w-[5800px]">
            <TableHead>
              {/* Baris 1: Kuantitatif / Kualitatif (Tidak Berubah) */}
              <TableRow className="bg-slate-100">
                <TableHeaderCell rowSpan={4} className="align-middle !text-center sticky left-0 z-10 bg-slate-100 w-16 border border-slate-300">
                  Skala
                </TableHeaderCell>
                <TableHeaderCell colSpan={3} className={headerClassName}>
                  DAMPAK KUANTITATIF
                </TableHeaderCell>
                <TableHeaderCell colSpan={23} className="text-left border border-slate-300">
                  DAMPAK KUALITATIF
                </TableHeaderCell>
              </TableRow>

              {/* Baris 2: Parameter Induk (Semua Diberi rowSpan={2}) */}
              <TableRow className="bg-slate-100">
                <TableHeaderCell rowSpan={3} className={`${headerClassName} bg-slate-100 ${columnStyle}`}>
                  Kriteria Dampak
                </TableHeaderCell>
                <TableHeaderCell rowSpan={3} className={`${headerClassName} ${columnStyle}`}>
                  Range Dampak Finansial
                </TableHeaderCell>
                <TableHeaderCell rowSpan={3} className={`${headerClassName} ${columnStyle}`}>
                  Deskripsi Dampak
                </TableHeaderCell>
                <TableHeaderCell rowSpan={2} colSpan={1} className={`${headerClassName} bg-slate-200`}>
                  Risiko Strategis
                </TableHeaderCell>
                <TableHeaderCell rowSpan={2} colSpan={1} className={`${headerClassName} bg-slate-300`}>
                  Risiko Hukum
                </TableHeaderCell>
                <TableHeaderCell rowSpan={2} colSpan={1} className={`${headerClassName} bg-slate-200`}>
                  Risiko Kepatuhan
                </TableHeaderCell>
                <TableHeaderCell rowSpan={2} colSpan={3} className={`${headerClassName} bg-slate-300`}>
                  Risiko Reputasi
                </TableHeaderCell>
                <TableHeaderCell rowSpan={2} colSpan={3} className={`${headerClassName} bg-slate-200`}>
                  Risiko Sumber Daya Manusia
                </TableHeaderCell>
                <TableHeaderCell rowSpan={2} colSpan={3} className={`${headerClassName} bg-slate-300`}>
                  Risiko Sistem Infrastruktur Teknologi dan Keamanan Siber
                </TableHeaderCell>
                <TableHeaderCell rowSpan={2} colSpan={1} className={`${headerClassName} bg-slate-200`}>
                  Risiko Operasional
                </TableHeaderCell>
                <TableHeaderCell rowSpan={2} colSpan={5} className={`${headerClassName} bg-slate-300`}>
                  Risiko Health, Safety, Security and Environmental (HSSE) dan Sosial
                </TableHeaderCell>

                <TableHeaderCell rowSpan={2} colSpan={1} className={`${headerClassName} bg-slate-200`}>
                  Risiko Penyertaan Modal Negara (PMN)
                </TableHeaderCell>
                <TableHeaderCell rowSpan={2} colSpan={1} className={`${headerClassName} bg-slate-300`}>
                  Risiko Operasional Khusus Industri Perbankan
                </TableHeaderCell>

                <TableHeaderCell rowSpan={2} colSpan={2} className={`${headerClassName} bg-slate-200`}>
                  Risiko Investasi Khusus Industri Asuransi
                </TableHeaderCell>

                <TableHeaderCell rowSpan={2} colSpan={1} className={`${headerClassName} bg-slate-300`}>
                  Risiko Aktuarial
                </TableHeaderCell>
              </TableRow>

              {/* Baris 3 (SEKARANG KOSONG) */}
              <TableRow className="bg-slate-100"></TableRow>

              {/* Baris 4 (Semua sub-parameter level akhir) */}
              <TableRow className="bg-slate-100">
                {/* Strategis */}
                <TableHeaderCell className={`${headerClassName} ${columnStyle}`}>Dampak keterlambatan pencapaian program strategis</TableHeaderCell>
                {/* Hukum */}
                <TableHeaderCell className={`${headerClassName} ${columnStyle}`}>Pelanggaran hukum</TableHeaderCell>
                {/* Kepatuhan */}
                <TableHeaderCell className={`${headerClassName} ${columnStyle}`}>Pelanggaran ketentuan kepatuhan</TableHeaderCell>

                {/* Reputasi */}
                <TableHeaderCell className={`${headerClassName} ${columnStyle}`}>Keluhan pelanggan / nasabah / pembeli / supplier</TableHeaderCell>
                <TableHeaderCell className={`${headerClassName} ${columnStyle}`}>Pemberitaan negatif di media</TableHeaderCell>
                <TableHeaderCell className={`${headerClassName} ${columnStyle}`}>Kehilangan daya saing</TableHeaderCell>

                {/* SDM */}
                <TableHeaderCell className={`${headerClassName} ${columnStyle}`}>Keluhan karyawan</TableHeaderCell>
                <TableHeaderCell className={`${headerClassName} ${columnStyle}`}>Turn over karyawan bertalenta</TableHeaderCell>
                <TableHeaderCell className={`${headerClassName} ${columnStyle}`}>regretted turnover</TableHeaderCell>

                {/* Sistem */}
                <TableHeaderCell className={`${headerClassName} ${columnStyle}`}>Gangguan aplikasi infrastruktur pendukung</TableHeaderCell>
                <TableHeaderCell className={`${headerClassName} ${columnStyle}`}>Serangan siber</TableHeaderCell>
                <TableHeaderCell className={`${headerClassName} ${columnStyle}`}>Hasil penilaian platform security</TableHeaderCell>

                {/* Operasional */}
                <TableHeaderCell className={`${headerClassName} ${columnStyle}`}>Pelampauan pemenuhan SLA (Service Level Agreement)</TableHeaderCell>
                <TableHeaderCell colSpan={3} className={`${headerClassName} ${columnStyle}`}>
                  Fatality
                </TableHeaderCell>
                <TableHeaderCell className={`${headerClassName} ${columnStyle}`}>Kerusakan Lingkungan</TableHeaderCell>
                <TableHeaderCell className={`${headerClassName} ${columnStyle}`}>Penurunan ESG rating Sustainalytic</TableHeaderCell>

                {/* PMN */}
                <TableHeaderCell className={`${headerClassName} ${columnStyle}`}>Penundaan pencairan PMN</TableHeaderCell>
                {/* Bank */}
                <TableHeaderCell className={`${headerClassName} ${columnStyle}`}>Total jumlah fraud internal dan eksternal</TableHeaderCell>
                <TableHeaderCell colSpan={2} className={`${headerClassName} ${columnStyle}`}>
                  Penurunan aset investasi berdasarkan rating surat utang atau Peringkat bank penerbit deposito
                </TableHeaderCell>

                {/* Aktuarial */}
                <TableHeaderCell className={`${headerClassName} ${columnStyle}`}>Rasio Klaim</TableHeaderCell>
              </TableRow>
            </TableHead>

            {/* --- TableBody (Tidak Berubah, urutan sel sudah benar) --- */}
            <TableBody>
              {impactData
                .sort((a, b) => b.level - a.level) // Urutkan dari 5 ke 1
                .map((item) => (
                  <TableRow key={item.level}>
                    <TableCell className={`font-semibold sticky left-0 z-10 ${criteriaStyles[`level${item.level}`]} ${cellClassName}`}>{item.level}</TableCell>
                    {/* Kuantitatif */}
                    <TableCell className={`${cellClassName} bg-white ${columnStyle}`}>
                      <Text className="text-center">{item.kriteriaDampak}</Text>
                      {!readOnly && <Button size="xs" variant="light" icon={FiEdit} onClick={() => handleImpactEditClick(item)} className="mt-2 mx-auto p-1" />}
                    </TableCell>
                    <TableCell className={`${cellClassName} whitespace-pre-line ${columnStyle}`}>{item.rangeFinansial}</TableCell>
                    <TableCell className={`${cellClassName} ${columnStyle}`}>{item.deskripsiDampak1}</TableCell>
                    {/* Kualitatif (Urutan sel sudah sesuai dengan header Baris 4 yang baru) */}
                    <TableCell className={`${cellClassName} ${columnStyle}`}>{item.stra_dampak}</TableCell>
                    <TableCell className={`${cellClassName} ${columnStyle}`}>{item.hukum_pelanggaran}</TableCell>
                    <TableCell className={`${cellClassName} ${columnStyle}`}>{item.kepat_pelanggaran}</TableCell>
                    <TableCell className={`${cellClassName} ${columnStyle}`}>{item.reput_keluhan}</TableCell>
                    <TableCell className={`${cellClassName} ${columnStyle}`}>{item.reput_berita}</TableCell>
                    <TableCell className={`${cellClassName} ${columnStyle}`}>{item.reput_saing}</TableCell>
                    <TableCell className={`${cellClassName} ${columnStyle}`}>{item.sdm_keluhan}</TableCell>
                    <TableCell className={`${cellClassName} ${columnStyle}`}>{item.sdm_turnover}</TableCell>
                    <TableCell className={`${cellClassName} ${columnStyle}`}>{item.sdm_regretted_turnover}</TableCell>
                    <TableCell className={`${cellClassName} ${columnStyle}`}>{item.sistem_gangguan}</TableCell>
                    <TableCell className={`${cellClassName} ${columnStyle}`}>{item.sistem_siber}</TableCell>
                    <TableCell className={`${cellClassName} ${columnStyle}`}>{item.sistem_platform}</TableCell>
                    <TableCell className={`${cellClassName} ${columnStyle}`}>{item.ops_sla}</TableCell>
                    <TableCell className={`${cellClassName} ${columnStyle}`}>{item.hsse_fatality_1}</TableCell>
                    <TableCell className={`${cellClassName} ${columnStyle}`}>{item.hsse_fatality_2}</TableCell>
                    <TableCell className={`${cellClassName} ${columnStyle}`}>{item.hsse_fatality_3}</TableCell>
                    <TableCell className={`${cellClassName} ${columnStyle}`}>{item.hsse_kerusakan_lingkungan}</TableCell>
                    <TableCell className={`${cellClassName} ${columnStyle}`}>{item.hsse_penurunan_esg}</TableCell>
                    <TableCell className={`${cellClassName} ${columnStyle}`}>{item.pmn_tunda}</TableCell>
                    <TableCell className={`${cellClassName} ${columnStyle}`}>{item.bank_fraud}</TableCell>
                    <TableCell className={`${cellClassName} ${columnStyle}`}>{item.asuransi_aset_rating}</TableCell>
                    <TableCell className={`${cellClassName} ${columnStyle}`}>{item.asuransi_aset_peringkat}</TableCell>
                    <TableCell className={`${cellClassName} ${columnStyle}`}>{item.aktu_rasio}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {!readOnly && (
        <>
          {/* --- MODAL PROBABILITAS --- */}
          <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} static={true}>
            <DialogPanel>
              <Title as="h3">Edit Kriteria Probabilitas (Skala {formData.level})</Title>
              <div className="mt-6 space-y-4">
                <div>
                  <Text>Parameter</Text>
                  <TextInput name="parameter" value={formData.parameter} onChange={handleInputChange} className="mt-1" />
                </div>
                <div>
                  <Text>Kemungkinan terjadi</Text>
                  <Textarea name="kemungkinan" value={formData.kemungkinan} onChange={handleInputChange} className="mt-1" rows={3} />
                </div>
                <div>
                  <Text>Frekuensi kejadian</Text>
                  <Textarea name="frekuensi" value={formData.frekuensi} onChange={handleInputChange} className="mt-1" rows={3} />
                </div>
                <div>
                  <Text>Persentase</Text>
                  <Textarea name="persentase" value={formData.persentase} onChange={handleInputChange} className="mt-1" rows={3} />
                </div>
              </div>
              <div className="mt-8 flex justify-end space-x-2">
                <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                  Batal
                </Button>
                <Button onClick={handleSave}>Simpan</Button>
              </div>
            </DialogPanel>
          </Dialog>

          {/* --- MODAL DAMPAK --- */}
          <Dialog open={isImpactModalOpen} onClose={() => setIsImpactModalOpen(false)} static={true}>
            {impactFormData && (
              <DialogPanel className="max-w-5xl">
                <Title as="h3">Edit Kriteria Dampak (Skala {impactFormData.level})</Title>

                <div className="mt-6 space-y-4 max-h-[70vh] overflow-y-auto pr-4 pl-2 pb-2">
                  <Title as="h5" className="text-tremor-content-strong">
                    Kuantitatif
                  </Title>
                  <div>
                    <Text>Kriteria Dampak</Text>
                    <TextInput name="kriteriaDampak" value={impactFormData.kriteriaDampak} onChange={handleImpactInputChange} className="mt-1" />
                  </div>
                  <div>
                    <Text>Range Dampak Finansial</Text>
                    <Textarea name="rangeFinansial" value={impactFormData.rangeFinansial} onChange={handleImpactInputChange} className="mt-1" rows={3} />
                  </div>
                  <div>
                    <Text>Deskripsi Dampak (Kuantitatif)</Text>
                    <Textarea name="deskripsiDampak1" value={impactFormData.deskripsiDampak1} onChange={handleImpactInputChange} className="mt-1" rows={3} />
                  </div>

                  <hr />
                  <Title as="h5" className="text-tremor-content-strong">
                    Kualitatif
                  </Title>
                  <div>
                    <Text>Risiko Strategis - Dampak keterlambatan...</Text>
                    <Textarea name="stra_dampak" value={impactFormData.stra_dampak} onChange={handleImpactInputChange} className="mt-1" rows={3} />
                  </div>
                  <div>
                    <Text>Risiko Hukum - Pelanggaran hukum</Text>
                    <Textarea name="hukum_pelanggaran" value={impactFormData.hukum_pelanggaran} onChange={handleImpactInputChange} className="mt-1" rows={3} />
                  </div>
                  <div>
                    <Text>Risiko Kepatuhan - Pelanggaran ketentuan...</Text>
                    <Textarea name="kepat_pelanggaran" value={impactFormData.kepat_pelanggaran} onChange={handleImpactInputChange} className="mt-1" rows={3} />
                  </div>

                  <hr />
                  <Title as="h6" className="text-tremor-content-strong">
                    Kualitatif - Reputasi
                  </Title>
                  <div>
                    <Text>Keluhan pelanggan...</Text>
                    <Textarea name="reput_keluhan" value={impactFormData.reput_keluhan} onChange={handleImpactInputChange} className="mt-1" rows={3} />
                  </div>
                  <div>
                    <Text>Pemberitaan negatif...</Text>
                    <Textarea name="reput_berita" value={impactFormData.reput_berita} onChange={handleImpactInputChange} className="mt-1" rows={3} />
                  </div>
                  <div>
                    <Text>Kehilangan daya saing</Text>
                    <Textarea name="reput_saing" value={impactFormData.reput_saing} onChange={handleImpactInputChange} className="mt-1" rows={3} />
                  </div>

                  <hr />
                  <Title as="h6" className="text-tremor-content-strong">
                    Kualitatif - SDM
                  </Title>
                  <div>
                    <Text>Keluhan karyawan</Text>
                    <Textarea name="sdm_keluhan" value={impactFormData.sdm_keluhan} onChange={handleImpactInputChange} className="mt-1" rows={3} />
                  </div>
                  <div>
                    <Text>Turn over karyawan...</Text>
                    <Textarea name="sdm_turnover" value={impactFormData.sdm_turnover} onChange={handleImpactInputChange} className="mt-1" rows={3} />
                  </div>
                  <div>
                    <Text>regretted turnover</Text>
                    <Textarea name="sdm_regretted_turnover" value={impactFormData.sdm_regretted_turnover} onChange={handleImpactInputChange} className="mt-1" rows={3} />
                  </div>

                  <hr />
                  <Title as="h6" className="text-tremor-content-strong">
                    Kualitatif - Sistem & Operasional
                  </Title>
                  <div>
                    <Text>Gangguan aplikasi...</Text>
                    <Textarea name="sistem_gangguan" value={impactFormData.sistem_gangguan} onChange={handleImpactInputChange} className="mt-1" rows={3} />
                  </div>
                  <div>
                    <Text>Serangan siber</Text>
                    <Textarea name="sistem_siber" value={impactFormData.sistem_siber} onChange={handleImpactInputChange} className="mt-1" rows={3} />
                  </div>
                  <div>
                    <Text>Hasil penilaian platform security</Text>
                    <Textarea name="sistem_platform" value={impactFormData.sistem_platform} onChange={handleImpactInputChange} className="mt-1" rows={3} />
                  </div>
                  <div>
                    <Text>Pelampauan pemenuhan SLA...</Text>
                    <Textarea name="ops_sla" value={impactFormData.ops_sla} onChange={handleImpactInputChange} className="mt-1" rows={3} />
                  </div>

                  <hr />
                  <Title as="h6" className="text-tremor-content-strong">
                    Kualitatif - HSSE & PMN
                  </Title>
                  <div>
                    <Text>HSSE - Kasus kematian jamak</Text>
                    <Textarea name="hsse_fatality_1" value={impactFormData.hsse_fatality_1} onChange={handleImpactInputChange} className="mt-1" rows={3} />
                  </div>
                  <div>
                    <Text>HSSE - Wabah ke lingkungan</Text>
                    <Textarea name="hsse_fatality_2" value={impactFormData.hsse_fatality_2} onChange={handleImpactInputChange} className="mt-1" rows={3} />
                  </div>
                  <div>
                    <Text>HSSE - Potensi menyebabkan banyak kematian...</Text>
                    <Textarea name="hsse_fatality_3" value={impactFormData.hsse_fatality_3} onChange={handleImpactInputChange} className="mt-1" rows={3} />
                  </div>
                  <div>
                    <Text>HSSE - Kerusakan Lingkungan</Text>
                    <Textarea name="hsse_kerusakan_lingkungan" value={impactFormData.hsse_kerusakan_lingkungan} onChange={handleImpactInputChange} className="mt-1" rows={3} />
                  </div>
                  <div>
                    <Text>HSSE - Penurunan ESG rating...</Text>
                    <Textarea name="hsse_penurunan_esg" value={impactFormData.hsse_penurunan_esg} onChange={handleImpactInputChange} className="mt-1" rows={3} />
                  </div>
                  <div>
                    <Text>PMN - Penundaan pencairan PMN</Text>
                    <Textarea name="pmn_tunda" value={impactFormData.pmn_tunda} onChange={handleImpactInputChange} className="mt-1" rows={3} />
                  </div>

                  <hr />
                  <Title as="h6" className="text-tremor-content-strong">
                    Kualitatif - Khusus Industri
                  </Title>
                  <div>
                    <Text>Bank - Total jumlah fraud internal dan eksternal</Text>
                    <Textarea name="bank_fraud" value={impactFormData.bank_fraud} onChange={handleImpactInputChange} className="mt-1" rows={3} />
                  </div>
                  <div>
                    <Text>Asuransi - Instrumen pada Investment grade</Text>
                    <Textarea name="asuransi_aset_rating" value={impactFormData.asuransi_aset_rating} onChange={handleImpactInputChange} className="mt-1" rows={3} />
                  </div>
                  <div>
                    <Text>Asuransi - atau Peringkat bank penerbit deposito</Text>
                    <Textarea name="asuransi_aset_peringkat" value={impactFormData.asuransi_aset_peringkat} onChange={handleImpactInputChange} className="mt-1" rows={3} />
                  </div>
                  <div>
                    <Text>Aktuarial - Rasio Klaim</Text>
                    <Textarea name="aktu_rasio" value={impactFormData.aktu_rasio} onChange={handleImpactInputChange} className="mt-1" rows={3} />
                  </div>
                </div>

                <div className="mt-8 flex justify-end space-x-2">
                  <Button variant="secondary" onClick={() => setIsImpactModalOpen(false)}>
                    Batal
                  </Button>
                  <Button onClick={handleImpactSave}>Simpan</Button>
                </div>
              </DialogPanel>
            )}
          </Dialog>
        </>
      )}
      {/* --- AKHIR PERUBAHAN 4 --- */}
    </div>
  );
}

export default MadyaCriteriaReference;
