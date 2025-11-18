import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "../../api/api";
import { Title, Text, Button, Textarea, Select, SelectItem, Card, Badge, Flex, Icon, Grid, Subtitle, Dialog, DialogPanel } from "@tremor/react";
import { toast } from "sonner";
import { FiCalendar, FiAlertTriangle, FiFileText, FiCheckCircle, FiClock, FiMinusCircle, FiPlus, FiSend } from "react-icons/fi";

// --- KOMPONEN BARU UNTUK PERTANYAAN TIPE KONTROL ---
const ControlAssessmentQuestion = ({ question, answerData, onChange }) => {
  const effectivenessOptions = [
    { value: "Sangat Efektif", text: "Sangat Efektif - Kontrol berjalan sangat baik." },
    { value: "Efektif", text: "Efektif - Kontrol berjalan baik sesuai desain." },
    { value: "Perlu Perbaikan", text: "Perlu Perbaikan - Kontrol ada tapi tidak konsisten." },
    { value: "Tidak Efektif", text: "Tidak Efektif - Kontrol gagal atau tidak ada." },
  ];

  const handleSelectChange = (value) => {
    onChange(question.id, "control_effectiveness_rating", value);
  };

  const handleNotesChange = (e) => {
    onChange(question.id, "catatan", e.target.value);
  };

  const selectedOption = effectivenessOptions.find((opt) => opt.value === (answerData?.control_effectiveness_rating || ""));
  const selectedColor = selectedOption ? selectedOption.color : "gray";

  return (
    <Card className="mb-4 bg-white shadow-sm border-l-4" decorationColor={selectedColor}>
      {" "}
      {/* Tambah shadow dan border */}
      <label className="block font-semibold text-gray-800">{question.pertanyaan}</label>
      <Text className="text-sm text-gray-500 mb-2">Kategori: {question.kategori} (Penilaian Kontrol)</Text>
      <div className="mt-2">
        <Text className="font-medium">Penilaian Efektivitas Kontrol:</Text>
        <Select
          value={answerData?.control_effectiveness_rating || ""}
          onValueChange={handleSelectChange}
          placeholder="Pilih Efektivitas..."
          className="mt-1"
          color={selectedColor} // Terapkan warna ke Tremor Select
        >
          {effectivenessOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.text}
            </SelectItem>
          ))}
        </Select>
      </div>
      <div className="mt-2">
        <Text className="font-medium">Catatan / Bukti:</Text>
        <Textarea placeholder="Jelaskan temuan Anda atau bukti pendukung..." className="w-full p-2 border rounded mt-1" rows="2" value={answerData?.catatan || ""} onChange={handleNotesChange} />
      </div>
    </Card>
  );
};

// --- KOMPONEN LAMA UNTUK PERTANYAAN TIPE TEKS ---
const TextQuestion = ({ question, answerData, onChange }) => {
  return (
    <Card className="mb-4 bg-white shadow-sm border-l-4" decorationColor="blue">
      <label className="block font-semibold text-gray-800">{question.pertanyaan}</label>
      <Text className="text-sm text-gray-500 mb-2">Kategori: {question.kategori} (Pertanyaan Teks)</Text>
      <Textarea placeholder="Jawaban Anda..." className="w-full p-2 border rounded mt-1" rows="3" value={answerData?.jawaban || ""} onChange={(e) => onChange(question.id, "jawaban", e.target.value)} />
      <Textarea placeholder="Catatan (opsional)..." className="w-full p-2 border rounded mt-2" rows="2" value={answerData?.catatan || ""} onChange={(e) => onChange(question.id, "catatan", e.target.value)} />
    </Card>
  );
};

const mapAnswersToState = (answersList) => {
  const answerMap = {};
  if (answersList) {
    for (const ans of answersList) {
      answerMap[ans.questionnaire.id] = {
        jawaban: ans.jawaban,
        catatan: ans.catatan,
        control_effectiveness_rating: ans.control_effectiveness_rating,
        risk_register_id: ans.risk_register_id,
      };
    }
  }
  return answerMap;
};

// Fungsi helper untuk memformat tanggal
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString + "T00:00:00"); // Penting untuk zona waktu
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

