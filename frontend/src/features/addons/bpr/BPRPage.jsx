// frontend/src/features/bpr/BPRPage.jsx

import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Title, Text, Button, Flex, Badge, Icon, Dialog, DialogPanel, TextInput, Select, SelectItem, Grid, Metric } from "@tremor/react";
import { FiPlus, FiGitMerge, FiCopy, FiX, FiSearch, FiFilter, FiClock, FiCheckCircle, FiEdit3, FiFileText, FiActivity } from "react-icons/fi";
import { useQuery } from "@tanstack/react-query";
import apiClient from "../../../api/api";
import CreateBPRModal from "./components/CreateBPRModal";
import { formatDate } from "../../../utils/formatters";
import { toast } from "sonner";
import { useAuth } from "../../../context/AuthContext";
import { motion } from "framer-motion";

const fetchBprList = async () => {
  const { data } = await apiClient.get("/bpr/documents");
  return data;
};

// --- Helper: Tooltip Status ---
const StatusBadge = ({ status }) => {
  let color = "gray";
  let tooltip = "Status tidak diketahui";
  let icon = FiClock;

  switch (status) {
    case "Draft":
      color = "gray";
      tooltip = "Tahap pengerjaan di staf. Belum diajukan untuk review.";
      icon = FiEdit3;
      break;
    case "In Review":
      color = "orange";
      tooltip = "Tahap review oleh Manajer Risiko. Sedang divalidasi.";
      icon = FiActivity;
      break;
    case "Final":
      color = "emerald";
      tooltip = "Proses Bisnis telah disetujui oleh Manajer Risiko dan Staf.";
      icon = FiCheckCircle;
      break;
    case "Archived":
      color = "slate";
      tooltip = "Proses periode lama yang sudah diarsipkan.";
      break;
    default:
      break;
  }

  return (
    <div className="group relative flex items-center">
      <Badge color={color} icon={icon}>
        {status}
      </Badge>
      {/* Tooltip */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-max max-w-xs bg-slate-800 text-white text-xs rounded px-2 py-1 shadow-lg z-50">
        {tooltip}
        <div className="absolute left-1/2 -translate-x-1/2 top-full w-2 h-2 bg-slate-800 rotate-45"></div>
      </div>
    </div>
  );
};

// --- Modal Re-evaluate ---
const ReevaluateModal = ({ isOpen, onClose, sourceDoc, onConfirm }) => {
  const [newPeriod, setNewPeriod] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!newPeriod) return;
    setIsLoading(true);
    try {
      await onConfirm(sourceDoc.id, newPeriod);
      onClose();
    } catch (error) {
      // Error handled by parent
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={() => !isLoading && onClose()} static={true}>
      <DialogPanel>
        <Title>Re-evaluate Proses: {sourceDoc?.name}</Title>
        <Text className="mt-2">Anda akan menduplikasi proses ini (Versi {sourceDoc?.version}) untuk periode baru. Semua diagram dan risiko akan disalin sebagai Draft.</Text>
        <div className="mt-4">
          <label className="text-sm font-medium">Periode Baru</label>
          <TextInput placeholder="Contoh: 2025-Q2" value={newPeriod} onChange={(e) => setNewPeriod(e.target.value)} className="mt-1" />
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Batal
          </Button>
          <Button icon={FiCopy} onClick={handleSubmit} loading={isLoading}>
            Kloning & Buat Draft
          </Button>
        </div>
      </DialogPanel>
    </Dialog>
  );
};

function BPRPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // State Filter
  const [filterPeriod, setFilterPeriod] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [isReevaluateModalOpen, setIsReevaluateModalOpen] = useState(false);
  const [selectedDocForClone, setSelectedDocForClone] = useState(null);

  const canCreate = user?.permissions?.includes("approve_bpr") || user?.role === "admin";

  const {
    data: bprList = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["bprDocuments"],
    queryFn: fetchBprList,
  });

  // Logic Filter
  const filteredList = useMemo(() => {
    return bprList.filter((doc) => {
      const matchPeriod = filterPeriod ? doc.period === filterPeriod : true;
      const matchStatus = filterStatus ? doc.status === filterStatus : true;
      const matchSearch = searchQuery ? doc.name.toLowerCase().includes(searchQuery.toLowerCase()) || doc.department_name.toLowerCase().includes(searchQuery.toLowerCase()) : true;
      return matchPeriod && matchStatus && matchSearch;
    });
  }, [bprList, filterPeriod, filterStatus, searchQuery]);

  // Get Unique Periods for Filter
  const uniquePeriods = useMemo(() => [...new Set(bprList.map((d) => d.period))], [bprList]);

  const handleReevaluateClick = (e, doc) => {
    e.stopPropagation();
    setSelectedDocForClone(doc);
    setIsReevaluateModalOpen(true);
  };

  const processReevaluate = async (docId, newPeriod) => {
    try {
      const res = await apiClient.post(`/bpr/documents/${docId}/clone`, { period: newPeriod });
      toast.success("Proses berhasil dikloning!");
      refetch();
      navigate(`/addons/bpr/${res.data.new_id}`);
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengkloning proses.");
    }
  };

  // Statistik Sederhana
  const stats = {
    total: filteredList.length,
    final: filteredList.filter((d) => d.status === "Final").length,
    review: filteredList.filter((d) => d.status === "In Review").length,
  };

  return (
    <div className="p-6 sm:p-10 space-y-8 bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
            <FiGitMerge size={28} />
          </div>
          <div>
            <Title className="text-2xl">Business Process Review</Title>
            <Text>Pusat kendali pemetaan proses dan manajemen risiko operasional.</Text>
          </div>
        </div>
        {canCreate && (
          <Button size="lg" icon={FiPlus} onClick={() => setIsCreateModalOpen(true)} className="shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all rounded-xl">
            Buat Proses Baru
          </Button>
        )}
      </div>

      {/* Statistik Cards */}
      <Grid numItemsSm={2} numItemsLg={4} className="gap-6">
        <Card decoration="top" decorationColor="blue" className="p-4">
          <Text>Total Proses</Text>
          <Metric>{stats.total}</Metric>
        </Card>
        <Card decoration="top" decorationColor="emerald" className="p-4">
          <Text>Selesai (Final)</Text>
          <Metric>{stats.final}</Metric>
        </Card>
        <Card decoration="top" decorationColor="orange" className="p-4">
          <Text>Perlu Review</Text>
          <Metric>{stats.review}</Metric>
        </Card>
      </Grid>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-grow w-full md:w-auto relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama proses atau departemen..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="w-full md:w-48">
          <Select value={filterPeriod} onValueChange={setFilterPeriod} placeholder="Semua Periode" icon={FiClock}>
            <SelectItem value="">Semua Periode</SelectItem>
            {uniquePeriods.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </Select>
        </div>
        <div className="w-full md:w-48">
          <Select value={filterStatus} onValueChange={setFilterStatus} placeholder="Semua Status" icon={FiFilter}>
            <SelectItem value="">Semua Status</SelectItem>
            <SelectItem value="Draft">Draft</SelectItem>
            <SelectItem value="In Review">In Review</SelectItem>
            <SelectItem value="Final">Final</SelectItem>
          </Select>
        </div>
      </div>

      {/* Content List (Grid of Cards) */}
      {isLoading ? (
        <div className="text-center py-20 text-gray-500">Memuat data...</div>
      ) : filteredList.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-xl">
          <FiFileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <Text>Tidak ada dokumen proses bisnis ditemukan.</Text>
        </div>
      ) : (
        <Grid numItemsSm={1} numItemsMd={2} numItemsLg={3} className="gap-6">
          {filteredList.map((item) => (
            <motion.div key={item.id} whileHover={{ y: -5 }} transition={{ duration: 0.2 }} className="relative hover:z-50">
              <Card className="h-full flex flex-col justify-between border-t-4 border-t-blue-500 hover:shadow-lg cursor-pointer group" onClick={() => navigate(`/addons/bpr/${item.id}`)}>
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <Badge size="xs" color="slate">
                      {item.period}
                    </Badge>
                    <StatusBadge status={item.status} />
                  </div>
                  <Title className="text-lg mb-1 group-hover:text-blue-600 transition-colors line-clamp-2">{item.name}</Title>
                  <Text className="text-xs text-gray-500 mb-4">{item.department_name}</Text>

                  <div className="text-xs text-gray-400 flex items-center gap-1 mb-4">
                    <FiClock size={12} /> Diperbarui: {formatDate(item.updated_at)}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                  <Text className="text-xs font-medium text-gray-500">v{item.version || 1}</Text>

                  <div className="flex gap-2">
                    {item.status === "Final" && (
                      <Button size="xs" variant="secondary" color="amber" icon={FiCopy} onClick={(e) => handleReevaluateClick(e, item)}>
                        Re-evaluate
                      </Button>
                    )}
                    <Button size="xs" variant="light" icon={FiEdit3}>
                      Buka
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </Grid>
      )}

      <CreateBPRModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onSaveSuccess={refetch} />
      <ReevaluateModal isOpen={isReevaluateModalOpen} onClose={() => setIsReevaluateModalOpen(false)} sourceDoc={selectedDocForClone} onConfirm={processReevaluate} />
    </div>
  );
}

export default BPRPage;
