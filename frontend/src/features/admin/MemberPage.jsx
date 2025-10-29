// frontend/src/features/admin/MemberPage.jsx

import React, { useState, useEffect, useMemo } from "react";
import { Card, Title, Text, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Button, Badge, MultiSelect, MultiSelectItem, Dialog, DialogPanel, TextInput } from "@tremor/react";
import apiClient from "../../api/api";
import { FiUsers, FiEdit, FiFilter, FiCheckSquare, FiSquare, FiSliders, FiSave, FiX, FiSearch, FiAlertTriangle } from "react-icons/fi"; // Tambah ikon

// Komponen Modal Edit (Mirip RolePermissionPage, tapi untuk assign role ke user)
const EditUserRolesModal = ({ isOpen, onClose, user, allRoles, onSave, isLoading }) => {
  const [selectedRoleIds, setSelectedRoleIds] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setSelectedRoleIds(user.role_ids.map(String)); // Set initial roles from user data
      setError("");
    }
  }, [user]);

  if (!user) return null; // Jangan render jika user null

  const handleSave = async () => {
    setError("");
    // Kirim ID user dan role_ids yang baru
    await onSave(user.id, selectedRoleIds.map(Number));
  };

  return (
    <Dialog open={isOpen} onClose={() => !isLoading && onClose()} static={true}>
      <DialogPanel>
        <Title>Edit Roles for: {user.nama_lengkap}</Title>
        <Text className="mt-1">{user.email}</Text>
        {error && <Text className="text-red-500 mt-2">{error}</Text>}

        <div className="mt-4">
          <label className="font-medium text-tremor-content-strong">Assign Roles *</label>
          <MultiSelect
            value={selectedRoleIds} // Array of strings
            onValueChange={setSelectedRoleIds} // Terima array of strings
            placeholder="Pilih satu atau lebih role..."
            className="mt-2"
            required
          >
            {allRoles.map((role) => (
              // Value pakai String(role.id)
              <MultiSelectItem key={role.id} value={String(role.id)}>
                {role.name} {role.description && `(${role.description})`}
              </MultiSelectItem>
            ))}
          </MultiSelect>
        </div>

        <div className="flex justify-end gap-2 mt-6 border-t pt-4">
          <Button variant="secondary" onClick={onClose} disabled={isLoading} icon={FiX}>
            Batal
          </Button>
          <Button onClick={handleSave} loading={isLoading} disabled={isLoading} icon={FiSave}>
            Simpan Perubahan
          </Button>
        </div>
      </DialogPanel>
    </Dialog>
  );
};

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
  const [editingUser, setEditingUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");
  const [searchTerm, setSearchTerm] = useState(""); // State filter search
  const [selectedUserIds, setSelectedUserIds] = useState(new Set()); // State untuk bulk select (pakai Set agar efisien)
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false); // State modal bulk edit

  const fetchData = async () => {
    // setIsLoading(true); // Jangan set true di sini agar tidak loading terus saat refresh
    try {
      const [usersRes, rolesRes] = await Promise.all([apiClient.get("/admin/users"), apiClient.get("/admin/roles")]);
      setUsers(usersRes.data);
      setRoles(rolesRes.data);
    } catch (error) {
      console.error("Gagal memuat data member/roles:", error);
      alert("Gagal memuat data pengguna atau roles.");
    } finally {
      setIsLoading(false); // Set false setelah fetch selesai
    }
  };

  useEffect(() => {
    setIsLoading(true); // Set loading true hanya saat load awal
    fetchData();
  }, []);

  // Filter user berdasarkan searchTerm
  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    const lowerSearchTerm = searchTerm.toLowerCase();
    return users.filter((user) => user.nama_lengkap.toLowerCase().includes(lowerSearchTerm) || user.email.toLowerCase().includes(lowerSearchTerm));
  }, [users, searchTerm]);

  // Handler untuk checkbox per baris
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

  // Handler untuk checkbox "Select All"
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedUserIds(new Set(filteredUsers.map((u) => u.id)));
    } else {
      setSelectedUserIds(new Set());
    }
  };

  // Cek apakah semua user (yang terfilter) terpilih
  const isAllSelected = filteredUsers.length > 0 && selectedUserIds.size === filteredUsers.length;

  const handleOpenEditModal = (userToEdit) => {
    setModalError("");
    setEditingUser(userToEdit);
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setIsBulkEditModalOpen(false); // Tutup juga modal bulk
    setEditingUser(null);
    setModalError("");
  };

  // Handler simpan role untuk SATU user
  const handleSaveRoles = async (userId, newRoleIds) => {
    setModalError("");
    setIsSubmitting(true);
    const payload = { role_ids: newRoleIds };
    try {
      await apiClient.put(`/admin/users/${userId}/roles`, payload);
      handleCloseModal();
      fetchData(); // Refresh data user
    } catch (error) {
      setModalError(error.response?.data?.msg || "Gagal menyimpan perubahan role.");
      setIsSubmitting(false); // Matikan loading jika gagal
      // Jangan tutup modal jika gagal
      // handleCloseModal();
    }
    // setIsSubmitting(false); // Pindah ke finally jika ada
  };

  // Handler simpan role untuk BANYAK user (bulk)
  const handleBulkSaveRoles = async (userIds, newRoleIds) => {
    setModalError("");
    setIsSubmitting(true);
    const payload = { role_ids: newRoleIds };
    let successCount = 0;
    let firstError = null;

    // Kirim request update satu per satu (atau buat endpoint bulk di backend)
    for (const userId of userIds) {
      try {
        await apiClient.put(`/admin/users/${userId}/roles`, payload);
        successCount++;
      } catch (error) {
        console.error(`Gagal update role untuk user ID ${userId}:`, error);
        if (!firstError) {
          firstError = error.response?.data?.msg || `Gagal update user ID ${userId}`;
        }
      }
    }

    setIsSubmitting(false);
    if (firstError) {
      setModalError(`Sebagian (${successCount}/${userIds.length}) berhasil. Error pertama: ${firstError}`);
      // Jangan tutup modal jika ada error
    } else {
      alert(`Roles berhasil diperbarui untuk ${successCount} pengguna.`);
      handleCloseModal();
      setSelectedUserIds(new Set()); // Kosongkan pilihan setelah bulk edit
      fetchData();
    }
  };

  if (isLoading) {
    return <Text className="p-6">Memuat daftar member...</Text>;
  }

  const selectedUsersData = users.filter((u) => selectedUserIds.has(u.id));

  return (
    <>
      <div className="p-6 sm:p-10">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <FiUsers className="w-7 h-7 text-gray-500" />
            <Title>Member Management</Title>
          </div>
          {/* Tombol Aksi Kanan Atas */}
          <div className="flex items-center gap-2">
            <Button
              icon={FiSliders}
              variant="secondary"
              onClick={() => setIsBulkEditModalOpen(true)}
              disabled={selectedUserIds.size === 0} // Aktif jika ada user dipilih
              tooltip={`Edit roles for ${selectedUserIds.size} selected users`}
            >
              Bulk Edit Roles ({selectedUserIds.size})
            </Button>
            {/* Tambah tombol Add User di sini nanti */}
          </div>
        </div>
        <Text className="ml-10 mb-6">
          {" "}
          {/* Tambah margin kiri & bawah */}
          Lihat daftar pengguna terdaftar dan kelola peran (roles) mereka dalam sistem.
        </Text>

        {/* Filter Bar */}
        <Card className="mb-6 sticky top-0 z-10 backdrop-blur-sm bg-white/80">
          {" "}
          {/* Buat sticky */}
          <div className="flex justify-between items-center">
            <TextInput
              icon={FiSearch}
              placeholder={`Cari berdasarkan nama atau email (${filteredUsers.length} hasil)...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full max-w-lg" // Batasi lebar search bar
            />
            {/* Placeholder untuk filter tambahan jika perlu */}
            <div></div>
          </div>
        </Card>

        {/* Tabel User */}
        <Card>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell className="w-12">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    aria-label="Select all users"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </TableHeaderCell>
                <TableHeaderCell>Nama Lengkap</TableHeaderCell>
                <TableHeaderCell>Email</TableHeaderCell>
                <TableHeaderCell>Roles</TableHeaderCell>
                <TableHeaderCell className="text-right">Aksi</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id} className={selectedUserIds.has(user.id) ? "bg-blue-50" : ""}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedUserIds.has(user.id)}
                      onChange={(e) => handleSelectUser(user.id, e.target.checked)}
                      aria-label={`Select user ${user.nama_lengkap}`}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{user.nama_lengkap}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {" "}
                      {/* Flex wrap agar badge rapi */}
                      {user.roles.length > 0 ? (
                        user.roles.map((roleName) => (
                          <Badge key={roleName} color={roleName.toLowerCase() === "admin" ? "red" : "blue"} size="xs">
                            {roleName}
                          </Badge>
                        ))
                      ) : (
                        <Badge color="gray" size="xs">
                          No Roles
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="xs" icon={FiEdit} variant="light" color="blue" onClick={() => handleOpenEditModal(user)} tooltip={`Edit roles for ${user.nama_lengkap}`} />
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-5 text-gray-500">
                    Tidak ada pengguna ditemukan {searchTerm && `dengan filter "${searchTerm}"`}.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Modal Edit Roles (Single User) */}
      {editingUser && <EditUserRolesModal isOpen={isEditModalOpen} onClose={handleCloseModal} user={editingUser} allRoles={roles} onSave={handleSaveRoles} isLoading={isSubmitting} />}

      {/* Modal Bulk Edit Roles */}
      {selectedUsersData.length > 0 && <BulkEditRolesModal isOpen={isBulkEditModalOpen} onClose={handleCloseModal} selectedUsers={selectedUsersData} allRoles={roles} onSave={handleBulkSaveRoles} isLoading={isSubmitting} />}
    </>
  );
}

export default MemberPage;
