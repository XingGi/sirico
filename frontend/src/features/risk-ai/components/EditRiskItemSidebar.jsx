// frontend/src/components/EditRiskItemSidebar.jsx

import React, { useState, useEffect } from "react";
import {
  Button,
  Dialog,
  DialogPanel,
  Title,
  Text,
  TextInput,
  Textarea,
  Select,
  SelectItem,
  NumberInput,
  Badge, // <-- 1. Import Badge untuk menampilkan Risk Level
} from "@tremor/react";
import { FiX } from "react-icons/fi";
import apiClient from "../../../api/api";
import { toast } from "sonner";

// 2. Buat fungsi helper untuk kalkulasi Risk Level di sini
const getLevelInfo = (likelihood, impact) => {
  const level = (likelihood || 0) * (impact || 0);
  if (level >= 15) return { text: "5 - High", color: "red" };
  if (level >= 8) return { text: "4 - Moderate to High", color: "orange" };
  if (level >= 4) return { text: "3 - Moderate", color: "yellow" };
  if (level >= 2) return { text: "2 - Low to Moderate", color: "lime" };
  if (level > 0) return { text: "1 - Low", color: "green" };
  // Default jika salah satu atau keduanya 0
  return { text: "N/A", color: "slate" };
};

function EditRiskItemSidebar({ risk, isOpen, onClose, onSave }) {
  const [editedRisk, setEditedRisk] = useState(risk);

  useEffect(() => {
    setEditedRisk(risk);
  }, [risk]);

  if (!isOpen || !editedRisk) {
    return null;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedRisk((prev) => ({ ...prev, [name]: value }));
  };

  const handleValueChange = (name, value) => {
    // Pastikan nilai yang masuk adalah angka atau null
    const numericValue = value === "" ? null : Number(value);
    setEditedRisk((prev) => ({ ...prev, [name]: numericValue }));
  };

  const handleSave = async () => {
    try {
      // await apiClient.put(`/risks/${editedRisk.id}`, editedRisk);
      onSave(editedRisk);
      onClose();
    } catch (error) {
      toast.error("Gagal Menyimpan Perubahan", {
        description: error.response?.data?.msg || "Endpoint tidak ditemukan atau terjadi error.",
      });
    }
  };

  // 3. Hitung risk level untuk Inherent dan Residual secara dinamis
  const inherentRiskInfo = getLevelInfo(editedRisk.inherent_likelihood, editedRisk.inherent_impact);
  const residualRiskInfo = getLevelInfo(editedRisk.residual_likelihood, editedRisk.residual_impact);

  return (
    <Dialog open={isOpen} onClose={onClose} static={true}>
      <DialogPanel className="fixed top-0 right-0 h-full w-full max-w-2xl p-6 bg-white shadow-xl overflow-y-auto">
        <div className="flex justify-between items-center border-b pb-4 mb-6">
          <div>
            <Title>Edit Risk Item</Title>
            <Text>{editedRisk.kode_risiko}</Text>
          </div>
          <Button icon={FiX} variant="light" onClick={onClose} />
        </div>

        <div className="space-y-8">
          {/* Basic Information (Tidak Berubah) */}
          <div>
            <h3 className="font-semibold text-lg mb-2 text-gray-700">Basic Information</h3>
            <div className="space-y-4 p-4 border rounded-lg">
              <div>
                <label className="text-sm font-medium text-gray-600">Title *</label>
                <TextInput name="title" value={editedRisk.title || ""} onChange={handleChange} required placeholder="Judul singkat risiko (maks 5 kata)" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Objective</label>
                <Textarea name="objective" value={editedRisk.objective || ""} onChange={handleChange} rows={3} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Risk Description</label>
                <Textarea name="deskripsi_risiko" value={editedRisk.deskripsi_risiko || ""} onChange={handleChange} rows={4} />
              </div>
            </div>
          </div>

          {/* Risk Analysis (Tidak Berubah) */}
          <div>
            <h3 className="font-semibold text-lg mb-2 text-gray-700">Risk Analysis</h3>
            <div className="space-y-4 p-4 border rounded-lg">
              <div>
                <label className="text-sm font-medium text-gray-600">Potential Cause</label>
                <Textarea name="risk_causes" value={editedRisk.risk_causes || ""} onChange={handleChange} rows={3} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Potential Impact</label>
                <Textarea name="risk_impacts" value={editedRisk.risk_impacts || ""} onChange={handleChange} rows={3} />
              </div>
            </div>
          </div>

          {/* Inherent Risk Assessment (DIPERBARUI) */}
          <div>
            <h3 className="font-semibold text-lg mb-2 text-gray-700">Inherent Risk Assessment</h3>
            {/* ↓↓↓ 4. Ubah layout menjadi grid 3 kolom dan tambahkan Badge ↓↓↓ */}
            <div className="grid grid-cols-3 gap-4 items-end p-4 border rounded-lg">
              <div>
                <label className="text-sm font-medium text-gray-600">Likelihood (1-5)</label>
                <NumberInput name="inherent_likelihood" value={editedRisk.inherent_likelihood || ""} onValueChange={(val) => handleValueChange("inherent_likelihood", val)} min={1} max={5} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Impact (1-5)</label>
                <NumberInput name="inherent_impact" value={editedRisk.inherent_impact || ""} onValueChange={(val) => handleValueChange("inherent_impact", val)} min={1} max={5} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Risk Level</label>
                <Badge color={inherentRiskInfo.color} className="w-full text-center py-2.5">
                  {inherentRiskInfo.text}
                </Badge>
              </div>
            </div>
          </div>

          {/* Risk Controls (Tidak Berubah) */}
          <div>
            <h3 className="font-semibold text-lg mb-2 text-gray-700">Risk Controls</h3>
            <div className="space-y-4 p-4 border rounded-lg">
              <div>
                <label className="text-sm font-medium text-gray-600">Existing Controls</label>
                <Textarea name="existing_controls" value={editedRisk.existing_controls || ""} onChange={handleChange} rows={3} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Control Effectiveness</label>
                <Select name="control_effectiveness" value={editedRisk.control_effectiveness || ""} onValueChange={(val) => handleValueChange("control_effectiveness", val)}>
                  <SelectItem value="Not Effective">Not Effective</SelectItem>
                  <SelectItem value="Partially Effective">Partially Effective</SelectItem>
                  <SelectItem value="Fully Effective">Fully Effective</SelectItem>
                </Select>
              </div>
            </div>
          </div>

          {/* ↓↓↓ 5. TAMBAHKAN BAGIAN BARU: Risk Treatment & Residual Risk ↓↓↓ */}
          <div>
            <h3 className="font-semibold text-lg mb-2 text-gray-700">Risk Treatment</h3>
            <div className="space-y-4 p-4 border rounded-lg">
              <div>
                <label className="text-sm font-medium text-gray-600">Treatment Option</label>
                {/* Untuk saat ini kita buat statis "Reduce" */}
                <TextInput value="Reduce" disabled />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Mitigation Plan</label>
                <Textarea name="mitigation_plan" value={editedRisk.mitigation_plan || ""} onChange={handleChange} rows={4} placeholder="Jelaskan rencana mitigasi atau perbaikan kontrol..." />
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2 text-gray-700">Residual Risk (Target)</h3>
            <div className="grid grid-cols-3 gap-4 items-end p-4 border rounded-lg">
              <div>
                <label className="text-sm font-medium text-gray-600">Target Likelihood (1-5)</label>
                <NumberInput name="residual_likelihood" value={editedRisk.residual_likelihood || ""} onValueChange={(val) => handleValueChange("residual_likelihood", val)} min={1} max={5} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Target Impact (1-5)</label>
                <NumberInput name="residual_impact" value={editedRisk.residual_impact || ""} onValueChange={(val) => handleValueChange("residual_impact", val)} min={1} max={5} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Target Risk Level</label>
                <Badge color={residualRiskInfo.color} className="w-full text-center py-2.5">
                  {residualRiskInfo.text}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Tombol Aksi */}
        <div className="mt-8 pt-4 border-t flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </DialogPanel>
    </Dialog>
  );
}

export default EditRiskItemSidebar;
