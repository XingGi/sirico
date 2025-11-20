import React, { useState, useEffect } from "react";
import { Dialog, DialogPanel, Title, Text, Select, SelectItem, NumberInput, TextInput, Button, Card, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell } from "@tremor/react";
import { toast } from "sonner";

const initialAnalysisState = { risk_identification_id: "", probabilitas: 1, dampak: 1, probabilitas_kualitatif: 0, dampak_finansial: 0 };

// Helper internal untuk formatting rupiah di modal ini
const parseCurrency = (val) => Number(String(val).replace(/[^0-9]/g, ""));
const formatCurrency = (val) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(val || 0);

export default function BasicAnalysisModal({ isOpen, onClose, onSave, initialData, availableRisks }) {
  const [analysisData, setAnalysisData] = useState(initialAnalysisState);

  useEffect(() => {
    if (isOpen) {
      setAnalysisData(initialData || initialAnalysisState);
    }
  }, [isOpen, initialData]);

  const handleChange = (name, value) => {
    setAnalysisData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    if (analysisData.risk_identification_id === "") {
      toast.error("Deskripsi Risiko wajib dipilih.");
      return;
    }
    onSave(analysisData);
  };

  const skor = (analysisData.probabilitas || 0) * (analysisData.dampak || 0);
  const nilaiBersih = (analysisData.dampak_finansial || 0) * ((analysisData.probabilitas_kualitatif || 0) / 100);

  return (
    <Dialog open={isOpen} onClose={onClose} static={true}>
      <DialogPanel className="max-w-2xl">
        <Title>{initialData ? "Edit" : "Tambah"} Analisis Risiko</Title>
        <div className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Deskripsi atau Kejadian Risiko *</label>
            <Select value={String(analysisData.risk_identification_id)} onValueChange={(val) => handleChange("risk_identification_id", Number(val))} required>
              <SelectItem value="">Pilih Risiko...</SelectItem>
              {availableRisks.map((risk) => (
                <SelectItem key={risk.originalIndex} value={String(risk.originalIndex)}>
                  {risk.deskripsi_risiko}
                </SelectItem>
              ))}
            </Select>
          </div>

          {/* Grid Probabilitas & Dampak */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm">Probabilitas (1-5)</label>
              <NumberInput className="rounded-md" value={analysisData.probabilitas} onValueChange={(val) => handleChange("probabilitas", val)} min={1} max={5} />
            </div>
            <div>
              <label className="text-sm">Dampak (1-5)</label>
              <NumberInput className="rounded-md" value={analysisData.dampak} onValueChange={(val) => handleChange("dampak", val)} min={1} max={5} />
            </div>
            <div>
              <label className="text-sm">Skor (W)</label>
              <TextInput value={skor} disabled />
            </div>
          </div>

          {/* Tabel Referensi Kecil */}
          <Card className="p-3 bg-slate-50">
            <Text className="font-semibold text-xs mb-2">Referensi Probabilitas Risiko</Text>
            <Table className="text-xs">
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Level</TableHeaderCell>
                  <TableHeaderCell>Kualitatif (%)</TableHeaderCell>
                  <TableHeaderCell>Frekuensi</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>1 - Sangat Rendah</TableCell>
                  <TableCell>&lt;10%</TableCell>
                  <TableCell>&lt; 2 kali/tahun</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>2 - Rendah</TableCell>
                  <TableCell>10 - 40%</TableCell>
                  <TableCell>2 - 3 kali/tahun</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>3 - Sedang</TableCell>
                  <TableCell>41 - 60%</TableCell>
                  <TableCell>4 - 6 kali/tahun</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>4 - Tinggi</TableCell>
                  <TableCell>61 - 80%</TableCell>
                  <TableCell>7 - 9 kali/tahun</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>5 - Sangat Tinggi</TableCell>
                  <TableCell>&gt;81%</TableCell>
                  <TableCell>&gt; 9 kali/tahun</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>

          <div>
            <label className="text-sm">Probabilitas Kualitatif (%)</label>
            <NumberInput
              icon={() => <span className="m-2">%</span>}
              value={analysisData.probabilitas_kualitatif}
              onValueChange={(val) => {
                if (val === undefined || val === null) {
                  handleChange("probabilitas_kualitatif", 0);
                } else {
                  const clampedVal = Math.min(100, Math.max(0, val));
                  handleChange("probabilitas_kualitatif", clampedVal);
                }
              }}
              min={0}
              max={100}
            />
          </div>
          <div>
            <label className="text-sm">Dampak Finansial (Rp)</label>
            <TextInput
              icon={() => <span className="text-gray-500 m-2">Rp</span>}
              value={analysisData.dampak_finansial?.toLocaleString("id-ID")}
              onChange={(e) => handleChange("dampak_finansial", parseCurrency(e.target.value))}
              placeholder="1.000.000"
            />
          </div>
          <div>
            <label className="text-sm">Nilai Bersih Risiko</label>
            <TextInput icon={() => <span className="text-gray-500 m-2">Rp</span>} value={formatCurrency(nilaiBersih).replace("Rp", "")} disabled />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button onClick={handleSave}>OK</Button>
        </div>
      </DialogPanel>
    </Dialog>
  );
}
