// frontend/src/features/addons/horizon/HorizonScannerPage.jsx

import React, { useState, useEffect, useMemo } from "react";
import { Card, Title, Text, SearchSelect, SearchSelectItem, Button, Grid, Badge, Flex, Icon, Dialog, DialogPanel, ProgressBar, Select, SelectItem } from "@tremor/react";
import { FiGlobe, FiSearch, FiLoader, FiExternalLink, FiClock, FiCpu, FiTrash2, FiCheckCircle, FiFileText, FiArrowRight, FiX, FiAlertTriangle, FiTrendingUp, FiZap, FiTarget, FiAward, FiGrid, FiList, FiFilter } from "react-icons/fi";
import { motion } from "framer-motion";
import apiClient from "../../../api/api";
import { toast } from "sonner";
import { formatDate } from "../../../utils/formatters";
import ConfirmationDialog from "../../../components/common/ConfirmationDialog";
import AppResourceTable from "../../../components/common/AppResourceTable"; // Import Table

// --- KOMPONEN RENDER KONTEN AI YANG LEBIH COLORFUL ---
const AIContentRenderer = ({ htmlContent }) => {
  if (!htmlContent) return null;

  return (
    <div className="space-y-8">
      <article
        className="prose prose-slate prose-lg max-w-none 
                prose-p:text-slate-600 prose-p:leading-relaxed prose-p:mb-4 prose-p:text-sm
                prose-li:text-sm prose-li:text-slate-600 prose-li:mb-2 prose-li:pl-1
                prose-strong:text-slate-800 prose-strong:font-bold
                
                /* Default H3 styling untuk judul lain yg tidak kena replace */
                prose-h3:text-lg prose-h3:font-bold prose-h3:mt-8 prose-h3:mb-4 prose-h3:flex prose-h3:items-center prose-h3:gap-2
                prose-h3:border-l-4 prose-h3:pl-3 prose-h3:rounded-r-lg prose-h3:py-1.5 prose-h3:bg-gray-50
            "
      >
        <div
          dangerouslySetInnerHTML={{
            __html: htmlContent
              // 1. EXECUTIVE SUMMARY (Blue/Indigo)
              .replace(
                /<h3>(.*?)Executive Summary(.*?)<\/h3>([\s\S]*?)(?=<h3>|$)/g,
                `<div class="mb-8 p-6 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 shadow-sm">
                                <h3 class="text-blue-800 border-none bg-transparent p-0 mb-3 text-xl flex items-center gap-2 font-bold">
                                    <span class="p-1.5 bg-blue-100 rounded-lg text-blue-600 shadow-sm">📊</span> $1Executive Summary$2
                                </h3>
                                <div class="text-slate-700 leading-relaxed text-sm">
                                    $3
                                </div>
                            </div>`
              )

              // 2. KEY EMERGING RISKS (Rose/Red) - Card Style
              .replace(
                /<h3>(.*?)Key Emerging Risks(.*?)<\/h3>([\s\S]*?)(?=<h3>|$)/g,
                `<div class="mb-8 p-6 rounded-xl bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-100 shadow-sm">
                                <h3 class="text-rose-800 border-none bg-transparent p-0 mb-3 text-lg flex items-center gap-2 font-bold">
                                    <span class="p-1.5 bg-rose-100 rounded-lg text-rose-600 shadow-sm">⚠️</span> $1Key Emerging Risks$2
                                </h3>
                                <div class="text-slate-700 leading-relaxed text-sm">
                                    $3
                                </div>
                            </div>`
              )

              // 3. TOP 2 CRITICAL RISKS (Orange/Amber) - Card Style
              .replace(
                /<h3>(.*?)Top 2 Critical Risks(.*?)<\/h3>([\s\S]*?)(?=<h3>|$)/g,
                `<div class="mb-8 p-6 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 shadow-sm">
                                <h3 class="text-orange-800 border-none bg-transparent p-0 mb-3 text-lg flex items-center gap-2 font-bold">
                                    <span class="p-1.5 bg-orange-100 rounded-lg text-orange-600 shadow-sm">🔥</span> $1Top 2 Critical Risks$2
                                </h3>
                                <div class="text-slate-700 leading-relaxed text-sm">
                                    $3
                                </div>
                            </div>`
              )

              // 4. STRATEGIC OPPORTUNITIES (Blue/Sky) - Card Style
              .replace(
                /<h3>(.*?)Strategic Opportunities(.*?)<\/h3>([\s\S]*?)(?=<h3>|$)/g,
                `<div class="mb-8 p-6 rounded-xl bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-100 shadow-sm">
                                <h3 class="text-sky-800 border-none bg-transparent p-0 mb-3 text-lg flex items-center gap-2 font-bold">
                                    <span class="p-1.5 bg-sky-100 rounded-lg text-sky-600 shadow-sm">🚀</span> $1Strategic Opportunities$2
                                </h3>
                                <div class="text-slate-700 leading-relaxed text-sm">
                                    $3
                                </div>
                            </div>`
              )

              // 5. PRIORITY MITIGATION STEPS (Emerald/Green) - Card Style
              .replace(
                /<h3>(.*?)Priority Mitigation Steps(.*?)<\/h3>([\s\S]*?)(?=<h3>|$)/g,
                `<div class="mb-8 p-6 rounded-xl bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-100 shadow-sm">
                                <h3 class="text-emerald-800 border-none bg-transparent p-0 mb-3 text-lg flex items-center gap-2 font-bold">
                                    <span class="p-1.5 bg-emerald-100 rounded-lg text-emerald-600 shadow-sm">🛡️</span> $1Priority Mitigation Steps$2
                                </h3>
                                <div class="text-slate-700 leading-relaxed text-sm">
                                    $3
                                </div>
                            </div>`
              )

              // 6. STRATEGIC RECOMMENDATION (Purple/Indigo - Special Card)
              .replace(
                /<h3>(.*?)Strategic Recommendation(.*?)<\/h3>([\s\S]*?)(?=<h3>|$)/g,
                `<div class="my-8 p-6 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 border-l-4 border-purple-500 shadow-md relative overflow-hidden">
                                <h3 class="text-purple-900 border-none bg-transparent p-0 mb-3 flex items-center gap-2 text-xl font-bold relative z-10">
                                    <span class="p-1.5 bg-purple-100 rounded-lg text-purple-600 border border-purple-200 shadow-sm">👑</span> $1Strategic Recommendation$2
                                </h3>
                                <div class="text-slate-700 leading-relaxed text-sm bg-white/60 p-4 rounded-lg border border-purple-100 relative z-10">
                                    $3
                                </div>
                            </div>`
              ),
          }}
        />
      </article>
    </div>
  );
};

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

  // Filter & Sort State
  const [viewMode, setViewMode] = useState("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("newest");
  const [filterIndustry, setFilterIndustry] = useState("all");

  // --- COMPUTED VALUES ---
  const selectedSectorLabel = useMemo(() => {
    if (!selectedSector || sectorOptions.length === 0) return selectedSector;
    const option = sectorOptions.find((opt) => opt.key === selectedSector);
    return option ? option.value : selectedSector;
  }, [selectedSector, sectorOptions]);

  const getSectorLabel = (key) => {
    const option = sectorOptions.find((opt) => opt.key === key);
    return option ? option.value : key;
  };

  const remainingQuota = limitConfig.limit !== null ? Math.max(0, limitConfig.limit - limitConfig.count) : "Unlimited";
  const isLimitReached = limitConfig.limit !== null && limitConfig.count >= limitConfig.limit;

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

  // --- LOGIC FILTER & SORT ---
  const filteredHistory = useMemo(() => {
    let result = [...history];

    // 1. Search
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter((item) => item.title?.toLowerCase().includes(lower) || item.summary_preview?.toLowerCase().includes(lower));
    }

    // 2. Filter Industry
    if (filterIndustry !== "all") {
      result = result.filter((item) => item.sector === filterIndustry);
    }

    // 3. Sort
    result.sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return sortOption === "newest" ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [history, searchTerm, filterIndustry, sortOption]);

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
      const response = await apiClient.post("/horizon/scan", { sector: selectedSector });
      clearInterval(interval);
      setScanProgress(100);
      toast.success("Horizon Scan selesai!");
      await fetchHistory();
      handleViewDetail(response.data.scan_id);
      setLimitConfig((prev) => ({ ...prev, count: prev.count + 1 }));
    } catch (error) {
      clearInterval(interval);
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
      setLimitConfig((prev) => ({ ...prev, count: Math.max(0, prev.count - 1) }));
    } catch (error) {
      toast.error("Gagal menghapus laporan.");
    }
  };

  // Definisi Kolom untuk List View
  const listColumns = [
    {
      key: "title",
      header: "Judul Laporan",
      cell: (item) => (
        <div className="flex items-center gap-3 group cursor-pointer" onClick={() => handleViewDetail(item.id)}>
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
            <FiFileText />
          </div>
          <Text className="font-semibold text-slate-700 group-hover:text-blue-600 transition-colors">{item.title || "Laporan Tanpa Judul"}</Text>
        </div>
      ),
    },
    {
      key: "sector",
      header: "Industri",
      cell: (item) => (
        <Badge size="xs" color="blue" icon={FiGlobe} className="rounded-md px-2 py-1">
          {getSectorLabel(item.sector)}
        </Badge>
      ),
    },
    {
      key: "created_at",
      header: "Tanggal Scan",
      cell: (item) => (
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <FiClock size={12} /> {formatDate(item.created_at)}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Aksi",
      cell: (item) => (
        <div className="flex justify-end gap-2">
          <Button size="xs" variant="secondary" className="rounded-md" color="blue" icon={FiArrowRight} onClick={() => handleViewDetail(item.id)}>
            Buka
          </Button>
          <Button size="xs" variant="light" color="rose" icon={FiTrash2} onClick={(e) => openDeleteConfirm(e, item.id)} />
        </div>
      ),
      className: "text-right",
    },
  ];

  return (
    <div className="p-6 sm:p-10 bg-slate-50 min-h-screen space-y-8">
      {/* --- HEADER SECTION --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-xl text-blue-600 shadow-sm">
            <FiGlobe size={28} />
          </div>
          <div>
            <Title className="text-2xl text-slate-800">Horizon Scanner</Title>
            <Text className="text-slate-500">Intelijen risiko berbasis AI yang memindai berita global & lokal.</Text>
          </div>
        </div>

        {/* CONTROL PANEL (Scan Button) */}
        <div className="bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-2 w-full md:w-auto">
          <div className="w-full md:w-64">
            <SearchSelect value={selectedSector} onValueChange={setSelectedSector} disabled={isScanning || isSectorsLoading} placeholder="Pilih Target Industri..." className="border-none focus:ring-0">
              {sectorOptions.map((s) => (
                <SearchSelectItem key={s.key} value={s.key}>
                  {s.value}
                </SearchSelectItem>
              ))}
            </SearchSelect>
          </div>
          <Button size="md" icon={FiSearch} loading={isScanning} onClick={handleScan} disabled={isLimitReached || isSectorsLoading} className="shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all rounded-xl">
            {isScanning ? "Scanning..." : "Mulai Scan"}
          </Button>
        </div>
      </div>

      {limitConfig.limit !== null && (
        <div className="flex justify-end -mt-4 px-2">
          <Text className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded-md border border-blue-100">Sisa Kuota Scan: {remainingQuota}</Text>
        </div>
      )}

      {/* --- FILTER BAR (BARU) --- */}
      <Card className="p-4 shadow-sm border border-gray-100 rounded-xl">
        <div className="flex flex-col md:flex-row gap-4 items-center w-full">
          <div className="relative flex-grow w-full">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari laporan..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-gray-50 focus:bg-white transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full md:w-48 flex-shrink-0">
            <Select value={filterIndustry} onValueChange={setFilterIndustry} icon={FiFilter} placeholder="Filter Industri..." className="h-[42px]">
              <SelectItem value="all">Semua Industri</SelectItem>
              {sectorOptions.map((s) => (
                <SelectItem key={s.key} value={s.key}>
                  {s.value}
                </SelectItem>
              ))}
            </Select>
          </div>
          <div className="w-full md:w-40 flex-shrink-0">
            <Select value={sortOption} onValueChange={setSortOption} icon={FiClock} placeholder="Urutkan..." className="h-[42px]">
              <SelectItem value="newest">Terbaru</SelectItem>
              <SelectItem value="oldest">Terlama</SelectItem>
            </Select>
          </div>
          <div className="w-full md:w-auto flex-shrink-0">
            <Button
              size="lg"
              variant="secondary"
              icon={viewMode === "list" ? FiGrid : FiList}
              onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")}
              title={viewMode === "list" ? "Tampilan Grid" : "Tampilan List"}
              className="shadow-sm border-gray-200 bg-white hover:bg-gray-50 rounded-xl h-[42px]"
            />
          </div>
        </div>
      </Card>

      {/* --- HISTORY LIST/GRID --- */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-6 w-1 bg-blue-500 rounded-full"></div>
          <Title className="text-lg text-slate-700">Riwayat Laporan Intelijen</Title>
        </div>

        {isLoadingHistory ? (
          <div className="text-center py-20">
            <FiLoader className="animate-spin h-8 w-8 mx-auto text-gray-400 mb-2" />
            <Text>Memuat riwayat...</Text>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-xl bg-white">
            <FiGlobe className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <Text className="font-bold text-slate-700">Belum ada riwayat scanning.</Text>
          </div>
        ) : viewMode === "list" ? (
          // LIST VIEW
          <Card className="p-0 overflow-hidden shadow-sm border border-gray-100 rounded-xl">
            <AppResourceTable data={filteredHistory} isLoading={isLoadingHistory} columns={listColumns} emptyMessage="Tidak ada data." />
          </Card>
        ) : (
          // GRID VIEW
          <Grid numItemsSm={1} numItemsMd={2} numItemsLg={3} className="gap-6">
            {filteredHistory.map((item) => (
              <Card
                key={item.id}
                className="flex flex-col h-full hover:shadow-lg transition-all duration-200 border-t-4 border-t-blue-500 group cursor-pointer relative p-0 overflow-hidden bg-white border border-gray-200 rounded-xl"
                onClick={() => handleViewDetail(item.id)}
              >
                <div className="p-5 flex-grow">
                  <div className="flex justify-between items-start mb-3 pr-6">
                    <Badge size="xs" color="blue" icon={FiGlobe} className="rounded-md px-2 py-1">
                      {getSectorLabel(item.sector)}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <FiClock size={10} /> {formatDate(item.created_at)}
                    </div>
                  </div>
                  <Title className="text-lg font-bold text-slate-800 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors leading-snug">{item.title || "Laporan Tanpa Judul"}</Title>
                  <Text className="text-sm text-slate-600 line-clamp-3 leading-relaxed">{item.summary_preview?.replace(/<[^>]+>/g, "") || "Klik untuk melihat detail analisis lengkap..."}</Text>
                </div>
                <div className="p-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center mt-auto">
                  <Text className="text-xs font-medium text-blue-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Baca Laporan <FiArrowRight size={12} />
                  </Text>
                  <button onClick={(e) => openDeleteConfirm(e, item.id)} className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-colors z-10">
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </Card>
            ))}
          </Grid>
        )}
      </div>

      {/* --- MODAL PROGRESS SCANNING --- */}
      <Dialog open={isScanning} onClose={() => {}} static={true} className="z-[100]">
        <DialogPanel className="text-center max-w-md p-8 bg-white rounded-2xl shadow-2xl">
          <div className="mx-auto w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-6 relative">
            <div className="absolute inset-0 rounded-full border-4 border-blue-100 animate-ping opacity-75"></div>
            <FiCpu className="h-10 w-10 text-blue-600 animate-pulse relative z-10" />
          </div>
          <Title className="text-xl font-bold text-slate-800">AI Sedang Bekerja...</Title>
          <Text className="mt-2 text-sm text-slate-600">
            Memindai berita global & menyusun laporan untuk: <br />
            <span className="font-bold text-blue-600">{selectedSectorLabel}</span>
          </Text>
          <div className="mt-8">
            <ProgressBar value={scanProgress} color="blue" />
          </div>
        </DialogPanel>
      </Dialog>

      {/* --- MODAL DETAIL LAPORAN --- */}
      <Dialog open={isDetailOpen} onClose={() => setIsDetailOpen(false)} static={true} className="z-50">
        <DialogPanel className="w-full max-w-7xl h-[90vh] flex flex-col p-0 overflow-hidden rounded-xl bg-white shadow-2xl">
          <div className="bg-white px-8 py-5 border-b border-gray-200 flex justify-between items-start shadow-sm z-10">
            <div>
              {isDetailLoading ? (
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-gray-200 animate-pulse rounded"></div>
                  <div className="h-8 w-96 bg-gray-200 animate-pulse rounded"></div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-2">
                    <Badge size="xs" color="blue" className="rounded-md px-2 py-1">
                      {selectedScan && getSectorLabel(selectedScan.sector)}
                    </Badge>
                    <span className="text-xs text-gray-400 border-l border-gray-300 pl-3">{selectedScan && formatDate(selectedScan.created_at)}</span>
                  </div>
                  <Title className="text-2xl font-bold text-slate-800 leading-snug">{selectedScan?.title}</Title>
                </>
              )}
            </div>
            <Button variant="secondary" color="slate" icon={FiX} onClick={() => setIsDetailOpen(false)} className="rounded-full p-2 hover:bg-slate-100" />
          </div>

          <div className="flex-grow overflow-y-auto bg-slate-50 p-8">
            {isDetailLoading ? (
              <div className="text-center py-20">Loading...</div>
            ) : selectedScan ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1600px] mx-auto">
                {/* KOLOM KIRI: LAPORAN AI */}
                <div className="lg:col-span-8">
                  <Card className="shadow-sm border border-gray-100 p-8 min-h-[500px] bg-white">
                    <AIContentRenderer htmlContent={selectedScan.report_html} />
                  </Card>
                </div>

                {/* KOLOM KANAN: SUMBER BERITA */}
                <div className="lg:col-span-4 space-y-6">
                  <div className="bg-gradient-to-br from-blue-900 to-indigo-900 text-white p-5 rounded-xl shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-2 -mr-2 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
                    <Title className="text-white text-lg mb-1 relative z-10">Sumber Intelijen</Title>
                    <Text className="text-blue-100 text-xs relative z-10">AI menganalisis {selectedScan.news_data?.length || 0} artikel berita.</Text>
                  </div>
                  <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar pr-1">
                    {selectedScan.news_data?.map((news, idx) => (
                      <a
                        key={idx}
                        href={news.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-4 rounded-xl bg-white border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all group relative overflow-hidden"
                      >
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex justify-between items-start mb-2 pl-2">
                          <Badge size="xs" className="rounded-md px-2 py-1" color={news.source.includes("Reuters") ? "rose" : "blue"}>
                            {news.source}
                          </Badge>
                          <FiExternalLink className="h-3 w-3 text-gray-300 group-hover:text-blue-500" />
                        </div>
                        <Text className="font-bold text-xs leading-snug text-slate-800 group-hover:text-blue-700 mb-2 pl-2">{news.title}</Text>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 text-gray-500">Data laporan tidak ditemukan.</div>
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
