import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../api/api";
import { Title, Text, Card, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Badge, Button, Flex, Icon, Subtitle, Divider, Dialog, DialogPanel } from "@tremor/react";
import { FiArrowLeft, FiCpu, FiLoader, FiAlertTriangle, FiCheckCircle, FiCheck, FiX, FiArchive, FiPlusSquare } from "react-icons/fi";
import { RiRobot2Line } from "react-icons/ri";
import { toast } from "sonner";
import NotificationModal from "../../components/common/NotificationModal";
import ConfirmationDialog from "../../components/common/ConfirmationDialog";
import ActionPlanModal from "./components/rsca/ActionPlanModal";

// Fetcher untuk detail hasil
const fetchCycleResults = async (cycleId) => {
  const { data } = await apiClient.get(`/admin/rsca-cycles/${cycleId}/results`);
  return data;
};

// Mutator untuk memicu AI
const triggerAIAnalysis = async (cycleId) => {
  const { data } = await apiClient.post(`/rsca-cycles/${cycleId}/analyze`);
  return data;
};

// Helper untuk memberi warna pada badge penilaian
const getEffectivenessColor = (rating) => {
  if (rating === "Tidak Efektif") return "red";
  if (rating === "Perlu Perbaikan") return "amber";
  if (rating === "Efektif" || rating === "Sangat Efektif") return "green";
  return "gray";
};

const ParseBold = ({ text }) => {
  const parts = text.split(/(\*\*.*?\*\*)/g); // Pisahkan dengan **teks**
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-tremor-content-strong">
          {part.substring(2, part.length - 2)}
        </strong>
      );
    }
    return part;
  });
};

