// frontend/src/features/risk-management/madya/components/MadyaCriteriaReference.jsx
import React, { useState, useEffect } from "react";
import { TabGroup, TabList, Tab, TabPanels, TabPanel, Title, Text, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Button, Dialog, DialogPanel, TextInput, Textarea } from "@tremor/react";
import { FiEdit, FiEye } from "react-icons/fi";
import apiClient from "../../../../api/api";

const initialProbabilityData = [
  {
    level: 5,
    parameter: "Hampir Pasti Terjadi",
    kemungkinan: "Risiko pernah terjadi sekali dalam 1 bulan",
    frekuensi: "> 10% dari frekuensi kejadian / jumlah transaksi",
    persentase: "Probabilitas kejadian Risiko antara 80% sampai dengan 100%",
  },
  {
    level: 4,
    parameter: "Sangat Mungkin Terjadi",
    kemungkinan: "Risiko pernah terjadi sekali dalam 2 bulan",
    frekuensi: "Diatas 5 s/d 10% dari frekuensi kejadian / jumlah transaksi",
    persentase: "Probabilitas kejadian Risiko antara 60% sampai dengan 80%",
  },
  {
    level: 3,
    parameter: "Bisa Terjadi",
    kemungkinan: "Risiko pernah terjadi namun tidak sering, sekali dalam 4 bulan",
    frekuensi: "Diatas 1% s/d 5% dari frekuensi kejadian / jumlah transaksi",
    persentase: "Probabilitas kejadian Risiko antara 40% sampai dengan 60%",
  },
  {
    level: 2,
    parameter: "Jarang Terjadi",
    kemungkinan: "Risiko mungkin terjadi hanya sekali dalam 6 bulan",
    frekuensi: "Dari 1 permil s/d 1% dari frekuensi kejadian / jumlah transaksi",
    persentase: "Probabilitas kejadian Risiko dari 20% sampai dengan 40%",
  },
  {
    level: 1,
    parameter: "Sangat Jarang Terjadi",
    kemungkinan: "Risiko mungkin terjadi sangat jarang, paling banyak satu kali dalam setahun",
    frekuensi: "< 1 permil dari frekuensi kejadian / jumlah transaksi",
    persentase: "Probabilitas kejadian Risiko lebih kecil dari 20%",
  },
];

