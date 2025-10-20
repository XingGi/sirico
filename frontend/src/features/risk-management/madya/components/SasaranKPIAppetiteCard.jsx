// frontend/src/features/risk-management/madya/components/SasaranKPIAppetiteCard.jsx
import React, { useState } from "react";
import { Card, Title, Text, Button, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Textarea, Dialog, DialogPanel } from "@tremor/react";
import { FiPlus, FiTrash2, FiSave, FiX } from "react-icons/fi";
import apiClient from "../../../../api/api";

// Komponen Modal untuk menambah/mengedit Sasaran/KPI
function SasaranFormModal({ isOpen, onClose, onSave, initialText = "" }) {
  const [sasaranText, setSasaranText] = useState(initialText);

  // Reset text saat modal dibuka
  React.useEffect(() => {
    if (isOpen) {
      setSasaranText(initialText);
    }
  }, [isOpen, initialText]);

  const handleSave = () => {
    if (sasaranText.trim()) {
      onSave(sasaranText);
    } else {
      alert("Sasaran/KPI tidak boleh kosong.");
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} static={true}>
      <DialogPanel>
        <Title>Tambah Sasaran Organisasi / KPI</Title>
        <Textarea value={sasaranText} onChange={(e) => setSasaranText(e.target.value)} placeholder="Masukkan deskripsi Sasaran Organisasi atau KPI..." rows={5} className="mt-4" required />
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} icon={FiX}>
            Batal
          </Button>
          <Button onClick={handleSave} icon={FiSave}>
            Simpan
          </Button>
        </div>
      </DialogPanel>
    </Dialog>
  );
}