// Helper untuk merender konten (paragraf, bullet point)
const RenderMarkdownContent = ({ content }) => {
  if (!content) return null;

  const lines = content.split("\n").filter((line) => line.trim() !== ""); // Pisahkan per baris & hapus baris kosong

  const elements = [];
  let listItems = [];

  const flushList = () => {
    // Fungsi untuk "membuang" list yg terkumpul
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="list-disc pl-5 space-y-1">
          {listItems.map((item, idx) => (
            <li key={idx}>
              <Text>
                <ParseBold text={item} />
              </Text>
            </li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  lines.forEach((line, i) => {
    const trimmedLine = line.trim();

    // Cek untuk bullet points (dimulai dengan * atau -)
    if (trimmedLine.startsWith("* ") || trimmedLine.startsWith("- ")) {
      listItems.push(trimmedLine.substring(2)); // Tambahkan ke list, buang '* '
    }
    // Ini adalah paragraf biasa
    else {
      flushList(); // Tampilkan list sebelumnya (jika ada)
      elements.push(
        <Text key={`p-${i}`} as="p">
          <ParseBold text={trimmedLine} />
        </Text>
      );
    }
  });

  flushList(); // Pastikan list terakhir juga ditampilkan

  return <div className="space-y-2">{elements}</div>;
};

const ParsedMarkdown = ({ text }) => {
  if (!text) return null;

  // 1. Pisahkan teks berdasarkan "## " (header Markdown)
  const sections = text
    .split("\n## ")
    .map((s) => s.trim())
    .filter(Boolean);

  // 2. Bersihkan '##' pertama jika ada (jika teks tidak dimulai dgn '##')
  if (sections.length > 0 && !text.startsWith("## ")) {
    sections[0] = sections[0].replace("## ", "");
  }

  return (
    <div className="space-y-4">
      {sections.map((section, index) => {
        const newlineIndex = section.indexOf("\n");
        const title = newlineIndex !== -1 ? section.substring(0, newlineIndex) : `Bagian ${index + 1}`;
        const content = newlineIndex !== -1 ? section.substring(newlineIndex + 1) : section;

        return (
          <div key={index}>
            <Flex alignItems="center" className="space-x-2 w-fit">
              <Icon icon={RiRobot2Line} color="blue" variant="light" />
              <Subtitle className="font-semibold text-tremor-content-strong">
                {title.replace(/^\d+\.\s*/, "")} {/* Hapus nomor (misal "1. ") */}
              </Subtitle>
            </Flex>
            <div className="mt-2 ml-8">
              <RenderMarkdownContent content={content} />
            </div>
            {index < sections.length - 1 && <Divider className="my-4" />}
          </div>
        );
      })}
    </div>
  );
};

const getStatusBadgeColor = (status) => {
  if (status === "Disetujui") return "green";
  if (status === "Ditolak") return "red";
  if (status === "Menunggu Persetujuan") return "amber";
  return "gray";
};

const updateRiskStatus = async ({ riskId, status }) => {
  const { data } = await apiClient.put(`/admin/submitted-risks/${riskId}/status`, { status: status });
  return data;
};

function RscaResultPage() {
  const { cycleId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const queryKey = ["rscaResult", cycleId];
  const [confirmStatusModal, setConfirmStatusModal] = useState({
    isOpen: false,
    risk: null,
    newStatus: "",
  });
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);
  const [notificationModal, setNotificationModal] = useState({ isOpen: false, title: "", message: "" });
  const [isActionPlanModalOpen, setIsActionPlanModalOpen] = useState(false);
  const [actionPlanSource, setActionPlanSource] = useState(null);

  // Query untuk mengambil data
  const { data, isLoading, error } = useQuery({
    queryKey: queryKey,
    queryFn: () => fetchCycleResults(cycleId),
  });

  // Mutasi untuk memanggil AI Gemini
  const aiMutation = useMutation({
    mutationFn: () => triggerAIAnalysis(cycleId),
    onSuccess: (data) => {
      toast.success("Analisis AI berhasil!");
      // Muat ulang data untuk mendapatkan ai_summary yang baru
      queryClient.invalidateQueries({ queryKey: queryKey });
    },
    onError: (err) => {
      toast.error(err.response?.data?.msg || "Analisis AI gagal.");
    },
  });

  const handleAnalyze = async () => {
    setIsAiModalOpen(true);
    setAiProgress(0);

    // 1. Simulasi progres (agar modal terlihat bekerja)
    const progressInterval = setInterval(() => {
      setAiProgress((prev) => Math.min(prev + Math.floor(Math.random() * 10) + 5, 95));
    }, 800);

    try {
      // 2. Panggil API
      await aiMutation.mutateAsync(cycleId);

      // 3. Sukses
      clearInterval(progressInterval);
      setAiProgress(100);
      toast.success("Analisis AI berhasil!");
      queryClient.invalidateQueries({ queryKey: queryKey }); // Muat ulang data

      // Tutup modal setelah 1 detik (agar user lihat 100%)
      setTimeout(() => setIsAiModalOpen(false), 1000);
    } catch (err) {
      // 4. Gagal
      clearInterval(progressInterval);
      setIsAiModalOpen(false);
      const msg = err.response?.data?.msg || "Terjadi kesalahan saat membuat analisis AI.";
      setNotificationModal({ isOpen: true, title: "Analisis AI Gagal", message: msg });
    }
  };

  const statusMutation = useMutation({
    mutationFn: updateRiskStatus,
    onSuccess: (data) => {
      toast.success(data.msg || "Status ajuan berhasil diupdate!");
      queryClient.invalidateQueries({ queryKey: queryKey });
      setConfirmStatusModal({ isOpen: false, risk: null, newStatus: "" });
    },
    onError: (err) => {
      toast.error(err.response?.data?.msg || "Gagal mengupdate status.");
    },
  });

  const openConfirmModal = (risk, newStatus) => {
    setConfirmStatusModal({
      isOpen: true,
      risk: risk,
      newStatus: newStatus,
    });
  };

  // 2. Fungsi ini dipanggil saat "Ya, Hapus" diklik
  const handleConfirmStatusUpdate = () => {
    const { risk, newStatus } = confirmStatusModal;
    if (risk && newStatus) {
      statusMutation.mutate({ riskId: risk.id, status: newStatus });
    }
  };

  // 3. Fungsi ini untuk menutup modal
  const handleCloseConfirmModal = () => {
    // Jangan tutup jika sedang loading
    if (statusMutation.isPending) return;
    setConfirmStatusModal({ isOpen: false, risk: null, newStatus: "" });
  };

  const openActionPlanModal = (source) => {
    // source akan berupa { origin_answer_id: 123 }
    // atau { origin_submitted_risk_id: 456 }
    setActionPlanSource(source);
    setIsActionPlanModalOpen(true);
  };

  const handleCloseActionPlanModal = () => {
    setIsActionPlanModalOpen(false);
    setActionPlanSource(null);
  };

  const handleActionPlanSaveSuccess = () => {
    // Cukup tutup modal, queryClient.invalidateQueries sudah di-handle di dalam modal
    handleCloseActionPlanModal();
    // Kita juga bisa refresh datanya di sini untuk jaga-jaga
    queryClient.invalidateQueries({ queryKey: queryKey });
  };

  if (isLoading) return <Text className="p-6">Memuat hasil...</Text>;
  if (error) return <Text className="p-6 text-red-500">Error: {error.response?.data?.msg || error.message}</Text>;
  if (!data) return <Text className="p-6">Tidak ada data.</Text>;

  const { cycle = {}, answers = [], ai_summary, submitted_risks = [] } = data || {};

  return (
    <>
      <div className="p-6 sm:p-10 bg-gray-50 min-h-screen">
        <Button icon={FiArrowLeft} variant="light" onClick={() => navigate("/admin/rsca")} className="mb-4">
          Kembali ke Manajemen Siklus
        </Button>
        <Flex>
          <div>
            <Title>Hasil Kuesioner: {cycle.nama_siklus}</Title>
            <Text>Tinjau jawaban yang dikirim oleh departemen untuk institusi {cycle.institution}.</Text>
          </div>
          {/* --- TOMBOL PINDAH KE SINI --- */}
          <div className="flex-shrink-0">
            <Button
              icon={FiCpu}
              onClick={handleAnalyze}
              loading={aiMutation.isPending}
              disabled={answers.length === 0}
              title="Minta Gemini AI untuk menganalisis semua jawaban"
              variant={ai_summary ? "secondary" : "primary"} // Ubah jadi secondary jika sudah ada
            >
              {ai_summary ? "Analisis Ulang" : "Buat Analisis AI"}
            </Button>
          </div>
        </Flex>
        <Divider className="my-6" />
        <Card>
          <Flex alignItems="start">
            <Title>Ringkasan Analisis (AI)</Title>
          </Flex>

          <div className="mt-4">
            {aiMutation.isPending &&
              !isAiModalOpen && ( // Loading awal
                <Flex justifyContent="center" className="p-6">
                  <Icon icon={FiLoader} className="animate-spin" />
                  <Text>Memuat...</Text>
                </Flex>
              )}

            {!aiMutation.isPending && ai_summary && <ParsedMarkdown text={ai_summary} />}

            {!aiMutation.isPending && !ai_summary && (
              <Flex justifyContent="center" alignItems="center" className="p-6 flex-col gap-2">
                <Icon icon={FiAlertTriangle} color="gray" variant="light" size="lg" />
                <Text className="text-gray-500">Belum ada ringkasan.</Text>
                <Text className="text-gray-500 text-sm">Klik tombol "Buat Analisis AI" di atas untuk membuat.</Text>
              </Flex>
            )}
          </div>
        </Card>
        <Card className="mt-6">
          <Flex alignItems="start">
            <Icon icon={FiArchive} size="lg" variant="light" color="amber" />
            <div className="ml-3">
              <Title>Ajuan Risiko Baru ({submitted_risks.length})</Title>
              <Text>Risiko yang diajukan oleh staf departemen (bottom-up). Perlu tinjauan Anda.</Text>
            </div>
          </Flex>

          <Table className="mt-4">
            <TableHead>
              <TableRow>
                <TableHeaderCell>Diajukan Oleh</TableHeaderCell>
                <TableHeaderCell>Departemen</TableHeaderCell>
                <TableHeaderCell>Deskripsi Ajuan Risiko</TableHeaderCell>
                <TableHeaderCell>Tanggal</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell className="text-right">Aksi</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {submitted_risks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    Belum ada ajuan risiko yang dikirim oleh staf.
                  </TableCell>
                </TableRow>
              ) : (
                submitted_risks.map((risk) => (
                  <TableRow key={risk.id}>
                    <TableCell>{risk.submitter?.nama_lengkap || "N/A"}</TableCell>
                    <TableCell>{risk.department?.name || "N/A"}</TableCell>
                    <TableCell className="max-w-md whitespace-normal break-words">
                      <Text className="font-medium">{risk.risk_description}</Text>
                      <Text>
                        <span className="font-medium">Penyebab:</span> {risk.potential_cause || "-"}
                      </Text>
                      <Text>
                        <span className="font-medium">Dampak:</span> {risk.potential_impact || "-"}
                      </Text>
                    </TableCell>
                    <TableCell>{risk.created_at}</TableCell>
                    <TableCell>
                      <Badge color={getStatusBadgeColor(risk.status)}>{risk.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {risk.status === "Menunggu Persetujuan" ? (
                        <>
                          <Button
                            icon={FiCheck}
                            variant="light"
                            color="green"
                            title="Setujui Ajuan"
                            onClick={() => openConfirmModal(risk, "Disetujui")}
                            loading={statusMutation.isPending && confirmStatusModal.risk?.id === risk.id}
                            disabled={statusMutation.isPending}
                          />
                          <Button
                            icon={FiX}
                            variant="light"
                            color="red"
                            title="Tolak Ajuan"
                            onClick={() => openConfirmModal(risk, "Ditolak")}
                            loading={statusMutation.isPending && confirmStatusModal.risk?.id === risk.id}
                            disabled={statusMutation.isPending}
                          />
                        </>
                      ) : (
                        <>
                          {risk.status === "Disetujui" && (
                            <Button
                              icon={FiPlusSquare} // <-- Tombol yang hilang
                              variant="light"
                              color="blue"
                              title="Buat Rencana Aksi"
                              onClick={() => openActionPlanModal({ origin_submitted_risk_id: risk.id })}
                            />
                          )}
                          {/* Tampilkan teks 'Tindakan Selesai' HANYA jika ditolak */}
                          {risk.status === "Ditolak" && <Text className="italic text-gray-500">Tindakan Selesai</Text>}
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
        {/* Card Tabel Jawaban */}
        <Card className="mt-6">
          <Title>Jawaban Terkirim ({answers.length})</Title>
          <Table className="mt-4">
            <TableHead>
              <TableRow>
                <TableHeaderCell>Departemen</TableHeaderCell>
                <TableHeaderCell>Pertanyaan</TableHeaderCell>
                <TableHeaderCell>Tipe Jawaban</TableHeaderCell>
                <TableHeaderCell>Jawaban / Penilaian</TableHeaderCell>
                <TableHeaderCell>Catatan</TableHeaderCell>
                <TableHeaderCell className="text-right">Aksi</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {answers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Belum ada jawaban yang dikirim.
                  </TableCell>
                </TableRow>
              ) : (
                answers.map((ans) => {
                  const isFinding = ans.questionnaire?.question_type === "control_assessment" && (ans.control_effectiveness_rating === "Tidak Efektif" || ans.control_effectiveness_rating === "Perlu Perbaikan");
                  return (
                    <TableRow key={ans.id}>
                      <TableCell>{ans.department?.name || "N/A"}</TableCell>
                      <TableCell className="max-w-xs whitespace-normal break-words">{ans.questionnaire?.pertanyaan || "N/A"}</TableCell>
                      <TableCell>{ans.questionnaire?.question_type === "control_assessment" ? <Badge color="blue">Penilaian Kontrol</Badge> : <Badge color="gray">Teks Bebas</Badge>}</TableCell>
                      <TableCell>
                        {ans.questionnaire?.question_type === "control_assessment" ? (
                          <Badge color={getEffectivenessColor(ans.control_effectiveness_rating)}>{ans.control_effectiveness_rating || "N/A"}</Badge>
                        ) : (
                          <Text className="max-w-xs">{ans.jawaban || "N/A"}</Text>
                        )}
                      </TableCell>
                      <TableCell className="max-w-sm">{ans.catatan || "N/A"}</TableCell>
                      <TableCell className="text-right">
                        {isFinding && ( // Tampilkan tombol HANYA jika 'isFinding' true
                          <Button icon={FiPlusSquare} variant="light" color="blue" title="Buat Rencana Aksi" onClick={() => openActionPlanModal({ origin_answer_id: ans.id })} />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
      <Dialog open={isAiModalOpen} onClose={() => {}} static={true} className="z-[100]">
        <DialogPanel className="max-w-md p-6 text-center">
          <Flex justifyContent="center" className="mb-4">
            {aiProgress === 100 ? <Icon icon={FiCheckCircle} size="xl" color="emerald" variant="light" /> : <Icon icon={RiRobot2Line} size="xl" color="blue" variant="light" className="animate-pulse" />}
          </Flex>
          <Title className="text-tremor-content-strong">{aiProgress === 100 ? "Analisis Selesai" : "AI Sedang Menganalisis"}</Title>
          <Text className="mt-2 text-tremor-content">{aiProgress === 100 ? "Ringkasan telah berhasil dibuat." : "Membuat laporan analisis RSCA yang komprehensif..."}</Text>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
            <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out" style={{ width: `${aiProgress}%` }}></div>
          </div>
          <Text className="mt-2 text-tremor-content-emphasis text-sm">{aiProgress}% Selesai</Text>
        </DialogPanel>
      </Dialog>
      <NotificationModal isOpen={notificationModal.isOpen} onClose={() => setNotificationModal({ isOpen: false, title: "", message: "" })} title={notificationModal.title} message={notificationModal.message} />
      <ConfirmationDialog
        isOpen={confirmStatusModal.isOpen}
        onClose={handleCloseConfirmModal}
        onConfirm={handleConfirmStatusUpdate}
        title={`Konfirmasi Status: ${confirmStatusModal.newStatus}`}
        message={`Apakah Anda yakin ingin mengubah status ajuan risiko "${confirmStatusModal.risk?.risk_description}" menjadi "${confirmStatusModal.newStatus}"?`}
        confirmButtonText={confirmStatusModal.newStatus} // Teks tombol (misal: "Disetujui")
        isLoading={statusMutation.isPending}
        confirmButtonColor={confirmStatusModal.newStatus === "Disetujui" ? "green" : "rose"}
      />
      <ActionPlanModal isOpen={isActionPlanModalOpen} onClose={handleCloseActionPlanModal} sourceData={actionPlanSource} onSaveSuccess={handleActionPlanSaveSuccess} institution={cycle?.institution} cycleId={cycleId} />
    </>
  );
}

export default RscaResultPage;