const initialImpactData = [
  // SKALA 5
  {
    level: 5,
    kriteriaDampak: "Sangat Tinggi",
    rangeFinansial: "X > 80%\ndari Batasan Risiko",
    deskripsiDampak1: "Dampak katastrofe yang dapat mengakibatkan kerusakan/ kerugian/ penurunan > 80% dari nilai Batasan Risiko",
    stra_dampak: "Minimal 1 parameter tujuan strategis yang harus selesai pada tahun ini tertunda lebih dari 9 bulan",
    hukum_pelanggaran: "Perusahaan diputuskan kalah di pengadilan tingkat selanjutnya.",
    kepat_pelanggaran: "Regulator memberlaku-kan sanksi signifikan (misalkan delisting saham, tidak diperkenan-kan mengikuti kliring, menarik produk yang beredar, dan lain-lain)",
    reput_keluhan: "Keluhan yang menyebar ke skala nasional / internasional dan / atau diajukan secara kolektif yang diselesaikan melebihi 10 hari kerja dan / atau memerlukan penanganan kewenangan Kantor Pusat",
    reput_berita: "Publikasi negatif mencapai skala internasional yang tersebar di sosial media dan / atau memerlukan penanganan kewenangan Kantor Pusat",
    reput_saing: "Penurunan pangsa pasar lebih dari 20%",
    sdm_keluhan: "Demonstrasi terkoordinasi, terjadinya kematian karyawan saat kerja",
    sdm_turnover: "Turn over pegawai bertalenta >15% setahun",
    sdm_regretted_turnover: "Turn over pegawai bertalenta >15% setahun",
    sistem_gangguan: "Infrastruktur vital yang penting tidak berfungsi selama lebih dari 6 jam (misalkan Listrik, air, jaringan komunikasi & online system)",
    sistem_siber: "Jumlah rata-rata serangan siber per minggu lebih dari 500 kali",
    sistem_platform: "X ≤ 60%",
    ops_sla: ">20% dari standard SLA yang telah ditetapkan (diukur dari waktu kekosongan atau ketidaksedia-an layanan produk atau tambahan biaya / ongkos)",
    hsse_fatality_1: "Kasus kematian jamak",
    hsse_fatality_2: "Wabah ke lingkungan",
    hsse_fatality_3: "Potensi menyebabkan banyak kematian misalnya bahan kimia beracun berbahaya",
    hsse_kerusakan_lingkungan: "Sangat serius kerusakan jangka panjang (>5 tahun) dan fungsi ekosistem",
    hsse_penurunan_esg: "X < 60% atau memperoleh rating '40+ (severe)'",
    pmn_tunda: "Tertunda > 4 bulan dari target RKAP",
    bank_fraud: "X > 1.400",
    asuransi_aset_rating: "Instrumen pada Investment grade < 70%",
    asuransi_aset_peringkat: "atau Peringkat di bawah BBB (yang setara atau tidak diperingkat)",
    aktu_rasio: "Rasio klaim > 100%",
  },
  // SKALA 4
  {
    level: 4,
    kriteriaDampak: "Tinggi",
    rangeFinansial: "60% < X ≤ 80%\ndari Batasan Risiko",
    deskripsiDampak1: "Dampak signifikan yang dapat mengakibatkan kerusakan/ kerugian/ penurunan 60% - 80% dari nilai Batasan Risiko",
    stra_dampak: "Minimal 1 parameter tujuan strategis yang harus selesai pada tahun ini tertunda 6 s/d 9 bulan",
    hukum_pelanggaran: "Perusahaan diputuskan kalah di pengadilan tingkat pertama.",
    kepat_pelanggaran: "Regulator memberlaku-kan pembatasan dan / atau pembekuan terhadap aktivitas operasional / produk / jasa tertentu.",
    reput_keluhan: "Terdapat keluhan pelanggan/ nasabah/ pembeli/ supplier yang signifikan dan dipublikasikan di media massa nasional/ internasional",
    reput_berita: "Pemberitaan negatif di media massa nasional dan media sosial yang signifikan, menjadi isu utama, dan mudah ditangani",
    reput_saing: "Kehilangan daya saing signifikan yang ditunjukkan dengan penurunan pangsa pasar 5% - 10%",
    sdm_keluhan: "Terdapat keluhan karyawan yang menimbulkan gangguan operasional ringan di satu unit",
    sdm_turnover: "Turn over karyawan bertalenta (regretted turnover) 5% - 7%",
    sdm_regretted_turnover: "Turn over pegawai bertalenta antara 10% sampai dengan 15% setahun",
    sistem_gangguan: "Infrastruktur vital yang penting tidak berfungsi selama 2 s/d 6 jam (misalkan Listrik, air, jaringan komunikasi & online system)",
    sistem_siber: "Jumlah rata-rata serangan siber per minggu 200-500 kali",
    sistem_platform: "70% ≥ X > 60%",
    ops_sla: "Antara 10% s/d 20% dari standard SLA yang telah ditetapkan (diukur dari waktu kekosongan atau ketidaksedia-an layanan produk atau tambahan biaya / ongkos)",
    hsse_fatality_1: "Kasus kematian tunggal / Cacat tetap / Ketidakhadir-an kerja yang lama",
    hsse_fatality_2: "Efek ireversibel yang menyebabkan kematian",
    hsse_fatality_3: "[Data L4F3]",
    hsse_kerusakan_lingkungan: "Efek lingkungan jangka menengah (3-5 tahun) yang serius",
    hsse_penurunan_esg: "70% ≥ X > 60% atau memperoleh rating '30-40 (high)'",
    pmn_tunda: "Tertunda 3 bulan dari target RKAP",
    bank_fraud: "1.201 < X ≤ 1.400",
    asuransi_aset_rating: "70% ≤ Instrumen pada Investment grade < 80%",
    asuransi_aset_peringkat: "atau Peringkat BBB (yang setara)",
    aktu_rasio: "90% < Rasio klaim ≤ 100%",
  },
  // SKALA 3
  {
    level: 3,
    kriteriaDampak: "Sedang",
    rangeFinansial: "40% < X ≤ 60%\ndari Batasan Risiko",
    deskripsiDampak1: "Dampak sedang yang dapat mengakibatkan kerusakan/ kerugian/ penurunan 40% - 60% dari nilai Batasan Risiko",
    stra_dampak: "Minimal 1 parameter tujuan strategis yang harus selesai pada tahun ini tertunda 3 s/d 6 bulan",
    hukum_pelanggaran: "Perusahaan mendapat tuntutan hukum.",
    kepat_pelanggaran: "Peringatan tertulis / formal, terkena denda.",
    reput_keluhan: "Terdapat keluhan pelanggan/ nasabah/ pembeli/ supplier yang cukup signifikan dan dipublikasikan di media massa lokal",
    reput_berita: "Pemberitaan negatif di media massa lokal dan media sosial yang cukup signifikan, namun tidak menjadi isu utama",
    reput_saing: "Kehilangan daya saing cukup signifikan yang ditunjukkan dengan penurunan pangsa pasar 1% - 5%",
    sdm_keluhan: "Terdapat keluhan karyawan yang memerlukan eskalasi luas (sampai tingkat Direksi) untuk penyelesaian",
    sdm_turnover: "Turn over karyawan bertalenta (regretted turnover) 3% - 5%",
    sdm_regretted_turnover: "Turn over pegawai bertalenta antara 5% sampai dengan 10% setahun",
    sistem_gangguan: "Infrastruktur vital yang penting tidak berfungsi selama < 1 jam (misalkan Listrik, air, jaringan komunikasi & online system)",
    sistem_siber: "Jumlah rata-rata serangan siber per minggu 100-199 kali",
    sistem_platform: "80 % ≥ X > 70%",
    ops_sla: "Antara 2,5% s/d 10% dari standard SLA yang telah ditetapkan (diukur dari waktu kekosongan atau ketidaksedia-an layanan produk atau tambahan biaya / ongkos)",
    hsse_fatality_1: "Cacat tidak tetap / Ketidakhadir-an kerja yang terbatas",
    hsse_fatality_2: "Efek ireversibel tanpa kehilangan nyawa tetapi dengan cacat serius dan rawat inap berkepanjangan",
    hsse_fatality_3: "[Data L3F3]",
    hsse_kerusakan_lingkungan: "Efek jangka pendek (1-2 tahun) tetapi tidak mempengaruhi fungsi ekosistem",
    hsse_penurunan_esg: "80 % ≥ X > 70% atau memperoleh rating '20-30 (medium)'",
    pmn_tunda: "Tertunda 2 bulan dari target RKAP",
    bank_fraud: "1.001 < X ≤ 1.200",
    asuransi_aset_rating: "80% ≤ Instrumen pada Investment grade < 90%",
    asuransi_aset_peringkat: "atau Peringkat A (yang setara)",
    aktu_rasio: "82,5% < Rasio klaim ≤ 90%",
  },
  // SKALA 2
  {
    level: 2,
    kriteriaDampak: "Kecil",
    rangeFinansial: "20% < X ≤ 40%\ndari Batasan Risiko",
    deskripsiDampak1: "Dampak kecil yang dapat mengakibatkan kerusakan/ kerugian/ penurunan 20% - 40% dari nilai Batasan Risiko",
    stra_dampak: "Minimal 1 parameter tujuan strategis yang harus selesai pada tahun ini tertunda antara 2 - 3 bulan ",
    hukum_pelanggaran: "Perusahaan mendapat somasi.",
    kepat_pelanggaran: "Diminta bertemu dengan pihak Regulator (misalkan OJK, Bank Indonesia, IDX, Kementerian terkait, Dirjen Pajak, dan lain-lain)",
    reput_keluhan: "Terdapat keluhan pelanggan/ nasabah/ pembeli/ supplier yang tidak signifikan dan tidak dipublikasikan di media massa",
    reput_berita: "Pemberitaan negatif yg terisolasi di wilayah sektoral melalui media konvensional (misalkan Radio lokal, TV lokal, Surat Kabar daerah)",
    reput_saing: "Kehilangan daya saing tidak signifikan yang ditunjukkan dengan penurunan pangsa pasar < 1%",
    sdm_keluhan: "Terdapat keluhan karyawan yang memerlukan eskalasi terbatas (sampai tingkat unit SDM) untuk penyelesaian",
    sdm_turnover: "Turn over karyawan bertalenta (regretted turnover) 1% - 3%",
    sdm_regretted_turnover: "Turn over pegawai bertalenta dari 1% sampai dengan 5% setahun",
    sistem_gangguan: "Aplikasi dan Infrastruktur pendukung yang kurang penting tidak berfungsi selama lebih dari 1 hari s/d 3 hari",
    sistem_siber: "Jumlah rata-rata serangan siber per minggu 50-99 kali",
    sistem_platform: "90% ≥ X > 80%",
    ops_sla: "Dari 1% s/d 2,5% dari standard SLA yang telah ditetapkan (diukur dari waktu kekosongan atau ketidaksedia-an layanan produk atau tambahan biaya / ongkos)",
    hsse_fatality_1: "Kasus Perawatan Medis",
    hsse_fatality_2: "Efek kesehatan minor dan reversibel (tanpa rawat inap)",
    hsse_fatality_3: "[Data L2F3]",
    hsse_kerusakan_lingkungan: "Efek minor pada lingkungan biologis atau fisik",
    hsse_penurunan_esg: "90% ≥ X > 80% atau memperoleh rating '10-20 (low)'",
    pmn_tunda: "Tertunda 1 bulan dari target RKAP",
    bank_fraud: "800 ≤ X ≤ 1.000",
    asuransi_aset_rating: "90% ≤ Instrumen pada Investment grade < 100%",
    asuransi_aset_peringkat: "atau Peringkat AA (yang setara)",
    aktu_rasio: "75% < Rasio klaim ≤ 82,5%",
  },
  // SKALA 1
  {
    level: 1,
    kriteriaDampak: "Sangat Kecil",
    rangeFinansial: "X ≤ 20%\ndari Batasan Risiko",
    deskripsiDampak1: "Dampak sangat rendah yang dapat mengakibatkan kerusakan/ kerugian/ penurunan kurang dari 20% dari nilai Batasan Risiko",
    stra_dampak: "Minimal 1 parameter target strategis yang harus selesai pada tahun ini tertunda kurang dari 1 bulan",
    hukum_pelanggaran: "Tidak ada somasi/ tuntutan hukum",
    kepat_pelanggaran: "Teguran informal / verbal.",
    reput_keluhan: "Tidak ada keluhan pelanggan/ nasabah/ pembeli/ supplier",
    reput_berita: "Publikasi negatif yg terisolasi dan dapat ditangani dalam 1 hari kerja",
    reput_saing: "Penurunan pangsa pasar sampai dengan 5%",
    sdm_keluhan: "Terdapat keluhan karyawan yang disalurkan sampai tingkat SP Unit namun dapat diisolir dan diselesaikan oleh Pemimpin Unit",
    sdm_turnover: "Turn over pegawai bertalenta kurang dari 1% setahun",
    sdm_regretted_turnover: "Turn over pegawai bertalenta kurang dari 1% setahun",
    sistem_gangguan: "Aplikasi & Infrastruktur pendukung yang kurang penting tidak berfungsi selama 1 hari",
    sistem_siber: "Jumlah rata-rata serangan siber per minggu di bawah 50 kali",
    sistem_platform: "X > 90%",
    ops_sla: "<1% dari standard SLA yang telah ditetapkan (diukur dari waktu kekosongan atau ketidaksedia-an layanan produk atau tambahan biaya / ongkos)",
    hsse_fatality_1: "Kasus Pertolongan Pertama",
    hsse_fatality_2: "Tidak berpengaruh pada Kinerja Kerja",
    hsse_fatality_3: "[Data L1F3]",
    hsse_kerusakan_lingkungan: "Kerusakan terbatas pada area minimal dengan signifikansi rendah",
    hsse_penurunan_esg: "X > 90% atau memperoleh rating '0-10 (negligible)'",
    pmn_tunda: "Diterima tepat waktu sesuai dengan RKAP",
    bank_fraud: "X < 800",
    asuransi_aset_rating: "Instrumen pada investment grade 100%,",
    asuransi_aset_peringkat: "atau Peringkat AAA (yang setara)",
    aktu_rasio: "Rasio klaim ≤ 75%",
  },
];

