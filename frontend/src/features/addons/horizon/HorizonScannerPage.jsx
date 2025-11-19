// frontend/src/features/addons/horizon/HorizonScannerPage.jsx

import React, { useState, useEffect, useMemo } from "react";
import { Card, Title, Text, SearchSelect, SearchSelectItem, Button, Grid, Badge, Flex, Icon, Dialog, DialogPanel, ProgressBar } from "@tremor/react";
import { FiGlobe, FiSearch, FiLoader, FiExternalLink, FiClock, FiCpu, FiFileText, FiCheckCircle, FiTrash2 } from "react-icons/fi";
import { motion } from "framer-motion";
import apiClient from "../../../api/api";
import { toast } from "sonner";
import { formatDate } from "../../../utils/formatters";
import ConfirmationDialog from "../../../components/common/ConfirmationDialog";

function HorizonScannerPage() {
  const [history, setHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  const [sectorOptions, setSectorOptions] = useState([]);
  const [selectedSector, setSelectedSector] = useState("");
  const [isSectorsLoading, setIsSectorsLoading] = useState(true);

  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedScan, setSelectedScan] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const [limitConfig, setLimitConfig] = useState({ count: 0, limit: null });

  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null });

  const selectedSectorLabel = useMemo(() => {
    if (!selectedSector || sectorOptions.length === 0) return selectedSector;
    const option = sectorOptions.find((opt) => opt.key === selectedSector);
    return option ? option.value : selectedSector;
  }, [selectedSector, sectorOptions]);

  const getSectorLabelFromHistory = (key) => {
    const option = sectorOptions.find((opt) => opt.key === key);
    return option ? option.value : key;
  };

  useEffect(() => {
    const initData = async () => {
      setIsLoadingHistory(true);
      try {
        const industryRes = await apiClient.get("/master-data?category=INDUSTRY");
        setSectorOptions(industryRes.data);

        await fetchHistory();

        const userRes = await apiClient.get("/account/details");
        const horizonData = userRes.data.assessment_limits?.horizon || { count: 0, limit: null };
        setLimitConfig(horizonData);
      } catch (error) {
        console.error("Gagal memuat data:", error);
        toast.error("Gagal memuat data.");
      } finally {
        setIsLoadingHistory(false);
        setIsSectorsLoading(false);
      }
    };

    initData();
  }, []);

  const fetchHistory = async () => {
    try {
      const historyRes = await apiClient.get("/horizon/history");
      setHistory(historyRes.data);
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

  const getSectorLabel = (key) => {
    const option = sectorOptions.find((opt) => opt.key === key);
    return option ? option.value : key;
  };

  const handleScan = async () => {
    if (!selectedSector) {
      toast.error("Pilih sektor terlebih dahulu.");
      return;
    }

    setIsScanning(true);
    setScanProgress(10);

    const interval = setInterval(() => {
      setScanProgress((prev) => (prev < 90 ? prev + Math.random() * 10 : prev));
    }, 800);

    try {
      const response = await apiClient.post("/horizon/scan", {
        sector: selectedSector,
      });

      clearInterval(interval);
      setScanProgress(100);

      toast.success("Horizon Scan selesai!");
      await fetchHistory();
      handleViewDetail(response.data.scan_id);

      setLimitConfig((prev) => ({
        ...prev,
        count: prev.count + 1,
      }));
    } catch (error) {
      clearInterval(interval);
      console.error(error);
      toast.error(error.response?.data?.msg || "Gagal melakukan scanning.");
    } finally {
      setTimeout(() => {
        setIsScanning(false);
        setScanProgress(0);
      }, 500);
    }
  };

  const handleViewDetail = async (scanId) => {
    setIsDetailLoading(true);
    setIsDetailOpen(true);
    try {
      const response = await apiClient.get(`/horizon/history/${scanId}`);
      setSelectedScan(response.data);
    } catch (error) {
      toast.error("Gagal memuat detail laporan.");
      setIsDetailOpen(false);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const openDeleteConfirm = (e, id) => {
    e.stopPropagation();
    setDeleteConfirm({ isOpen: true, id });
  };

  const handleDelete = async () => {
    if (!deleteConfirm.id) return;
    try {
      await apiClient.delete(`/horizon/history/${deleteConfirm.id}`);
      toast.success("Laporan berhasil dihapus.");
      setDeleteConfirm({ isOpen: false, id: null });
      fetchHistory();
      setLimitConfig((prev) => ({
        ...prev,
        count: Math.max(0, prev.count - 1),
      }));
    } catch (error) {
      toast.error("Gagal menghapus laporan.");
    }
  };

  const remainingQuota = limitConfig.limit !== null ? Math.max(0, limitConfig.limit - limitConfig.count) : "Unlimited";

  const isLimitReached = limitConfig.limit !== null && limitConfig.count >= limitConfig.limit;

  return (
    <div className="p-6 sm:p-10 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Flex alignItems="center" className="space-x-3 mb-2">
            <Icon icon={FiGlobe} size="lg" variant="light" color="blue" />
            <Title>Horizon Scanner</Title>
          </Flex>
          <Text>Intelijen risiko berbasis AI yang memindai berita global & lokal secara real-time.</Text>
        </div>

        {/* Control Panel */}
        <Card className="w-full md:w-auto bg-blue-50 border border-blue-100 shadow-sm">
          <Flex className="gap-3 flex-col md:flex-row items-stretch md:items-center">
            <div className="w-full md:w-64">
              <label className="text-xs font-medium text-blue-700 mb-1 block ml-1">Target Industri</label>
              <SearchSelect value={selectedSector} onValueChange={setSelectedSector} disabled={isScanning || isSectorsLoading} placeholder="Pilih Industri..." className="bg-white">
                {sectorOptions.map((s) => (
                  <SearchSelectItem key={s.key} value={s.key}>
                    {s.value}
                  </SearchSelectItem>
                ))}
              </SearchSelect>
            </div>
            <div className="flex flex-col justify-end">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="md"
                  icon={FiSearch}
                  loading={isScanning}
                  onClick={handleScan}
                  disabled={isLimitReached || isSectorsLoading}
                  className="shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-shadow duration-300 rounded-xl"
                >
                  {isScanning ? "Memindai..." : "Mulai Scanning"}
                </Button>
              </motion.div>
              {limitConfig.limit !== null && <Text className="text-xs text-center mt-1 text-blue-600">Sisa kuota: {remainingQuota}</Text>}
            </div>
          </Flex>
        </Card>
      </div>

      {/* History Grid */}
      <div>
        <Title className="mb-4">Riwayat Laporan Intelijen</Title>
        {isLoadingHistory ? (
          <div className="text-center py-10">
            <FiLoader className="animate-spin h-8 w-8 mx-auto text-gray-400" />
          </div>
        ) : history.length === 0 ? (
          <Card className="text-center py-12 border-dashed border-2 border-gray-200">
            <FiGlobe className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <Text className="text-gray-500">Belum ada riwayat scanning.</Text>
            <Text className="text-gray-400 text-sm">Pilih industri di atas dan klik "Mulai Scanning".</Text>
          </Card>
        ) : (
          <Grid numItemsSm={1} numItemsMd={2} numItemsLg={3} className="gap-6">
            {history.map((item) => (
              <Card key={item.id} className="flex flex-col h-full hover:shadow-lg transition-all duration-200 border-t-4 border-t-blue-500 group cursor-pointer" onClick={() => handleViewDetail(item.id)}>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="xs" variant="light" color="rose" icon={FiTrash2} onClick={(e) => openDeleteConfirm(e, item.id)} title="Hapus Laporan" />
                </div>
                <div className="flex justify-between items-start mb-2 pr-8">
                  <Badge size="xs" color="blue" icon={FiGlobe}>
                    {getSectorLabelFromHistory(item.sector)}
                  </Badge>
                  <Text className="text-xs text-gray-400 flex items-center gap-1">
                    <FiClock size={12} /> {formatDate(item.created_at)}
                  </Text>
                </div>
                <Title className="text-lg font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">{item.title || "Laporan Tanpa Judul"}</Title>

                <Text className="text-sm text-gray-600 line-clamp-3 flex-grow">{item.summary_preview?.replace(/<[^>]+>/g, "") || "Klik untuk melihat detail..."}</Text>

                <div className="mt-4 pt-4 border-t flex justify-between items-center">
                  <Text className="text-xs text-blue-500 font-medium group-hover:underline">Baca Selengkapnya &rarr;</Text>
                </div>
              </Card>
            ))}
          </Grid>
        )}
      </div>

      {/* --- MODAL PROGRESS SCANNING --- */}
      <Dialog open={isScanning} onClose={() => {}} static={true}>
        <DialogPanel className="text-center max-w-md">
          <div className="mx-auto w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4 relative">
            <div className="absolute inset-0 rounded-full border-4 border-blue-100 animate-ping opacity-75"></div>
            <FiCpu className="h-8 w-8 text-blue-600 animate-pulse relative z-10" />
          </div>
          <Title className="text-xl">AI Sedang Bekerja...</Title>
          <Text className="mt-2">
            Sistem sedang memindai berita global, menerjemahkan, dan menyusun laporan intelijen untuk industri <br /> <span className="font-bold text-blue-600 text-lg">{selectedSectorLabel}</span>.
          </Text>

          <div className="mt-6">
            <Flex className="mb-1">
              <Text className="text-xs">Progress</Text>
              <Text className="text-xs font-bold">{Math.round(scanProgress)}%</Text>
            </Flex>
            <ProgressBar value={scanProgress} color="blue" />
          </div>
          <Text className="mt-4 text-xs text-gray-400 italic">Mohon jangan tutup halaman ini.</Text>
        </DialogPanel>
      </Dialog>

      {/* --- MODAL DETAIL LAPORAN --- */}
      <Dialog open={isDetailOpen} onClose={() => setIsDetailOpen(false)} static={true}>
        <DialogPanel className="w-full max-w-5xl h-[85vh] flex flex-col p-0 overflow-hidden">
          <div className="bg-slate-50 p-6 border-b flex justify-between items-start flex-shrink-0">
            <div>
              {isDetailLoading ? (
                <div className="h-6 w-48 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                <>
                  <Flex className="gap-2 mb-1">
                    <Badge color="blue">{selectedScan && getSectorLabel(selectedScan.sector)}</Badge>
                    <Text className="text-xs">{selectedScan && formatDate(selectedScan.created_at)}</Text>
                  </Flex>
                  <Title className="text-2xl">{selectedScan?.title}</Title>
                </>
              )}
            </div>
            <Button variant="secondary" color="gray" icon={FiCheckCircle} onClick={() => setIsDetailOpen(false)}>
              Tutup
            </Button>
          </div>

          {/* Content Modal */}
          <div className="flex-grow overflow-y-auto bg-slate-50 p-6 sm:p-8">
            {isDetailLoading ? (
              <div className="space-y-4 max-w-4xl mx-auto">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            ) : selectedScan ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto">
                {/* Kolom Kiri: Laporan AI (Lebar 8/12) */}
                <div className="lg:col-span-8">
                  <Card className="shadow-md border-none p-8">
                    {/* Style CSS khusus untuk merapikan output HTML dari AI */}
                    <div
                      className="prose prose-lg prose-blue max-w-none 
                                prose-h3:text-xl prose-h3:font-bold prose-h3:mt-8 prose-h3:mb-4 prose-h3:text-slate-800 prose-h3:border-l-4 prose-h3:border-blue-500 prose-h3:pl-3
                                prose-p:text-slate-600 prose-p:leading-relaxed prose-p:mb-4
                                prose-ul:list-disc prose-ul:pl-5 prose-li:mb-2 prose-li:text-slate-700
                                prose-strong:text-slate-900 prose-strong:font-semibold"
                      dangerouslySetInnerHTML={{ __html: selectedScan.report_html }}
                    />
                  </Card>
                </div>

                {/* Kolom Kanan: Sumber Berita (Lebar 4/12) */}
                <div className="lg:col-span-4 space-y-6">
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                    <Title className="text-blue-900 mb-1">Sumber Intelijen</Title>
                    <Text className="text-blue-700 text-sm">Berita yang dianalisis oleh AI ({selectedScan.news_data?.length || 0})</Text>
                  </div>

                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {selectedScan.news_data?.map((news, idx) => (
                      <a key={idx} href={news.url} target="_blank" rel="noopener noreferrer" className="block p-4 rounded-lg bg-white border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start mb-2">
                          <Badge size="xs" color={news.source.includes("Reuters") ? "rose" : "blue"}>
                            {news.source}
                          </Badge>
                          <FiExternalLink className="h-4 w-4 text-gray-300 group-hover:text-blue-500" />
                        </div>
                        <Text className="font-semibold text-sm leading-snug text-gray-800 group-hover:text-blue-700 mb-2">{news.title}</Text>
                        <Text className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{news.summary}</Text>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <Text>Data tidak ditemukan.</Text>
            )}
          </div>
        </DialogPanel>
      </Dialog>
      <ConfirmationDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
        onConfirm={handleDelete}
        title="Hapus Laporan"
        message="Apakah Anda yakin ingin menghapus laporan intelijen ini? Data tidak dapat dikembalikan."
        confirmButtonText="Hapus"
      />
    </div>
  );
}

export default HorizonScannerPage;
