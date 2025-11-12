import React, { useState, useEffect, useRef } from "react";
import { Card, Title, Text, Button, TextInput, Select, SelectItem, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Icon, Badge, Grid, Flex, Subtitle } from "@tremor/react";
import { FiArrowLeft, FiPlus, FiTrash2, FiSave, FiEdit, FiSettings, FiX, FiLoader } from "react-icons/fi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../../../api/api";
import { toast } from "sonner";
import ConfirmationDialog from "../../../../components/common/ConfirmationDialog";

// Fetcher & Mutations
const fetchQuestions = async (cycleId) => {
  const { data } = await apiClient.get(`/admin/rsca-cycles/${cycleId}/questionnaire`);
  return data;
};

const addQuestion = ({ cycleId, questionData }) => {
  return apiClient.post(`/admin/rsca-cycles/${cycleId}/questionnaire`, questionData);
};

const updateQuestion = ({ id, questionData }) => {
  return apiClient.put(`/admin/rsca-questionnaire/${id}`, questionData);
};

const deleteQuestion = (questionId) => {
  return apiClient.delete(`/admin/rsca-questionnaire/${questionId}`);
};

function QuestionnaireEditor({ cycle, onBack }) {
  const queryClient = useQueryClient();
  const [newPertanyaan, setNewPertanyaan] = useState("");
  const [newKategori, setNewKategori] = useState("");
  const [newType, setNewType] = useState("text");
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, questionId: null });
  const formRef = useRef(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const queryKey = ["rscaQuestions", cycle.id];

  // Query untuk mengambil pertanyaan
  const { data: questions, isLoading: isLoadingQuestions } = useQuery({
    queryKey: queryKey,
    queryFn: () => fetchQuestions(cycle.id),
  });

  const resetForm = () => {
    setNewPertanyaan("");
    setNewKategori("");
    setNewType("text");
    setEditingQuestion(null);
  };

  // Mutation untuk menambah
  const addMutation = useMutation({ mutationFn: addQuestion });
  const updateMutation = useMutation({ mutationFn: updateQuestion });
  const deleteMutation = useMutation({ mutationFn: deleteQuestion });

  const handleSaveOrUpdate = async () => {
    if (!newPertanyaan || !newType) {
      toast.warning("Isi pertanyaan dan tipe tidak boleh kosong.");
      return;
    }

    const questionData = {
      pertanyaan: newPertanyaan,
      kategori: newKategori,
      question_type: newType,
    };

    setIsSaving(true);

    try {
      if (editingQuestion) {
        // Mode EDIT
        await updateMutation.mutateAsync({ id: editingQuestion.id, questionData });
        toast.success("Pertanyaan berhasil diupdate!");
      } else {
        // Mode TAMBAH
        await addMutation.mutateAsync({ cycleId: cycle.id, questionData });
        toast.success("Pertanyaan berhasil ditambah!");
      }
      queryClient.invalidateQueries({ queryKey: queryKey });
      resetForm();
    } catch (err) {
      toast.error(`Gagal menyimpan: ${err.message}`);
    } finally {
      setIsSaving(false); // <-- Set loading manual NONAKTIF
    }
  };

  const handleEditClick = (question) => {
    setEditingQuestion(question);
    setNewPertanyaan(question.pertanyaan);
    setNewKategori(question.kategori || "");
    setNewType(question.question_type);
    // Scroll ke atas ke form
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  // --- AKHIR HANDLER BARU ---

  const openDeleteConfirm = (questionId) => {
    setDeleteConfirm({ isOpen: true, questionId: questionId });
  };

  const handleConfirmDelete = async () => {
    // <-- Jadikan async
    setIsDeleting(true); // <-- Set loading manual AKTIF
    try {
      await deleteMutation.mutateAsync(deleteConfirm.questionId);
      toast.success("Pertanyaan berhasil dihapus!");
      queryClient.invalidateQueries({ queryKey: queryKey });
      setDeleteConfirm({ isOpen: false, questionId: null });
    } catch (err) {
      toast.error("Gagal: " + err.message);
    } finally {
      setIsDeleting(false); // <-- Set loading manual NONAKTIF
      setDeleteConfirm({ isOpen: false, questionId: null });
    }
  };

  const isFormDisabled = isSaving || isDeleting;

  return (
    <div className="p-6 sm:p-10 bg-gray-50 min-h-screen">
      <Flex alignItems="center" className="space-x-3 mb-6">
        <Icon icon={FiSettings} size="lg" variant="light" color="blue" />
        <div>
          <Title>Editor Kuesioner</Title>
          <Text>Atur pertanyaan untuk siklus: {cycle.nama_siklus}</Text>
        </div>
      </Flex>
      <Button icon={FiArrowLeft} variant="light" onClick={onBack} className="mb-4" disabled={isFormDisabled}>
        Kembali ke Manajemen Siklus
      </Button>
      <Grid numItemsLg={3} className="gap-6 items-start">
        <div className="lg:col-span-2">
          <Card>
            <Title>Daftar Pertanyaan ({questions?.length || 0})</Title>
            <Table className="mt-4">
              <TableHead>
                <TableRow>
                  <TableHeaderCell>No.</TableHeaderCell>
                  <TableHeaderCell>Pertanyaan</TableHeaderCell>
                  <TableHeaderCell>Tipe</TableHeaderCell>
                  <TableHeaderCell className="text-right">Aksi</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoadingQuestions ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      <Flex justifyContent="center" alignItems="center" className="gap-2">
                        <Icon icon={FiLoader} className="animate-spin" />
                        <Text>Memuat...</Text>
                      </Flex>
                    </TableCell>
                  </TableRow>
                ) : (
                  questions?.map((q, index) => (
                    <TableRow key={q.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="max-w-md">{q.pertanyaan}</TableCell>
                      <TableCell>
                        <Badge color={q.question_type === "text" ? "gray" : "blue"}>{q.question_type === "text" ? "Teks Bebas" : "Penilaian Kontrol"}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button icon={FiEdit} variant="light" color="blue" title="Edit Pertanyaan" onClick={() => handleEditClick(q)} disabled={isFormDisabled} />
                        <Button icon={FiTrash2} variant="light" color="rose" title="Hapus Pertanyaan" onClick={() => openDeleteConfirm(q.id)} disabled={isFormDisabled} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>

        {/* --- KOLOM KANAN (FORM TAMBAH/EDIT) --- */}
        <div className="lg:col-span-1">
          <div className="sticky top-20" ref={formRef}>
            <Card decoration="top" decorationColor={editingQuestion ? "amber" : "blue"}>
              <Title>{editingQuestion ? "Edit Pertanyaan" : "Tambah Pertanyaan Baru"}</Title>
              <div className="space-y-4 mt-4">
                {/* --- PERBAIKAN LOGIC DISABLED --- */}
                <TextInput
                  placeholder="Tulis pertanyaan..."
                  value={newPertanyaan}
                  onValueChange={setNewPertanyaan}
                  disabled={isSaving} // <-- Hanya disable saat form saving
                />
                <TextInput placeholder="Kategori (opsional)" value={newKategori} onValueChange={setNewKategori} disabled={isSaving} />
                <Select value={newType} onValueChange={setNewType} disabled={isSaving}>
                  <SelectItem value="text">Teks Bebas</SelectItem>
                  <SelectItem value="control_assessment">Penilaian Kontrol</SelectItem>
                </Select>

                <Flex className="gap-2">
                  {editingQuestion && (
                    <Button
                      icon={FiX}
                      variant="secondary"
                      onClick={resetForm}
                      disabled={isSaving} // <-- Hanya disable saat form saving
                      className="flex-1"
                    >
                      Batal
                    </Button>
                  )}
                  <Button icon={editingQuestion ? FiSave : FiPlus} onClick={handleSaveOrUpdate} loading={isSaving} disabled={isSaving} className="flex-1" color="blue">
                    {editingQuestion ? "Update" : "Tambah"}
                  </Button>
                </Flex>
                {/* --- AKHIR PERBAIKAN --- */}
              </div>
            </Card>
          </div>
        </div>
      </Grid>
      {/* --- DIALOG KONFIRMASI HAPUS --- */}
      <ConfirmationDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, questionId: null })}
        onConfirm={handleConfirmDelete}
        title="Konfirmasi Hapus"
        message="Apakah Anda yakin ingin menghapus pertanyaan ini? Tindakan ini tidak dapat dibatalkan."
        isLoading={isDeleting} // <-- Gunakan state manual
      />
    </div>
  );
}

export default QuestionnaireEditor;
