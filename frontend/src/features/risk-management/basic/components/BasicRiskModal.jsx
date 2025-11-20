import React, { useState, useEffect } from "react";
import { Dialog, DialogPanel, Title, TextInput, Textarea, Select, SelectItem, Button } from "@tremor/react";

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

export default function BasicRiskModal({ isOpen, onClose, onSave, initialData }) {
  const [riskData, setRiskData] = useState(initialRiskState);

  useEffect(() => {
    if (isOpen) {
      setRiskData(initialData || initialRiskState);
    }
  }, [isOpen, initialData]);

  const handleChange = (e) => {
    setRiskData({ ...riskData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (val) => {
    setRiskData({ ...riskData, kategori_risiko: val });
  };

  const handleSave = () => {
    if (!riskData.kategori_risiko || !riskData.unit_kerja || !riskData.deskripsi_risiko) {
      alert("Kategori, Unit Kerja, dan Deskripsi wajib diisi.");
      return;
    }
    onSave(riskData);
  };

  return (
    <Dialog open={isOpen} onClose={onClose} static={true}>
      <DialogPanel className="max-w-3xl">
        <Title>{initialData ? "Edit" : "Tambah"} Identifikasi Risiko Baru</Title>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 max-h-[70vh] overflow-y-auto pr-2 pl-1 pb-1">
          <div>
            <label>Kode Risiko</label>
            <TextInput name="kode_risiko" value={riskData.kode_risiko} onChange={handleChange} placeholder="Otomatis atau manual..." />
          </div>
          <div>
            <label>Kategori Risiko *</label>
            <Select value={riskData.kategori_risiko} onValueChange={handleSelectChange} required>
              <SelectItem value="Operasional">Operasional</SelectItem>
              <SelectItem value="Keuangan">Keuangan</SelectItem>
              <SelectItem value="Kepatuhan">Kepatuhan</SelectItem>
              <SelectItem value="Strategis">Strategis</SelectItem>
            </Select>
          </div>
          <div className="md:col-span-2">
            <label>Unit Kerja / Fungsi *</label>
            <TextInput name="unit_kerja" value={riskData.unit_kerja} onChange={handleChange} required />
          </div>
          <div className="md:col-span-2">
            <label>Sasaran</label>
            <Textarea name="sasaran" value={riskData.sasaran} onChange={handleChange} rows={2} />
          </div>
          <div>
            <label>Tanggal Identifikasi Risiko</label>
            <TextInput type="date" name="tanggal_identifikasi" value={riskData.tanggal_identifikasi} onChange={handleChange} />
          </div>
          <div className="md:col-span-2">
            <label>Deskripsi atau Kejadian Risiko *</label>
            <Textarea name="deskripsi_risiko" value={riskData.deskripsi_risiko} onChange={handleChange} required rows={3} />
          </div>
          <div className="md:col-span-2">
            <label>Akar Penyebab</label>
            <Textarea name="akar_penyebab" value={riskData.akar_penyebab} onChange={handleChange} rows={3} />
          </div>
          <div className="md:col-span-2">
            <label>Indikator Risiko</label>
            <Textarea name="indikator_risiko" value={riskData.indikator_risiko} onChange={handleChange} rows={3} />
          </div>
          <div className="md:col-span-2">
            <label>Faktor Positif / Internal Control Yang Ada Saat Ini</label>
            <Textarea name="internal_control" value={riskData.internal_control} onChange={handleChange} rows={3} />
          </div>
          <div className="md:col-span-2">
            <label>Deskripsi Dampak</label>
            <Textarea name="deskripsi_dampak" value={riskData.deskripsi_dampak} onChange={handleChange} rows={3} />
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
