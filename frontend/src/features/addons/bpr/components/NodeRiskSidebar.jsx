// frontend/src/features/bpr/components/NodeRiskSidebar.jsx
import React, { useState, useEffect } from "react";
import { Title, Text, Button, TextInput, Textarea, Select, SelectItem, Badge, Card, Flex, Icon } from "@tremor/react";
import { FiX, FiPlus, FiTrash2, FiSave, FiAlertTriangle, FiCheckCircle, FiXCircle, FiMessageSquare } from "react-icons/fi";
import apiClient from "../../../../api/api";
import { toast } from "sonner";
import { useAuth } from "../../../../context/AuthContext";

export default function NodeRiskSidebar({ isOpen, onClose, selectedNode, onDataChange, onLabelChange }) {
  const { user } = useAuth();
  const [risks, setRisks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nodeLabel, setNodeLabel] = useState("");

  const [newRisk, setNewRisk] = useState({
    risk_description: "",
    risk_cause: "",
    risk_impact: "",
    existing_control: "",
    inherent_risk_level: "Low",
  });
  const [isAdding, setIsAdding] = useState(false);

  const isReviewer = user?.permissions?.includes("approve_bpr") || user?.role === "admin";

  const [reviewNotes, setReviewNotes] = useState({});

  // Fetch risks saat node berubah
  useEffect(() => {
    if (isOpen && selectedNode) {
      setNodeLabel(selectedNode.data?.label || "");

      if (selectedNode.db_id) {
        fetchRisks(selectedNode.db_id);
      } else {
        setRisks([]);
      }
      setIsAdding(false);
    }
  }, [selectedNode, isOpen]);

  const handleLabelChange = (e) => {
    setNodeLabel(e.target.value);
  };

  // Handler saat selesai mengetik (onBlur) -> Kirim ke Parent
  const handleLabelBlur = () => {
    if (selectedNode && onLabelChange) {
      onLabelChange(selectedNode.id, nodeLabel);
    }
  };

  const fetchRisks = async (nodeId) => {
    setIsLoading(true);
    try {
      const res = await apiClient.get(`/bpr/nodes-db/${nodeId}/risks`);
      setRisks(res.data);
      const notesInit = {};
      res.data.forEach((r) => {
        notesInit[r.id] = r.reviewer_notes || "";
      });
      setReviewNotes(notesInit);
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat risiko.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRisk = async () => {
    if (!newRisk.risk_description) {
      toast.error("Deskripsi risiko wajib diisi.");
      return;
    }
    setIsSubmitting(true);
    try {
      await apiClient.post(`/bpr/nodes-db/${selectedNode.db_id}/risks`, newRisk);
      toast.success("Risiko ditambahkan.");
      setIsAdding(false);
      setNewRisk({ risk_description: "", risk_cause: "", risk_impact: "", existing_control: "", inherent_risk_level: "Low" });
      fetchRisks(selectedNode.db_id);
      onDataChange();
    } catch (error) {
      toast.error("Gagal menyimpan risiko.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRisk = async (riskId) => {
    if (!confirm("Hapus risiko ini?")) return;
    try {
      await apiClient.delete(`/bpr/risks/${riskId}`);
      toast.success("Risiko dihapus.");
      fetchRisks(selectedNode.db_id);
      onDataChange();
    } catch (error) {
      toast.error("Gagal menghapus.");
    }
  };

  const handleApproval = async (riskId, status) => {
    const note = reviewNotes[riskId] || "";

    if (status === "Rejected" && !note.trim()) {
      toast.error("Harap berikan catatan alasan penolakan.");
      return;
    }

    try {
      await apiClient.put(`/bpr/risks/${riskId}`, {
        approval_status: status,
        reviewer_notes: note,
      });
      toast.success(`Risiko ${status === "Approved" ? "disetujui" : "ditolak"}.`);
      fetchRisks(selectedNode.db_id);
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengupdate status approval.");
    }
  };

  const handleNoteChange = (riskId, value) => {
    setReviewNotes((prev) => ({ ...prev, [riskId]: value }));
  };

  // Helper warna badge status
  const getStatusBadge = (status) => {
    switch (status) {
      case "Approved":
        return { color: "emerald", icon: FiCheckCircle, text: "Disetujui" };
      case "Rejected":
        return { color: "rose", icon: FiXCircle, text: "Ditolak" };
      default:
        return { color: "gray", icon: FiAlertTriangle, text: "Draft / Review" };
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl border-l border-gray-200 z-50 flex flex-col transform transition-transform duration-300 ease-in-out">
      {/* Header */}
      <div className="p-5 border-b bg-slate-50">
        <div className="flex justify-between items-center mb-3">
          <Text className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Detail Langkah</Text>
          <Button icon={FiX} variant="light" color="gray" onClick={onClose} />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-700 mb-1 block">Nama Langkah</label>
          <TextInput value={nodeLabel} onChange={handleLabelChange} onBlur={handleLabelBlur} placeholder="Nama Langkah..." className="font-bold" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {!selectedNode?.db_id ? (
          <div className="p-4 bg-yellow-50 text-yellow-800 rounded text-sm border border-yellow-200">
            <FiAlertTriangle className="inline mr-2" />
            <span className="font-medium">Langkah Belum Disimpan</span>
            <p className="mt-1 text-xs">Silakan simpan diagram terlebih dahulu untuk menambahkan risiko pada langkah ini.</p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center">
              <Title className="text-sm">Daftar Risiko ({risks.length})</Title>
            </div>

            {/* List Risiko */}
            <div className="space-y-3">
              {isLoading ? (
                <Text className="text-center py-4">Memuat...</Text>
              ) : risks.length === 0 && !isAdding ? (
                <div className="text-center py-8 border-2 border-dashed rounded-lg text-gray-400 bg-white">
                  <FiCheckCircle className="mx-auto mb-2 w-6 h-6" />
                  <Text>Aman. Belum ada risiko.</Text>
                </div>
              ) : (
                risks.map((risk) => {
                  const statusInfo = getStatusBadge(risk.approval_status);
                  return (
                    <Card
                      key={risk.id}
                      className={`p-4 border-l-4 shadow-sm relative group ${risk.approval_status === "Rejected" ? "border-rose-500 bg-rose-50/30" : risk.approval_status === "Approved" ? "border-emerald-500" : "border-orange-400"}`}
                    >
                      {/* Tombol Hapus (Hanya muncul jika belum Approved atau user adalah Reviewer) */}
                      {(isReviewer || risk.approval_status !== "Approved") && (
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="xs" variant="light" color="rose" icon={FiTrash2} onClick={() => handleDeleteRisk(risk.id)} />
                        </div>
                      )}

                      <Flex justifyContent="start" className="gap-2 mb-2">
                        <Badge size="xs" color={risk.inherent_risk_level === "High" || risk.inherent_risk_level === "Extreme" ? "rose" : "orange"}>
                          {risk.inherent_risk_level}
                        </Badge>
                        <Badge size="xs" color={statusInfo.color} icon={statusInfo.icon}>
                          {statusInfo.text}
                        </Badge>
                      </Flex>

                      <Text className="font-bold text-slate-800 text-sm mb-2 leading-snug">{risk.risk_description}</Text>

                      <div className="text-xs space-y-1 text-slate-600 bg-white/50 p-2 rounded mb-2">
                        {risk.risk_cause && (
                          <p>
                            <span className="font-semibold">Penyebab:</span> {risk.risk_cause}
                          </p>
                        )}
                        {risk.risk_impact && (
                          <p>
                            <span className="font-semibold">Dampak:</span> {risk.risk_impact}
                          </p>
                        )}
                      </div>

                      {risk.existing_control && (
                        <div className="pt-2 border-t border-gray-100">
                          <Text className="text-[10px] text-gray-500 uppercase font-semibold">Kontrol</Text>
                          <Text className="text-xs text-slate-600">{risk.existing_control}</Text>
                        </div>
                      )}

                      {/* --- AREA REVIEWER --- */}
                      {isReviewer && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <Text className="text-[10px] font-bold text-blue-600 mb-1 flex items-center gap-1">
                            <FiMessageSquare size={10} /> REVIEWER AREA
                          </Text>
                          <Textarea placeholder="Catatan review / alasan penolakan..." className="text-xs mb-2" rows={2} value={reviewNotes[risk.id] || ""} onChange={(e) => handleNoteChange(risk.id, e.target.value)} />
                          <div className="flex gap-2 justify-end">
                            <Button size="xs" variant="secondary" color="rose" onClick={() => handleApproval(risk.id, "Rejected")}>
                              Tolak
                            </Button>
                            <Button size="xs" className="text-emerald-400" color="emerald" onClick={() => handleApproval(risk.id, "Approved")}>
                              Setujui
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Tampilan Catatan untuk Staf */}
                      {!isReviewer && risk.reviewer_notes && (
                        <div className="mt-2 p-2 bg-blue-50 border border-blue-100 rounded text-xs text-blue-800">
                          <span className="font-bold">Catatan Reviewer:</span> {risk.reviewer_notes}
                        </div>
                      )}
                    </Card>
                  );
                })
              )}
            </div>

            {/* Form Tambah */}
            {isAdding ? (
              <Card className="bg-white border-2 border-blue-100 shadow-lg">
                <div className="space-y-3">
                  <Title className="text-sm">Tambah Risiko Baru</Title>
                  <div>
                    <label className="text-xs font-bold text-gray-600">Deskripsi Risiko *</label>
                    <Textarea rows={2} placeholder="Apa yang bisa salah?" value={newRisk.risk_description} onChange={(e) => setNewRisk({ ...newRisk, risk_description: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600">Penyebab</label>
                    <Textarea rows={1} placeholder="Mengapa?" value={newRisk.risk_cause} onChange={(e) => setNewRisk({ ...newRisk, risk_cause: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600">Dampak</label>
                    <Textarea rows={1} placeholder="Akibatnya?" value={newRisk.risk_impact} onChange={(e) => setNewRisk({ ...newRisk, risk_impact: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600">Kontrol Saat Ini</label>
                    <TextInput placeholder="SOP, Sistem..." value={newRisk.existing_control} onChange={(e) => setNewRisk({ ...newRisk, existing_control: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600">Level Risiko</label>
                    <Select value={newRisk.inherent_risk_level} onValueChange={(val) => setNewRisk({ ...newRisk, inherent_risk_level: val })}>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Extreme">Extreme</SelectItem>
                    </Select>
                  </div>

                  <div className="flex justify-end gap-2 mt-2">
                    <Button size="xs" variant="secondary" onClick={() => setIsAdding(false)}>
                      Batal
                    </Button>
                    <Button size="xs" loading={isSubmitting} onClick={handleAddRisk}>
                      Simpan
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <Button className="w-full border-dashed border-2 bg-transparent text-blue-600 hover:bg-blue-50 hover:border-blue-300 py-3" onClick={() => setIsAdding(true)} icon={FiPlus}>
                Identifikasi Risiko Baru
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