function SubmitRiskModal({ isOpen, onClose, cycleId, onRiskSubmitted }) {
  const [description, setDescription] = useState("");
  const [cause, setCause] = useState("");
  const [impact, setImpact] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description) {
      toast.error("Deskripsi risiko wajib diisi.");
      return;
    }
    setIsSaving(true);

    try {
      const payload = {
        risk_description: description,
        potential_cause: cause,
        potential_impact: impact,
      };
      // Panggil endpoint baru yang kita buat di Langkah 3
      const response = await apiClient.post(`/rsca-cycles/${cycleId}/submit-risk`, payload);

      toast.success(response.data.msg || "Ajuan risiko berhasil dikirim.");
      onRiskSubmitted(response.data.submitted_risk); // Kirim data baru ke parent (opsional)
      handleClose(); // Tutup dan reset form
    } catch (err) {
      console.error("Gagal mengirim ajuan risiko:", err);
      toast.error(err.response?.data?.msg || "Gagal mengirim ajuan.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (isSaving) return; // Jangan tutup jika sedang menyimpan
    setDescription("");
    setCause("");
    setImpact("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} static={true}>
      <DialogPanel>
        <Title className="mb-4">Ajukan Risiko Baru</Title>
        <Text className="mb-4">Temukan risiko yang belum ada di kuesioner? Ajukan di sini untuk ditinjau oleh Manajer Risiko.</Text>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-tremor-default font-medium text-tremor-content-strong">Deskripsi Risiko (Wajib)</label>
            <Textarea value={description} onValueChange={setDescription} placeholder="Jelaskan risiko yang Anda temukan..." rows={3} required disabled={isSaving} className="mt-1" />
          </div>
          <div>
            <label className="text-tremor-default font-medium text-tremor-content-strong">Akar Penyebab (Opsional)</label>
            <Textarea value={cause} onValueChange={setCause} placeholder="Menurut Anda, apa penyebab risiko ini?" rows={2} disabled={isSaving} className="mt-1" />
          </div>
          <div>
            <label className="text-tremor-default font-medium text-tremor-content-strong">Potensi Dampak (Opsional)</label>
            <Textarea value={impact} onValueChange={setImpact} placeholder="Apa dampak terburuk yang bisa terjadi?" rows={2} disabled={isSaving} className="mt-1" />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="secondary" onClick={handleClose} disabled={isSaving}>
              Batal
            </Button>
            <Button type="submit" icon={FiSend} loading={isSaving} disabled={isSaving}>
              Kirim Ajuan
            </Button>
          </div>
        </form>
      </DialogPanel>
    </Dialog>
  );
}

function RscaQuestionnaireForm() {
  const { cycleId } = useParams();
  const navigate = useNavigate();
  const [cycle, setCycle] = useState(null); // State untuk nama siklus
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitRiskModalOpen, setIsSubmitRiskModalOpen] = useState(false);

  useEffect(() => {
    const fetchQuestionnaireAndAnswers = async () => {
      try {
        // 1. Ambil pertanyaan DAN jawaban yang sudah ada secara bersamaan
        const [questionRes, answerRes] = await Promise.all([
          apiClient.get(`/rsca-cycles/${cycleId}/questionnaire`),
          apiClient.get(`/rsca-cycles/${cycleId}/my-answers`), // <-- Panggil endpoint baru
        ]);

        setQuestions(questionRes.data.questions || []);
        setCycle(questionRes.data.cycle || {});

        // 2. Isi state 'answers' dengan jawaban yang sudah ada
        setAnswers(mapAnswersToState(answerRes.data));
      } catch (error) {
        console.error("Gagal memuat kuesioner atau jawaban:", error);
        toast.error(error.response?.data?.msg || "Gagal memuat data.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuestionnaireAndAnswers();
  }, [cycleId]);

  const handleAnswerChange = (questionId, field, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...(prev[questionId] || {}), // Ambil data jawaban lama jika ada
        [field]: value,
      },
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formattedAnswers = Object.entries(answers).map(([questionId, answerData]) => ({
      questionnaire_id: parseInt(questionId),
      jawaban: answerData.jawaban || null, // Kirim null jika tidak ada
      catatan: answerData.catatan || null, // Kirim null jika tidak ada
      control_effectiveness_rating: answerData.control_effectiveness_rating || null, // Kirim data baru
      risk_register_id: answerData.risk_register_id || null, // Kirim data baru
    }));

    apiClient
      .post(`/rsca-cycles/${cycleId}/answers`, { answers: formattedAnswers })
      .then(() => {
        toast.success("Jawaban berhasil dikirim!");
        navigate("/addons/rsca"); // Arahkan kembali ke rute add-ons
      })
      .catch((error) => toast.error("Gagal mengirim jawaban. " + error.message));
  };

  if (isLoading) return <p>Memuat pertanyaan...</p>;

  const isPastDueDate = cycle?.tanggal_selesai && new Date() > new Date(cycle.tanggal_selesai);

  const getCycleStatusDisplay = (status) => {
    if (!status) return { text: "N/A", color: "gray", icon: FiMinusCircle };
    switch (status) {
      case "Draft":
        return { text: "Draf", color: "gray", icon: FiMinusCircle };
      case "Berjalan":
        return { text: "Berjalan", color: "blue", icon: FiClock };
      case "Selesai":
        return { text: "Selesai", color: "emerald", icon: FiCheckCircle };
      default:
        return { text: status, color: "gray", icon: FiMinusCircle };
    }
  };
  const cycleStatus = getCycleStatusDisplay(cycle?.status);

  return (
    <>
      <div className="p-6 sm:p-10 bg-gray-50 min-h-screen">
        {/* 1. Header Halaman yang Konsisten */}
        <Flex alignItems="center" className="space-x-3 mb-6">
          <Icon icon={FiFileText} size="lg" variant="light" color="blue" />
          <div>
            <Title>Kuesioner RSCA</Title>
            <Text>Isi pertanyaan di bawah ini untuk departemen Anda.</Text>
          </div>
        </Flex>
        {/* 2. Bungkus semua dengan <form> di luar <Grid> */}
        <Grid numItemsLg={3} className="gap-6 items-start">
          <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-4">
            {/* 3. Kolom Kiri (Utama) untuk Pertanyaan */}
            {questions.length === 0 ? (
              <Card>
                <Text>Tidak ada pertanyaan yang ditemukan untuk siklus ini. Hubungi Manajer Risiko Anda.</Text>
              </Card>
            ) : (
              questions.map((q, index) => (
                <div key={q.id}>
                  <Text className="font-bold text-lg mb-2 text-tremor-content-strong">Pertanyaan {index + 1}</Text>
                  {q.question_type === "control_assessment" ? (
                    <ControlAssessmentQuestion question={q} answerData={answers[q.id]} onChange={handleAnswerChange} />
                  ) : (
                    <TextQuestion question={q} answerData={answers[q.id]} onChange={handleAnswerChange} />
                  )}
                </div>
              ))
            )}
            {questions.length > 0 && (
              <Button
                type="submit" // Ini akan men-trigger 'handleSubmit'
                className="w-full mt-4" // Beri jarak
                size="lg"
                disabled={isPastDueDate || questions.length === 0}
                title={isPastDueDate ? "Tenggat waktu sudah terlewat" : "Kirim atau perbarui jawaban Anda"}
                color={isPastDueDate ? "gray" : "blue"}
              >
                {isPastDueDate ? "Tenggat Waktu Terlewat" : "Kirim Jawaban"}
              </Button>
            )}
          </form>

          {/* 4. Kolom Kanan (Sidebar) untuk Info & Aksi */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-6">
              {/* Card Info Siklus */}
              <Card>
                <Subtitle>Detail Siklus</Subtitle>
                <Title className="mt-1 mb-3">{cycle?.nama_siklus || "Memuat..."}</Title>

                {/* --- UBAH BADGE STATUS --- */}
                <Badge color={cycleStatus.color} icon={cycleStatus.icon}>
                  {cycleStatus.text}
                </Badge>
                {/* --- AKHIR UBAHAN --- */}

                <Flex className="mt-4 space-x-2 text-tremor-content" alignItems="center">
                  <Icon icon={FiCalendar} size="sm" color="gray" variant="solid" /> {/* Warna ikon Calendar */}
                  <Text>Mulai: {formatDate(cycle?.tanggal_mulai)}</Text>
                </Flex>
                <Flex className="mt-2 space-x-2" alignItems="center">
                  <Icon icon={FiCalendar} size="sm" color={isPastDueDate ? "rose" : "gray"} variant="solid" /> {/* Warna ikon Calendar */}
                  <Text color={isPastDueDate ? "rose" : "inherit"}>Selesai: {formatDate(cycle?.tanggal_selesai)}</Text>
                </Flex>
              </Card>
              {/* Card Aksi (Tombol & Peringatan) */}
              <Card>
                <Subtitle>Aksi</Subtitle>

                <Button
                  icon={FiPlus}
                  variant="secondary"
                  className="w-full mt-4"
                  onClick={() => setIsSubmitRiskModalOpen(true)} // Ini HANYA akan membuka modal
                  disabled={isPastDueDate}
                  title="Ajukan risiko baru yang tidak ada di daftar"
                >
                  Ajukan Risiko Baru
                </Button>

                {/* Peringatan Tenggat Waktu (jika ada) */}
                {isPastDueDate && (
                  <div className="mt-4">
                    <Card decoration="left" decorationColor="rose" className="bg-red-50">
                      <Flex>
                        <Icon icon={FiAlertTriangle} color="rose" variant="light" /> {/* Warna ikon */}
                        <div className="ml-3">
                          <Text color="rose" className="font-semibold">
                            Tenggat Waktu Terlewat
                          </Text>
                          <Text className="text-xs">Jawaban tidak dapat diubah lagi.</Text>
                        </div>
                      </Flex>
                    </Card>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </Grid>
      </div>
      <SubmitRiskModal
        isOpen={isSubmitRiskModalOpen}
        onClose={() => setIsSubmitRiskModalOpen(false)}
        cycleId={cycleId}
        onRiskSubmitted={(newRisk) => {
          console.log("Ajuan baru diterima:", newRisk);
        }}
      />
    </>
  );
}

export default RscaQuestionnaireForm;