// Style warna untuk header skala (seperti di RiskCriteriaReference)
const criteriaStyles = {
  level1: "bg-green-500 text-white text-center",
  level2: "bg-lime-500 text-white text-center",
  level3: "bg-yellow-400 text-black text-center",
  level4: "bg-orange-500 text-white text-center",
  level5: "bg-red-600 text-white text-center",
};

// --- Tambah kelas CSS untuk perataan ---
const cellClassName = "align-middle text-center whitespace-normal border border-slate-300";
const headerClassName = "align-middle text-center whitespace-normal border border-slate-300";
const columnStyle = "w-[220px]";

function MadyaCriteriaReference({
  probabilityCriteria = [],
  impactCriteria = [],
  onCriteriaSave, // Fungsi refresh dari parent
  readOnly = false,
}) {
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
    setCriteriaData(probabilityCriteria);
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
      alert("Kriteria probabilitas berhasil diperbarui.");
    } catch (error) {
      alert("Gagal menyimpan: " + (error.response?.data?.msg || "Error"));
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
      alert("Kriteria dampak berhasil diperbarui.");
    } catch (error) {
      alert("Gagal menyimpan: " + (error.response?.data?.msg || "Error"));
    }
  };

  return (
    <div className="space-y-6 text-xs">
      {/* --- TABEL PROBABILITAS (Tidak Berubah) --- */}
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
              <TableRow className="bg-slate-100">{/* Baris ini sengaja dibiarkan kosong karena semua kategori di Baris 2 sudah memiliki rowSpan={2} */}</TableRow>

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
            {/* =================================================================== */}
            {/* =================== AKHIR PENYESUAIAN HEADER ==================== */}
            {/* =================================================================== */}

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
