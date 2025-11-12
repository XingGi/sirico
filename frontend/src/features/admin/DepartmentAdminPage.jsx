import React, { useState } from "react";
import { Card, Title, Text, Button, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Icon, Flex } from "@tremor/react";
import { FiPlus, FiEdit, FiTrash2, FiBriefcase, FiHome, FiLoader, FiAlertTriangle } from "react-icons/fi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../api/api";
import { toast } from "sonner";
import ConfirmationDialog from "../../components/common/ConfirmationDialog";
import AddEditDepartmentModal from "./components/dept/AddEditDepartmentModal";

// Fetcher
const fetchDepartments = async () => {
  const { data } = await apiClient.get("/admin/departments");
  return data;
};

// Mutators
const createDepartment = (deptData) => apiClient.post("/admin/departments", deptData);
const updateDepartment = ({ id, ...deptData }) => apiClient.put(`/admin/departments/${id}`, deptData);
const deleteDepartment = (id) => apiClient.delete(`/admin/departments/${id}`);

function DepartmentAdminPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null); // Untuk edit atau hapus

  const queryKey = "adminDepartments";

  // Ambil data
  const { data: departments, isLoading } = useQuery({
    queryKey: [queryKey],
    queryFn: fetchDepartments,
  });

  // Mutasi
  const mutation = useMutation({
    mutationFn: (deptData) => {
      return deptData.id ? updateDepartment(deptData) : createDepartment(deptData);
    },
    onSuccess: () => {
      toast.success(selectedDept ? "Departemen berhasil diupdate" : "Departemen berhasil dibuat");
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      setModalOpen(false);
      setSelectedDept(null);
    },
    onError: (err) => toast.error("Gagal: " + err.response?.data?.msg || err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDepartment,
    onSuccess: () => {
      toast.success("Departemen berhasil dihapus");
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      setConfirmOpen(false);
      setSelectedDept(null);
    },
    onError: (err) => toast.error("Gagal: " + err.response?.data?.msg || err.message),
  });

  // Handlers
  const openAddModal = () => {
    setSelectedDept(null); // Pastikan null untuk mode 'Tambah'
    setModalOpen(true);
  };

  const openEditModal = (dept) => {
    setSelectedDept(dept); // Set data untuk mode 'Edit'
    setModalOpen(true);
  };

  const openDeleteConfirm = (dept) => {
    setSelectedDept(dept);
    setConfirmOpen(true);
  };

  const handleSave = (deptData) => {
    mutation.mutate(deptData);
  };

  const handleDelete = () => {
    deleteMutation.mutate(selectedDept.id);
  };

  return (
    <div className="p-6 sm:p-10">
      <Flex alignItems="center" className="space-x-3 mb-6">
        <Icon icon={FiBriefcase} size="lg" variant="light" color="blue" />
        <div>
          <Title>Manajemen Departemen</Title>
          <Text>Tambah, edit, atau hapus departemen untuk institusimu.</Text>
        </div>
        <div className="flex-grow" /> {/* Spacer */}
        <Button icon={FiPlus} onClick={openAddModal}>
          Tambah Departemen
        </Button>
      </Flex>

      <Card>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Nama Departemen</TableHeaderCell>
              <TableHeaderCell>Institusi</TableHeaderCell>
              <TableHeaderCell className="text-right">Aksi</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-10">
                  <Flex justifyContent="center" alignItems="center" className="space-x-2 text-tremor-content">
                    <Icon icon={FiLoader} className="animate-spin" size="sm" />
                    <Text>Memuat departemen...</Text>
                  </Flex>
                </TableCell>
              </TableRow>
            ) : departments?.length > 0 ? (
              departments.map((dept) => (
                <TableRow key={dept.id}>
                  <TableCell className="font-medium text-tremor-content-strong">{dept.name}</TableCell>
                  <TableCell>
                    <Flex alignItems="center" className="gap-2 w-fit">
                      <Icon icon={FiHome} size="sm" color="gray" />
                      <Text>{dept.institution || "Global"}</Text>
                    </Flex>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button icon={FiEdit} variant="light" color="blue" title="Edit" onClick={() => openEditModal(dept)} />
                    <Button icon={FiTrash2} variant="light" color="rose" title="Hapus" onClick={() => openDeleteConfirm(dept)} />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              // Tampilan Kosong (Empty State)
              <TableRow>
                <TableCell colSpan={3} className="text-center py-10">
                  <Icon icon={FiBriefcase} className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                  <Text className="font-medium">Belum ada departemen.</Text>
                  <Text>Klik tombol "Tambah Departemen" untuk memulai.</Text>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Modal untuk Tambah/Edit */}
      <AddEditDepartmentModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} department={selectedDept} isLoading={mutation.isPending} />

      {/* Modal Konfirmasi Hapus */}
      <ConfirmationDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Hapus Departemen"
        message={`Apakah Anda yakin ingin menghapus departemen "${selectedDept?.name}"?`}
        confirmButtonText="Hapus"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

export default DepartmentAdminPage;