// Komponen Utama Card 3
function SasaranKPIAppetiteCard({ assessmentId, initialData = [], onDataChange }) {
  const [sasaranEntries, setSasaranEntries] = useState(initialData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fungsi untuk menambah Sasaran/KPI baru via API
  const handleAddSasaran = async (sasaranText) => {
    setIsLoading(true);
    try {
      const response = await apiClient.post(`/madya-assessments/${assessmentId}/sasaran-kpi`, {
        sasaran_kpi: sasaranText,
      });
      setSasaranEntries((prev) => [...prev, response.data.entry]); // Tambahkan data baru ke state
      setIsModalOpen(false); // Tutup modal
      // Panggil onDataChange jika ada (opsional, tergantung kebutuhan refresh)
      if (onDataChange) onDataChange();
    } catch (error) {
      alert("Gagal menambahkan Sasaran/KPI: " + (error.response?.data?.msg || "Error"));
    } finally {
      setIsLoading(false);
    }
  };

  // Fungsi untuk menghapus Sasaran/KPI via API
  const handleDeleteSasaran = async (sasaranId) => {
    if (window.confirm("Anda yakin ingin menghapus sasaran/KPI ini?")) {
      setIsLoading(true);
      try {
        await apiClient.delete(`/sasaran-kpi/${sasaranId}`);
        setSasaranEntries((prev) => prev.filter((entry) => entry.id !== sasaranId)); // Hapus dari state
        if (onDataChange) onDataChange();
      } catch (error) {
        alert("Gagal menghapus Sasaran/KPI: " + (error.response?.data?.msg || "Error"));
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Mapping level Risk Appetite (sesuai gambar)
  const riskLevelMap = {
    R: { text: "R", color: "bg-green-500 text-white" },
    L: { text: "L", color: "bg-yellow-400 text-black" }, // Low to Moderate/Low (6-11) -> Kuning
    M: { text: "M", color: "bg-yellow-400 text-black" }, // Moderate (12-15) -> Kuning
    H: { text: "H", color: "bg-orange-500 text-white" }, // Moderate to High/High (16-19) -> Oranye
    E: { text: "E", color: "bg-red-600 text-white" }, // High/Extreme (20-25) -> Merah
  };

  // Fungsi untuk mendapatkan style cell berdasarkan skor
  const getCellColor = (score) => {
    if (score === null || score === undefined) return "bg-gray-200 text-gray-500"; // Placeholder #N/A
    if (score >= 20) return "bg-red-600 text-white"; // E
    if (score >= 16) return "bg-orange-500 text-white"; // H
    if (score >= 12) return "bg-yellow-400 text-black"; // M
    if (score >= 6) return "bg-yellow-400 text-black"; // L
    if (score >= 1) return "bg-green-500 text-white"; // R (Low / 1-5, asumsikan sama dengan target R)
    return "bg-gray-200 text-gray-500";
  };

  const riskLegend = [
    { code: "R", text: "Low/Rare (1 - 5)", colorClass: "bg-green-500 text-white" }, //
    { code: "L", text: "Low to Moderate/Low (6 - 11)", colorClass: "bg-lime-400 text-black" }, // - Aproksimasi warna
    { code: "M", text: "Moderate (12 - 15)", colorClass: "bg-yellow-400 text-black" }, //
    { code: "H", text: "Moderate to High/High (16 - 19)", colorClass: "bg-orange-500 text-white" }, //
    { code: "E", text: "High/Extreme (20 - 25)", colorClass: "bg-red-600 text-white" }, //
  ];

  return (
    <>
      <Card>
        <div className="flex justify-between items-center mb-4 ml-4">
          <div>
            <Title as="h3">3. Sasaran Organisasi / KPI dan Risk Appetite</Title>
            <Text>Definisikan Sasaran/KPI dan target toleransi risikonya.</Text>
          </div>
          <Button icon={FiPlus} onClick={() => setIsModalOpen(true)} loading={isLoading}>
            Tambah Sasaran/KPI
          </Button>
        </div>

        <Table className="mt-4">
          <TableHead>
            <TableRow className="bg-gray-100">
              <TableHeaderCell className="w-1/12 text-center">No</TableHeaderCell>
              <TableHeaderCell className="w-5/12">Sasaran Organisasi / KPI</TableHeaderCell>
              <TableHeaderCell className="w-2/12 text-center">Target</TableHeaderCell>
              <TableHeaderCell className="w-2/12 text-center">Risiko Inheren</TableHeaderCell>
              <TableHeaderCell className="w-2/12 text-center">Risiko Residual</TableHeaderCell>
              <TableHeaderCell className="text-right">Aksi</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sasaranEntries && sasaranEntries.length > 0 ? (
              sasaranEntries.map((item, index) => {
                const targetStyle = riskLevelMap[item.target_level] || { text: "-", color: "bg-gray-200 text-gray-500" };
                const inherentStyle = getCellColor(item.inherent_risk_score);
                const residualStyle = getCellColor(item.residual_risk_score);

                return (
                  <TableRow key={item.id}>
                    <TableCell className="text-center">{index + 1}</TableCell>
                    <TableCell className="whitespace-normal">{item.sasaran_kpi}</TableCell>
                    <TableCell className={`text-center font-semibold ${targetStyle.color}`}>
                      {/* Tampilkan target level jika ada, jika tidak strip */}
                      {item.target_level || "-"}
                    </TableCell>
                    <TableCell className={`text-center font-semibold ${inherentStyle}`}>
                      {/* Tampilkan skor jika ada, jika tidak #N/A */}
                      {item.inherent_risk_score !== null ? item.inherent_risk_score : "#N/A"}
                    </TableCell>
                    <TableCell className={`text-center font-semibold ${residualStyle}`}>
                      {/* Tampilkan skor jika ada, jika tidak #N/A */}
                      {item.residual_risk_score !== null ? item.residual_risk_score : "#N/A"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button icon={FiTrash2} variant="light" color="red" onClick={() => handleDeleteSasaran(item.id)} loading={isLoading} />
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-5">
                  <Text>Belum ada Sasaran Organisasi / KPI yang ditambahkan.</Text>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <div className="mt-6 border-t pt-4">
          <Text className="font-semibold mb-2 text-gray-600">Note / Keterangan Level Risiko:</Text>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {" "}
            {/* Memberi jarak lebih antar item */}
            {riskLegend.map((level) => (
              <div key={level.code} className="flex items-center space-x-2">
                <span className={`px-2.5 py-1 rounded text-xs font-bold ${level.colorClass}`}>
                  {" "}
                  {/* Dibuat lebih tebal */}
                  {level.code}
                </span>
                <Text className="text-xs text-gray-700">{level.text}</Text>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Modal untuk menambah Sasaran/KPI */}
      <SasaranFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleAddSasaran} />
    </>
  );
}

export default SasaranKPIAppetiteCard;
