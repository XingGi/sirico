// frontend/src/features/admin/MemberPage.jsx

import React, { useState, useEffect, useMemo } from "react";
import { Card, Title, Text, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Button, Badge, MultiSelect, MultiSelectItem, Dialog, DialogPanel, TextInput, Flex, Icon } from "@tremor/react";
import apiClient from "../../api/api";
import { FiUsers, FiEdit, FiSliders, FiSave, FiX, FiSearch, FiLoader, FiPlus, FiTrash2, FiAlertTriangle } from "react-icons/fi";
import AppResourceTable from "../../components/common/AppResourceTable";
import ConfirmationDialog from "../../components/common/ConfirmationDialog";
import EditUserModal from "./components/EditUserModal";
import AddUserModal from "./components/AddUserModal";

// Komponen Modal Bulk Edit Roles
const BulkEditRolesModal = ({ isOpen, onClose, selectedUsers, allRoles, onSave, isLoading }) => {
  const [selectedRoleIds, setSelectedRoleIds] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      // Reset pilihan saat modal dibuka
      setSelectedRoleIds([]);
      setError("");
    }
  }, [isOpen]);

  const handleSave = async () => {
    setError("");
    const userIds = selectedUsers.map((u) => u.id);
    await onSave(userIds, selectedRoleIds.map(Number));
  };

  return (
    <Dialog open={isOpen} onClose={() => !isLoading && onClose()} static={true}>
      <DialogPanel>
        <Title>Bulk Edit Roles ({selectedUsers.length} Users)</Title>
        <Text className="mt-1">Assign roles baru ke semua pengguna yang dipilih.</Text>
        {error && <Text className="text-red-500 mt-2">{error}</Text>}

        <div className="mt-4">
          <label className="font-medium text-tremor-content-strong">Assign Roles *</label>
          <MultiSelect value={selectedRoleIds} onValueChange={setSelectedRoleIds} placeholder="Pilih satu atau lebih role untuk di-assign..." className="mt-2" required>
            {allRoles.map((role) => (
              <MultiSelectItem key={role.id} value={String(role.id)}>
                {role.name} {role.description && `(${role.description})`}
              </MultiSelectItem>
            ))}
          </MultiSelect>
          <Text className="mt-2 text-xs text-gray-500">Catatan: Roles yang dipilih akan menggantikan roles yang sudah ada pada pengguna terpilih.</Text>
        </div>

        <div className="flex justify-end gap-2 mt-6 border-t pt-4">
          <Button variant="secondary" onClick={onClose} disabled={isLoading} icon={FiX}>
            Batal
          </Button>
          <Button onClick={handleSave} loading={isLoading} disabled={isLoading} icon={FiSave}>
            Apply Roles to {selectedUsers.length} Users
          </Button>
        </div>
      </DialogPanel>
    </Dialog>
  );
};

function MemberPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState(new Set());
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const [isSubmittingBulk, setIsSubmittingBulk] = useState(false);
  const [modalError, setModalError] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, userId: null, userName: "" });
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([apiClient.get("/admin/users"), apiClient.get("/admin/roles")]);
      setUsers(usersRes.data);
      setRoles(rolesRes.data);
    } catch (error) {
      console.error("Gagal memuat data member/roles:", error);
      alert("Gagal memuat data pengguna atau roles.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchData();
  }, []);

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    const lowerSearchTerm = searchTerm.toLowerCase();
    return users.filter((user) => user.nama_lengkap.toLowerCase().includes(lowerSearchTerm) || user.email.toLowerCase().includes(lowerSearchTerm));
  }, [users, searchTerm]);

  const handleSelectUser = (userId, checked) => {
    setSelectedUserIds((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(userId);
      } else {
        newSet.delete(userId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedUserIds(new Set(filteredUsers.map((u) => u.id)));
    } else {
      setSelectedUserIds(new Set());
    }
  };

  const isAllSelected = filteredUsers.length > 0 && selectedUserIds.size === filteredUsers.length;

  const handleOpenEditModal = (userIdToEdit) => {
    setEditingUserId(userIdToEdit);
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setIsBulkEditModalOpen(false);
    setIsAddModalOpen(false);
    setEditingUserId(null);
  };

  const handleSaveUserSuccess = (updatedUserData) => {
    setUsers((prevUsers) => prevUsers.map((user) => (user.id === updatedUserData.id ? updatedUserData : user)));
  };

  const handleAddUserSuccess = (newUserData) => {
    setUsers((prevUsers) => [newUserData, ...prevUsers]);
  };

  const handleOpenDeleteConfirm = (userId, userName) => {
    setDeleteConfirm({ isOpen: true, userId, userName });
  };

  const handleCloseDeleteConfirm = () => {
    setDeleteConfirm({ isOpen: false, userId: null, userName: "" });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm.userId) return;
    setIsDeleting(true);

    try {
      await apiClient.delete(`/admin/users/${deleteConfirm.userId}`);
      setUsers((prevUsers) => prevUsers.filter((user) => user.id !== deleteConfirm.userId));
      alert(`User "${deleteConfirm.userName}" berhasil dihapus.`);
      handleCloseDeleteConfirm();
    } catch (error) {
      console.error("Gagal menghapus user:", error);
      alert(error.response?.data?.msg || "Gagal menghapus user.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkSaveRoles = async (userIds, newRoleIds) => {
    setModalError("");
    setIsSubmittingBulk(true);
    const payload = { role_ids: newRoleIds };
    let successCount = 0;
    let firstError = null;

    for (const userId of userIds) {
      try {
        const response = await apiClient.put(`/admin/users/${userId}/roles`, payload);
        handleSaveUserSuccess(response.data.user);
        successCount++;
      } catch (error) {
        console.error(`Gagal update role untuk user ID ${userId}:`, error);
        if (!firstError) {
          firstError = error.response?.data?.msg || `Gagal update user ID ${userId}`;
        }
      }
    }

    setIsSubmittingBulk(false);
    if (firstError) {
      setModalError(`Sebagian (${successCount}/${userIds.length}) berhasil. Error pertama: ${firstError}`);
    } else {
      alert(`Roles berhasil diperbarui untuk ${successCount} pengguna.`);
      handleCloseModal();
      setSelectedUserIds(new Set());
    }
  };

  const columns = [
    {
      key: "select",
      // Kita bisa mengirim JSX ke header!
      header: (
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={isAllSelected}
            onChange={(e) => handleSelectAll(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            disabled={filteredUsers.length === 0}
          />
        </div>
      ),
      cell: (user) => (
        <input type="checkbox" checked={selectedUserIds.has(user.id)} onChange={(e) => handleSelectUser(user.id, e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
      ),
      className: "w-12", // Class untuk header cell
    },
    {
      key: "name",
      header: "Nama Lengkap",
      cell: (user) => <Text className="font-medium text-tremor-content-strong">{user.nama_lengkap}</Text>,
    },
    {
      key: "email",
      header: "Email",
      cell: (user) => <Text>{user.email}</Text>,
    },
    {
      key: "institution",
      header: "Institusi",
      cell: (user) => <Text>{user.institution || "N/A"}</Text>,
    },
    {
      key: "department",
      header: "Departemen",
      cell: (user) => <Text>{user.department_name || "N/A"}</Text>,
    },
    {
      key: "roles",
      header: "Roles",
      cell: (user) => (
        <Flex className="gap-1 flex-wrap">
          {user.roles && user.roles.length > 0 ? (
            user.roles.map((roleName) => (
              <Badge key={roleName} color={roleName.toLowerCase() === "admin" ? "rose" : "blue"} size="xs" className="whitespace-nowrap">
                {roleName}
              </Badge>
            ))
          ) : (
            <Badge color="gray" size="xs">
              No Roles
            </Badge>
          )}
        </Flex>
      ),
    },
    {
      key: "actions",
      header: "Aksi",
      cell: (user) => (
        <div className="flex justify-end gap-2">
          <Button size="xs" icon={FiEdit} variant="light" color="gray" onClick={() => handleOpenEditModal(user.id)} title="Edit user" />
          <Button size="xs" icon={FiTrash2} variant="light" color="rose" onClick={() => handleOpenDeleteConfirm(user.id, user.nama_lengkap)} title="Hapus user" disabled={user.email.toLowerCase() === "admin@admin.com"} />
        </div>
      ),
      className: "text-right",
      cellClassName: "text-right",
    },
  ];

  if (isLoading) {
    return <Text className="p-6">Memuat daftar member...</Text>;
  }

  const selectedUsersData = users.filter((u) => selectedUserIds.has(u.id));

  return (
    <>
      <div className="p-6 sm:p-10 space-y-6">
        <Flex justifyContent="between" alignItems="center">
          <Flex alignItems="center" className="space-x-3">
            <Icon icon={FiUsers} size="lg" variant="light" color="gray" />
            <div>
              <Title>Member Management</Title>
              <Text>Lihat daftar pengguna dan kelola peran mereka.</Text>
            </div>
          </Flex>
          <Flex className="space-x-2">
            <Button icon={FiSliders} variant="secondary" onClick={() => setIsBulkEditModalOpen(true)} disabled={selectedUserIds.size === 0} title={`Edit roles for ${selectedUserIds.size} selected users`}>
              Bulk Edit Roles ({selectedUserIds.size})
            </Button>
            <Button icon={FiPlus} onClick={() => setIsAddModalOpen(true)}>
              Tambah User
            </Button>
          </Flex>
        </Flex>

        {/* --- Filter Bar --- */}
        <Card>
          <Flex className="space-x-4">
            <TextInput icon={FiSearch} placeholder={`Cari nama atau email...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="flex-grow max-w-lg" />
            <Text className="whitespace-nowrap">{filteredUsers.length} pengguna ditemukan</Text>
          </Flex>
        </Card>

        {/* --- Tabel User --- */}
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <AppResourceTable data={filteredUsers} isLoading={isLoading} columns={columns} emptyMessage={`Tidak ada pengguna ditemukan ${searchTerm ? `dengan filter "${searchTerm}"` : ""}.`} />
          </div>
        </Card>
      </div>

      {/* --- Render Modal Tambah --- */}
      <AddUserModal isOpen={isAddModalOpen} onClose={handleCloseModal} allRoles={roles} onSaveSuccess={handleAddUserSuccess} />

      {/* --- Modal Edit User --- */}
      <EditUserModal isOpen={isEditModalOpen} onClose={handleCloseModal} userId={editingUserId} allRoles={roles} onSaveSuccess={handleSaveUserSuccess} />

      {/* --- Modal Bulk Edit Roles --- */}
      {selectedUsersData.length > 0 && <BulkEditRolesModal isOpen={isBulkEditModalOpen} onClose={handleCloseModal} selectedUsers={selectedUsersData} allRoles={roles} onSave={handleBulkSaveRoles} isLoading={isSubmittingBulk} />}

      <ConfirmationDialog
        isOpen={deleteConfirm.isOpen}
        onClose={handleCloseDeleteConfirm}
        onConfirm={handleConfirmDelete}
        title="Konfirmasi Hapus User"
        message={`Apakah Anda yakin ingin menghapus user "${deleteConfirm.userName}"? Tindakan ini tidak dapat dibatalkan.`}
        isLoading={isDeleting}
      />
    </>
  );
}

export default MemberPage;
